const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
(async () => {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + fs.readdirSync('muestras').filter(n => n.startsWith('C.P'))[0])) }).promise;
  for (const i of [1, 2]) {
    const p = await doc.getPage(i), tc = await p.getTextContent();
    const t = core.normaliza(tc.items, p.getViewport({ scale: 1 }).height);
    console.log(i, JSON.stringify(t.filter(a => /Carga|EXPEDI|Recepci|Conforme/.test(a.s)).map(a => [a.s.slice(0, 20), Math.round(a.x), Math.round(a.y)])));
  }
})();
