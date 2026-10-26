const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  let f = path.join('dist', decodeURIComponent(req.url.split('?')[0]));
  if (f.endsWith(path.sep) || f === 'dist') f = path.join(f, 'index.html');
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
}).listen(8766, '127.0.0.1');

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('[ERROR]', e.message));
  await page.goto('http://127.0.0.1:8766/');
  await page.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), { timeout: 15000 });
  await page.reload();
  const cdp = await page.createCDPSession();
  const err = await cdp.send('Page.getInstallabilityErrors');
  console.log('Instalable:', err.installabilityErrors.length ? JSON.stringify(err.installabilityErrors) : 'sí');
  console.log('Service worker activo:', await page.evaluate(() => !!navigator.serviceWorker.controller));
  await page.setOfflineMode(true);
  await page.reload();
  console.log('Carga sin internet:', await page.$eval('h1', e => e.textContent));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
