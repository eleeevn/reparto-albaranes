// Muestra lo que core.js lee de cada página de las cartas de porte: hueco del cuerpo, tablas y «Página X de N».
const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
(async () => {
  for (const f of fs.readdirSync('muestras').filter(n => n.startsWith('C.P'))) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + f)) }).promise;
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i), c = core.parseCarta((await p.getTextContent()).items, p.getViewport({ scale: 1 }).height);
      const r = n => n == null ? '-' : Math.round(n);
      console.log(f.slice(0, 18).padEnd(18), 'pág', i, '| cuerpo', r(c.cuerpo.inicio), '-', r(c.cuerpo.fin),
        '| alb', c.tabla ? `${c.tabla.filas.length} filas, cab ${r(c.tabla.cabArriba)}, 1ª ${r(c.tabla.arriba)}` : '-',
        '| art', c.articulos ? `${c.articulos.filas.length} filas, tít ${r(c.articulos.tituloArriba)}, cab ${r(c.articulos.cabArriba)}, 1ª ${r(c.articulos.arriba)}` : '-',
        '| pág', c.pagina ? c.pagina.map(a => a.s).join(' ') : '-');
    }
  }
})();
