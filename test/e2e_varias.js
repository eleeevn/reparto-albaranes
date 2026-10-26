// Prueba de carta de porte de varias páginas: mueve a la ruta con más albaranes los de todas las demás
// y genera; su carta tiene que salir en más páginas, sin texto aplastado.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Elige en el desplegable de una ruta «+ Añadir nuevo…», escribe el valor y lo añade (como haría una persona)
async function eligeNuevo(page, selector, valor) {
  await page.evaluate((sel) => { const s = document.querySelector(sel); s.value = '__nuevo__'; s.dispatchEvent(new Event('change', { bubbles: true })); }, selector);
  await page.waitForSelector('#modalNuevo:not([hidden])');
  await page.type('#nuevoValor', valor);
  await page.click('#nuevoOk');
  await page.waitForSelector('#modalNuevo', { hidden: true });
}

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
  // la ruta destino: la que más albaranes tiene (el nombre se lee de la pantalla)
  const destino = await page.evaluate(() => [...document.querySelectorAll('#rutas .card')]
    .map(c => ({ n: c.querySelector('h2').textContent.split(' ')[0], k: c.querySelectorAll('select[data-mover]').length }))
    .filter(x => !/^SIN/.test(x.n)).sort((a, b) => b.k - a.k)[0].n);
  // mover todo a esa ruta, select a select, hasta que no quede ninguno fuera
  for (;;) {
    const hecho = await page.evaluate((destino) => {
      const card = [...document.querySelectorAll('#rutas .card')].find(c => c.querySelector('h2').textContent.split(' ')[0] !== destino && c.querySelector('select[data-mover]'));
      if (!card) return false;
      const s = card.querySelector('select[data-mover]'), o = [...s.options].find(o => o.textContent === destino);
      s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }, destino);
    if (!hecho) break;
  }
  const dDest = await page.evaluate((destino) => [...document.querySelectorAll('#rutas .card')].find(c => c.querySelector('h2').textContent.split(' ')[0] === destino).querySelector('[data-cond]').dataset.cond, destino);
  await eligeNuevo(page, '[data-cond="' + dDest + '"]', 'CONDUCTOR C');
  console.log(await page.evaluate(() => [...document.querySelectorAll('#rutas .card')].map(c => c.querySelector('h2').textContent.split(' ')[0] + ': ' + Math.max(0, c.querySelectorAll('tr').length - 1) + ' alb.').join(' | ')));
  await page.click('input[name=modo][value=separados]');
  await page.click('#gen');
  await page.waitForFunction(() => /Listo/.test(document.querySelector('#avisos').innerText), { timeout: 300000 });
  console.log(await page.$eval('#resLista', e => e.innerText));
  await page.evaluate(() => [...document.querySelectorAll('#resLista button')].find(b => /Carta de porte - CONDUCTOR C.*pdf/.test(b.closest('tr').textContent)).click());
  await new Promise(r => setTimeout(r, 3000));
  console.log('Descargado:', fs.readdirSync(out));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
