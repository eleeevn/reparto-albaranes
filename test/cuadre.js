const fs = require('fs'); const core = require('../src/core.js'); const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
(async () => {
  const albs = {}, cartas = [];
  for (const f of fs.readdirSync('muestras').filter(n => n.endsWith('.pdf'))) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('muestras/' + f)) }).promise;
    let carta = null;
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i), tc = await p.getTextContent(), h = p.getViewport({ scale: 1 }).height;
      if (f.startsWith('C.P')) {
        const c = core.parseCarta(tc.items, h);
        if (!carta) { carta = { f, albaranes: c.albaranes, peso: c.peso && c.peso.valor, art: {}, filas: 0, unid: {} }; cartas.push(carta); }
        (c.articulos ? c.articulos.filas : []).forEach(r => { carta.art[r.codigo] = (carta.art[r.codigo] || 0) + r.cantidad; carta.unid[r.codigo] = r.unidad; carta.filas++; });
        if (c.articulos) console.log(f, 'pag', i, 'filas', c.articulos.filas.length, 'hueco', Math.round(c.articulos.arriba), '-', Math.round(c.articulos.limite), 'peso', JSON.stringify(c.peso));
      } else {
        const a = core.parseAlbaran(tc.items, h);
        const x = albs[a.numero] = albs[a.numero] || { lineas: [] };
        x.lineas.push(...a.lineas);
      }
    }
  }
  for (const c of cartas) {
    const suma = {}; let pesoConocido = 0, desconocidas = 0;
    c.albaranes.forEach(n => (albs[n] ? albs[n].lineas : []).forEach(l => {
      suma[l.codigo] = (suma[l.codigo] || 0) + l.cantidad;
      const pu = core.pesoUnidad(l.unidad); if (pu == null) desconocidas += l.cantidad; else pesoConocido += l.cantidad * pu;
    }));
    const dif = Object.keys({ ...suma, ...c.art }).filter(k => Math.abs((suma[k] || 0) - (c.art[k] || 0)) > 0.0005).map(k => `${k}: alb ${suma[k] || 0} vs cp ${c.art[k] || 0} (${c.unid[k] || '?'})`);
    console.log('==', c.f, '| artículos', c.filas, '| diferencias:', dif.length ? dif.join('; ') : 'ninguna', '| peso cp', c.peso, '| peso por líneas', pesoConocido.toFixed(3), '| uds sin peso', desconocidas);
  }
})();
