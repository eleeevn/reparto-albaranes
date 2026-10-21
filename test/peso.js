const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const F = { 'kg.': 1, '5Litros': 5, '1litro': 1, '3Litros': 3, '750ml': .75, '1/2Litr': .5, 'Bja250': .25, 'Bolsa100': .1, 'Bolsa1': .1, 'Bolsa500': .5, 'Bolsa5': .5 };
(async () => {
  for (const f of fs.readdirSync('muestras').filter(n => n.startsWith('C.P'))) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + f)) }).promise;
    let peso = null, s = 0, otros = {};
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i), tc = await p.getTextContent();
      const t = core.normaliza(tc.items, p.getViewport({ scale: 1 }).height);
      const pm = t.map(a => a.s).join(' ').match(/Peso[\s.:]*([\d.,]+)/); if (pm && peso == null) peso = +pm[1].replace(/\./g, '').replace(',', '.');
      const hdr = t.find(a => a.s === 'Artículo'); if (!hdr) continue;
      for (const c of t.filter(a => a.x < 60 && /^[A-Z]{2}\d{5,7}$/.test(a.s) && a.y > hdr.y)) {
        const q = t.find(a => Math.abs(a.y - c.y) < 2 && a.x > 400 && a.x < 446 && /^[\d.]+,\d{3}$/.test(a.s));
        const u = t.find(a => Math.abs(a.y - c.y) < 2 && a.x >= 446 && a.x < 500);
        const n = +q.s.replace(/\./g, '').replace(',', '.');
        if (u.s in F) s += n * F[u.s]; else otros[c.s + ' ' + u.s] = n;
      }
    }
    console.log(f, '| peso', peso, '| calc', s.toFixed(3), '| resto', (peso - s).toFixed(3), JSON.stringify(otros));
  }
})();
