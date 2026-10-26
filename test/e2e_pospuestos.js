const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve('test/salida_pospuestos');
  fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f), { force: true });
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[ERROR]', e.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
  await page.goto('file:///' + path.resolve('dist/Reparto.html').replace(/\\/g, '/'));
  await page.evaluate(() => { localStorage.clear(); return new Promise(ok => { const r = indexedDB.deleteDatabase('reparto'); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); });
  await page.reload();
  const pdfs = fs.readdirSync('muestras').filter(f => f.endsWith('.pdf')).map(f => path.resolve('muestras', f));
  const carga = async () => {
    await (await page.$('#file')).uploadFile(...pdfs);
    await page.waitForFunction(() => document.querySelectorAll('#rutas .card').length >= 5, { timeout: 60000 });
  };
  const totalDia = () => page.evaluate(() => document.querySelector('[data-incl]').closest('.card').querySelector('.tot').textContent);
  let NUM = null;

  await carga();
  console.log('Antes:', await totalDia());
  NUM = await page.evaluate(() => [...document.querySelector('#rutas .card').querySelectorAll('tr')].find(tr => tr.querySelector('select[data-mover]') && +tr.children[3].textContent.replace(',', '.') > 0).querySelector('select').dataset.mover);
  await page.click('[data-posponer="' + NUM + '"]');
  console.log('Ventana posponer:', await page.$eval('#posQue', e => e.textContent), '| fecha propuesta', await page.$eval('#posFecha', e => e.value));
  await page.click('#posOk');
  await page.waitForFunction(() => /Pospuestos/.test(document.querySelector('#rutas').innerText), { timeout: 30000 });
  console.log('Después:', await totalDia());
  console.log('Tarjeta:', await page.evaluate(() => [...document.querySelectorAll('#rutas .card')].find(c => /Pospuestos/.test(c.innerText)).innerText.replace(/\s+/g, ' ')));
  console.log('Otros días:', await page.$eval('#futuros', e => (e.hidden ? '(oculto) ' : '') + e.innerText.replace(/\s+/g, ' ')));

  await page.evaluate(() => { const primera = document.querySelector('[data-incl]').closest('.card').querySelector('h2').textContent.split(' ')[0]; document.querySelectorAll('[data-incl]').forEach(x => { if (x.closest('.card').querySelector('h2').textContent.split(' ')[0] !== primera) { x.checked = false; x.dispatchEvent(new Event('change', { bubbles: true })); } }); });
  await page.click('input[name=modo][value=separados]');
  await page.click('#gen');
  await page.waitForFunction(() => /Listo/.test(document.querySelector('#avisos').innerText), { timeout: 200000 });
  await page.evaluate(() => [...document.querySelectorAll('#resLista button')].find(b => /Carta de porte/.test(b.closest('tr').textContent) && /pdf/.test(b.closest('tr').textContent)).click());
  await new Promise(r => setTimeout(r, 2500));

  await page.click('#limpiar');
  await carga();
  console.log('Recargado, sigue pospuesto:', await page.evaluate(() => /Pospuestos/.test(document.querySelector('#rutas').innerText)), '|', await totalDia());

  await page.evaluate((NUM) => new Promise(ok => {
    const r = indexedDB.open('reparto', 1);
    r.onsuccess = () => {
      const tx = r.result.transaction('pospuestos', 'readwrite'), s = tx.objectStore('pospuestos'), g = s.get(NUM);
      g.onsuccess = () => { const v = g.result; const d = new Date(); v.para = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); s.put(v); };
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), NUM);
  await page.reload();
  await page.waitForFunction(() => /pospuesto/.test(document.querySelector('#avisos').innerText), { timeout: 30000 });
  console.log('Recordatorio:', await page.$eval('#avisos', e => e.innerText.replace(/\s+/g, ' ')));
  await page.click('[data-posanade="' + NUM + '"]');
  await page.waitForFunction(() => /Añadido/.test(document.querySelector('#avisos').innerText), { timeout: 30000 });
  console.log('Tras añadir:', await page.$eval('#avisos', e => e.innerText.replace(/\s+/g, ' ').slice(0, 300)));
  console.log('Lista:', await page.$eval('#rutas', e => e.innerText.replace(/\s+/g, ' ').slice(0, 200)));
  console.log('Descargado:', fs.readdirSync(out));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
