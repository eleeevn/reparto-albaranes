// Prueba de punta a punta con Edge oculto: carga las muestras, asigna los «sin ruta», mueve un cliente y genera el archivo.
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
  const out = path.resolve('test/salida');
  fs.mkdirSync(out, { recursive: true }); for (const f of fs.readdirSync(out)) fs.rmSync(path.join(out, f), { force: true });
  const browser = await puppeteer.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1400 });
  page.on('console', m => console.log('[consola]', m.text()));
  page.on('pageerror', e => console.log('[ERROR]', e.message));
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: out });

  await page.goto('file:///' + path.resolve('dist/Reparto.html').replace(/\\/g, '/'));
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const pdfs = fs.readdirSync('muestras').filter(f => f.endsWith('.pdf')).map(f => path.resolve('muestras', f));
  await (await page.$('#file')).uploadFile(...pdfs);
  await page.waitForFunction(() => document.querySelectorAll('#rutas .card').length >= 5, { timeout: 60000 });
  console.log(await page.$eval('#avisos', e => e.innerText));
  console.log('Generar desactivado con SIN RUTA sin asignar (debe ser false):', await page.$eval('#gen', b => b.disabled));

  // Las rutas se toman de la pantalla, en su orden (sin nombres escritos aquí): R[0] recibe el primero de SIN RUTA,
  // y el primero de R[2] se mueve a R[3]
  const R = await page.evaluate(() => [...document.querySelectorAll('#rutas .card h2')].map(h => h.textContent.split(' ')[0]).filter(n => !/^SIN/.test(n)));
  const tarjeta = (nombre) => `[...document.querySelectorAll('#rutas .card')].find(c => c.querySelector('h2').textContent.split(' ')[0] === ${JSON.stringify(nombre)})`;
  const opcion = (sel, texto) => page.evaluate((sel, texto) => {
    const s = document.querySelector(sel); const o = [...s.options].find(o => o.textContent === texto);
    s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true }));
  }, sel, texto);
  // Solo el primero de SIN RUTA va a R[0]; los otros se quedan y SIN RUTA se imprime como una ruta más.
  const sel = await page.evaluate(() => [...document.querySelectorAll('#rutas .card')].find(c => /SIN RUTA/.test(c.querySelector('h2').textContent)).querySelector('select[data-mover]').dataset.mover);
  await opcion(`select[data-mover="${sel}"]`, R[0]);
  const dSin = await page.evaluate(() => [...document.querySelectorAll('#rutas .card')].find(c => /SIN RUTA/.test(c.querySelector('h2').textContent)).querySelector('[data-cond]').dataset.cond);
  await eligeNuevo(page, '[data-cond="' + dSin + '"]', 'CONDUCTOR B');
  const primero = await page.evaluate(`${tarjeta(R[2])}.querySelector('select[data-mover]').dataset.mover`);
  await opcion(`select[data-mover="${primero}"]`, R[3]);
  // Conductor y matrícula (inventados) de R[0]
  const d0 = await page.evaluate(`${tarjeta(R[0])}.querySelector('[data-cond]').dataset.cond`);
  await eligeNuevo(page, '[data-cond="' + d0 + '"]', 'CONDUCTOR A');
  await eligeNuevo(page, '[data-mat="' + d0 + '"]', '1234 abc');
  console.log('Listas guardadas:', await page.evaluate(() => localStorage.getItem('alb.listas')));
  // apartado de gestión: añadir una matrícula con Enter, ver que sale en los desplegables y eliminarla
  await page.evaluate(() => { document.querySelector('#flota').open = true; });
  await page.type('#add-mat', '5678 def');
  await page.keyboard.press('Enter');
  console.log('Tras añadir 5678 DEF:', await page.evaluate(() => JSON.parse(localStorage.getItem('alb.listas')).mat.join(', ')),
    '| en el desplegable:', await page.evaluate(() => [...document.querySelector('select[data-mat]').options].map(o => o.textContent).join(' · ')));
  await page.evaluate(() => [...document.querySelectorAll('[data-quitalista="mat"]')].find(b => b.closest('tr').textContent.includes('5678 DEF')).click());
  console.log('Tras eliminarla:', await page.evaluate(() => JSON.parse(localStorage.getItem('alb.listas')).mat.join(', ')));
  console.log('Elegido en la ruta:', await page.evaluate((d0) => [document.querySelector('[data-cond="' + d0 + '"]').value, document.querySelector('[data-mat="' + d0 + '"]').value].join(' / '), d0));
  console.log(await page.$eval('#avisos', e => e.innerText));
  console.log(await page.$eval('#rutas', e => e.innerText.split('\n').filter(l => /Total 5L|Quitado|movido|recordada/.test(l)).join('\n')));
  await page.screenshot({ path: path.join(out, 'app.png'), fullPage: false }); // obs-pantalla
  console.log('AVISOS:', await page.$eval('#avisos', e => e.innerText));
  console.log('Recordados:', await page.evaluate(() => localStorage.getItem('alb.clienteRuta')));

  await page.click('#gen');
  await page.waitForFunction(() => /Listo/.test(document.querySelector('#avisos').innerText), { timeout: 180000 });
  console.log(await page.$eval('#avisos', e => e.innerText));
  console.log(await page.$eval('#resLista', e => e.innerText));
  await page.click('#descargar');
  await new Promise(r => setTimeout(r, 10000));
  fs.readdirSync(out).filter(n => n.endsWith('.pdf')).forEach(f => console.log('Archivo:', f, (fs.statSync(path.join(out, f)).size / 1e6).toFixed(2), 'MB'));
  for (const modo of ['junto', 'todo']) {
    await page.click('input[name=modo][value=' + modo + ']');
    await page.evaluate(() => { document.querySelector('#avisos').innerText = ''; });
    await page.click('#gen');
    await page.waitForFunction(() => /Listo/.test(document.querySelector('#avisos').innerText), { timeout: 180000 });
    console.log('--- modo', modo + ':\n' + await page.$eval('#resLista', e => e.innerText));
  }
  console.log('Modo recordado:', await page.evaluate(() => localStorage.getItem('alb.modo')));
  await browser.close();
  // Las páginas del PDF se pasan a imagen con test/paginas.py para revisarlas.
})().catch(e => { console.error(e); process.exit(1); });

