import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const core = require('../src/core.js');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
for (const [f,rx] of [['muestras/C.P RUTA A.pdf',/Matr|Conduc|Agencia|Peso|Bultos/],['muestras/RUTA A.pdf',/Matric|Número|Fecha|Pedido/]]) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(f)) }).promise;
  const p = await doc.getPage(1), vp = p.getViewport({scale:1}), tc = await p.getTextContent();
  const t = core.normaliza(tc.items, vp.height);
  t.forEach((a,i)=>{ if (rx.test(a.s)) console.log(f.slice(9,14), JSON.stringify(t.slice(i,i+3).map(b=>[b.s,Math.round(b.x),Math.round(b.y),Math.round(b.w)]))); });
}
