const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
(async () => {
  for (const f of fs.readdirSync('muestras').filter(n => n.startsWith('C.P'))) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + f)) }).promise;
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i), tc = await p.getTextContent();
      const c = core.parseCarta(tc.items, p.getViewport({ scale: 1 }).height);
      const t = c.tabla;
      console.log(f, 'pag', i, t ? `filas ${t.filas.length} arriba ${t.arriba.toFixed(0)} limite ${t.limite.toFixed(0)} altos ${t.filas.map(r => (r.abajo - r.arriba).toFixed(1)).join(',')} cols ${JSON.stringify(t.cols)}` : 'sin tabla');
    }
  }
})();
