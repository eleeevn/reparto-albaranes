// Prueba de carta de porte de varias páginas: mueve a RutaB los albaranes de todas las demás rutas
// (≈39 clientes) y genera; la carta de RutaB tiene que salir en más páginas, sin texto aplastado.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve('test/salida_varias');
  fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f), { force: true });
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[ERROR]', e.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
  await page.goto('file:///' + path.resolve('dist/Reparto.html').replace(/\\/g, '/'));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const pdfs = fs.readdirSync('muestras').filter(f => f.endsWith('.pdf')).map(f => path.resolve('muestras', f));
  await (await page.$('#file')).uploadFile(...pdfs);
  await page.waitForFunction(() => document.querySelectorAll('#rutas .card').length >= 5, { timeout: 60000 });
  // mover todo a RutaB, select a select, hasta que no quede ninguno fuera
  for (;;) {
    const hecho = await page.evaluate(() => {
      const card = [...document.querySelectorAll('#rutas .card')].find(c => !/RutaB/.test(c.querySelector('h2').textContent) && c.querySelector('select[data-mover]'));
      if (!card) return false;
      const s = card.querySelector('select[data-mover]'), o = [...s.options].find(o => o.textContent === 'RutaB');
      s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    });
    if (!hecho) break;
  }
  await page.evaluate(() => {
    const c = [...document.querySelectorAll('#rutas .card')].find(c => /RutaB/.test(c.querySelector('h2').textContent));
    const i = c.querySelector('[data-cond]'); i.value = 'CONDUCTOR C'; i.dispatchEvent(new Event('change', { bubbles: true }));
  });
  console.log(await page.evaluate(() => [...document.querySelectorAll('#rutas .card')].map(c => c.querySelector('h2').textContent.split(' ')[0] + ': ' + Math.max(0, c.querySelectorAll('tr').length - 1) + ' alb.').join(' | ')));
  await page.click('input[name=modo][value=separados]');
  await page.click('#gen');
  await page.waitForFunction(() => /Listo/.test(document.querySelector('#avisos').innerText), { timeout: 300000 });
  console.log(await page.$eval('#resLista', e => e.innerText));
  await page.evaluate(() => [...document.querySelectorAll('#resLista button')].find(b => /Ruta B - Carta/.test(b.closest('tr').textContent)).click());
  await new Promise(r => setTimeout(r, 3000));
  console.log('Descargado:', fs.readdirSync(out));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
