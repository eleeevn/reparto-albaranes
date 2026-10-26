const puppeteer = require('puppeteer-core');
const path = require('path');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[ERROR]', e.message));
  await page.goto('file:///' + path.resolve('dist/Reparto.html').replace(/\\/g, '/'));
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('alb.listas', JSON.stringify({ cond: ['CONDUCTOR UNO', 'CONDUCTOR DOS', 'Peso:'], mat: ['0000 AAA', 'Bultos'] }));
    localStorage.setItem('alb.chofer', JSON.stringify({ RutaX: { conductor: 'Peso:', matricula: '0000 AAA' } }));
  });
  await page.reload();
  console.log('Listas al abrir:', await page.evaluate(() => localStorage.getItem('alb.listas')));
  console.log('Ruta recordada:', await page.evaluate(() => localStorage.getItem('alb.chofer')));
  await page.evaluate(() => { document.querySelector('#flota').open = true; });
  await page.type('#add-cond', 'Agencia:');
  await page.keyboard.press('Enter');
  console.log('Tras intentar añadir «Agencia:»:', await page.evaluate(() => JSON.parse(localStorage.getItem('alb.listas')).cond.join(', ')));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
