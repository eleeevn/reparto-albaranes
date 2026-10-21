const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
(async () => {
  for (const f of fs.readdirSync('muestras').filter(n => n.startsWith('C.P'))) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + f)) }).promise;
    let peso = null, filas = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i), tc = await p.getTextContent();
      const t = core.normaliza(tc.items, p.getViewport({ scale: 1 }).height);
      const txt = t.map(a => a.s).join(' ');
      const pm = txt.match(/Peso[\s.:]*([\d.,]+)/); if (pm && !peso) peso = pm[1];
      const hdr = t.find(a => a.s === 'Artículo');
      if (!hdr) continue;
      const codes = t.filter(a => a.x < 60 && /^[A-Z]{2}\d{5,7}$/.test(a.s) && a.y > hdr.y).sort((a, b) => a.y - b.y);
      if (i === 1 && f.includes('DIA')) console.log('hdr', JSON.stringify(t.filter(a => Math.abs(a.y - hdr.y) < 15).map(a => [a.s, Math.round(a.x), Math.round(a.y)])));
      for (const c of codes) {
        const row = t.filter(a => Math.abs(a.y - c.y) < 2).sort((a, b) => a.x - b.x);
        filas.push({ code: c.s, y: Math.round(c.y), pag: i, row: row.map(a => [a.s, Math.round(a.x), Math.round(a.w)]) });
      }
    }
    console.log('==', f, 'peso', peso);
    filas.forEach(r => console.log(r.pag, r.y, JSON.stringify(r.row)));
  }
})();
