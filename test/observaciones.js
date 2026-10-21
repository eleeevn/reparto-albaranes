// Busca textos sueltos entre la cabecera del albarán y la tabla (observaciones tipo «Entregar antes de las 9»).
const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
(async () => {
  for (const f of fs.readdirSync('muestras').filter(n => !n.startsWith('C.P') && n.endsWith('.pdf'))) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + f)) }).promise;
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i), tc = await p.getTextContent();
      const t = core.normaliza(tc.items, p.getViewport({ scale: 1 }).height);
      const cuenta = t.find(a => /^Cuenta de pedido/.test(a.s)), prod = t.find(a => a.s === 'Producto');
      if (!cuenta || !prod) { console.log(f, i, 'sin cabecera/tabla'); continue; }
      const obs = t.filter(a => a.x >= 250 && a.y > cuenta.y + 4 && a.y < prod.y - 4);
      const num = (t.map(a => a.s).join(' ').match(/\d{2}AL\d{6}/) || [''])[0];
      if (obs.length) console.log(f, 'pág', i, num, JSON.stringify(obs.map(a => [a.s, Math.round(a.x), Math.round(a.y), +a.h.toFixed(1)])));
    }
  }
  console.log('fin');
})();
