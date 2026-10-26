const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[ERROR]', e.message));
  await page.goto('file:///' + path.resolve('dist/Reparto.html').replace(/\\/g, '/'));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const pdfs = fs.readdirSync('muestras').filter(f => f.endsWith('.pdf')).map(f => path.resolve('muestras', f));
  const carga = async () => {
    await (await page.$('#file')).uploadFile(...pdfs);
    await page.waitForFunction(() => document.querySelectorAll('#rutas .card').length >= 5, { timeout: 60000 });
  };
  await carga();
  console.log('--- 1ª carga:\n' + await page.$eval('#avisos', e => e.innerText));
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('#rutas .card')].find(c => /SIN RUTA/.test(c.querySelector('h2').textContent));
    const primera = document.querySelector('#rutas .card h2').textContent.split(' ')[0];
    const s = card.querySelector('select[data-mover]'), o = [...s.options].find(o => o.textContent === primera);
    s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.click('#limpiar');
  await carga();
  console.log('--- 2ª carga:\n' + await page.$eval('#avisos', e => e.innerText));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
