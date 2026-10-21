import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const core = require('../src/core.js');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
if (!pdfjs) { console.log('sin pdfjs legacy mjs'); process.exit(1); }

const dir = path.resolve('muestras');
for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.pdf'))) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, f))), useSystemFonts: true }).promise;
  console.log('==', f, doc.numPages);
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i), vp = p.getViewport({ scale: 1 }), tc = await p.getTextContent();
    if (f.startsWith('C.P')) {
      const c = core.parseCarta(tc.items, vp.height);
      if (i === 1) console.log(JSON.stringify(c));
    } else {
      const a = core.parseAlbaran(tc.items, vp.height);
      console.log(a.numero, '|', a.cliente, '| 5L:', a.total5L, JSON.stringify(Object.values(a.por5L).map(x => x.cantidad)), '| otros:', a.lineas.filter(l => !l.cinco).length, '| SUBRAYAR:', a.subrayar);
    }
  }
}

