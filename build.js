const fs = require('fs');
const rd = f => fs.readFileSync(f, 'utf8');
const seguro = s => s.replace(/<\/script/gi, '<\\/script');
const VERSION_APP = '2.0';
const ahora = new Date(), dd = n => String(n).padStart(2, '0');
let html = rd('src/app.html').replace('/*VERSION*/', VERSION_APP + ' · ' + dd(ahora.getDate()) + '/' + dd(ahora.getMonth() + 1) + ' ' + dd(ahora.getHours()) + ':' + dd(ahora.getMinutes()));
html = html.replace('/*PDFJS*/', () => seguro(rd('node_modules/pdfjs-dist/build/pdf.min.js')));
html = html.replace('/*WORKER*/', () => seguro(rd('node_modules/pdfjs-dist/build/pdf.worker.min.js')));
html = html.replace('/*CORE*/', () => seguro(rd('src/core.js')));
html = html.replace('/*PDFLIB*/', () => seguro(rd('node_modules/pdf-lib/dist/pdf-lib.min.js')));

fs.mkdirSync('dist/iconos', { recursive: true });
fs.writeFileSync('dist/index.html', html);
fs.writeFileSync('dist/Reparto.html', html.replace(/<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?/g, ''));
fs.copyFileSync('src/manifest.webmanifest', 'dist/manifest.webmanifest');
fs.writeFileSync('dist/sw.js', rd('src/sw.js').replace('/*VERSION*/', 'reparto-' + Date.now()));
for (const f of fs.readdirSync('src/iconos')) fs.copyFileSync('src/iconos/' + f, 'dist/iconos/' + f);
fs.writeFileSync('dist/.nojekyll', '');
console.log('dist/ listo,', (html.length / 1e6).toFixed(2) + ' MB la app');
