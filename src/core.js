
(function (root) {
  var RE_ALBARAN = /\b\d{2}AL\d{6}\b/;
  var RE_CODIGO = /^[A-Z]{2}\d{5,7}$/;
  var RE_CANT = /^\d{1,3}(\.\d{3})*,\d{3}$/;

  function num(s) { return parseFloat(s.replace(/\./g, '').replace(',', '.')); }

  function normaliza(items, alto) {
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i], s = it.str.replace(/\s+/g, ' ').trim();
      if (!s) continue;
      out.push({ s: s, x: it.transform[4], y: alto - it.transform[5], w: it.width || 0, h: Math.abs(it.transform[3]) || 8 });
    }
    return out;
  }

  function pesoUnidad(u) {
    u = (u || '').toLowerCase().replace(/\s+/g, '');
    if (/^kg\.?$/.test(u)) return 1;
    if (/1\/2litr/.test(u)) return 0.5;
    var m = u.match(/(\d+(?:[.,]\d+)?)(kgs?|kilos?|litros?|litr|l|ml|gr|g)?/);
    if (!m) return null;
    var n = parseFloat(m[1].replace(',', '.')), un = m[2] || 'g';
    if (/^k/.test(un) || /^l/.test(un)) return n;
    return n / 1000;
  }

  function esCincoLitros(unidad) { return /^5\s*litros?$/i.test(unidad); }

  function parseAlbaran(items, alto) {
    var t = normaliza(items, alto);
    var texto = t.map(function (a) { return a.s; }).join(' ');
    var m = texto.match(RE_ALBARAN);
    var fm = texto.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
    var cm = texto.match(/Cuenta de pedido[\s.:]*(\d+)/);
    var res = { numero: m ? m[0] : null, fecha: fm ? fm[0] : null, cuenta: cm ? cm[1] : null, matricula: campo(t, 'Matr'), cliente: null, clienteBox: null, lineas: [] };

    var cab = t.filter(function (a) { return a.y < 190 && a.x < 250 && a.s !== 'Albarán'; }).sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    if (cab.length) {
      var y0 = cab[0].y, fila = cab.filter(function (a) { return Math.abs(a.y - y0) < 3; });
      res.cliente = fila.map(function (a) { return a.s; }).join(' ');
      var x0 = Math.min.apply(null, fila.map(function (a) { return a.x; }));
      var x1 = Math.max.apply(null, fila.map(function (a) { return a.x + a.w; }));
      res.clienteBox = { x: x0, y: y0, w: x1 - x0, h: 11 };
    }

    var cabTabla = t.filter(function (a) { return a.s === 'Producto'; })[0];

    var cuentaPed = t.filter(function (a) { return /^Cuenta de pedido/.test(a.s); })[0];
    var renglones = {};
    if (cuentaPed && cabTabla) t.forEach(function (a) {
      if (a.x >= 250 && a.y > cuentaPed.y + 4 && a.y < cabTabla.y - 4) (renglones[Math.round(a.y)] = renglones[Math.round(a.y)] || []).push(a);
    });
    var etiqueta = cuentaPed ? cuentaPed.x : 262;
    res.observacion = Object.keys(renglones).sort(function (a, b) { return a - b; }).map(function (k) {
      var r = renglones[k].sort(function (a, b) { return a.x - b.x; });
      return Math.abs(r[0].x - etiqueta) <= 8 ? r.map(function (a) { return a.s; }).join(' ') : '';
    }).filter(function (s) { return s && !/EXPEDICI|Bultos|Peso|Pedido|Cuenta|Matr[ií]cula|Fecha/i.test(s); }).join(' ');
    var yIni = cabTabla ? cabTabla.y + 8 : 0;
    var fin = t.filter(function (a) { return /^Base$|^Total$/.test(a.s) && a.y > yIni; }).sort(function (a, b) { return a.y - b.y; })[0];
    var yFin = fin ? fin.y : 1e9;
    var anclas = t.filter(function (a) { return a.x < 100 && RE_CODIGO.test(a.s) && a.y > yIni && a.y < yFin; })
      .sort(function (a, b) { return a.y - b.y; });
    anclas.forEach(function (an, i) {
      var yMax = i + 1 < anclas.length ? anclas[i + 1].y - 2 : yFin;
      var fila = t.filter(function (a) { return a.y >= an.y - 2 && a.y < yMax; });
      var desc = fila.filter(function (a) { return a.x >= 105 && a.x < 255 && a.y < an.y + 14; })
        .sort(function (a, b) { return a.y - b.y || a.x - b.x; }).map(function (a) { return a.s; }).join(' ');
      var cant = fila.filter(function (a) { return a.x >= 250 && a.x < 303 && RE_CANT.test(a.s) && Math.abs(a.y - an.y) < 3; })[0];
      var uni = fila.filter(function (a) { return a.x >= 303 && a.x < 342 && Math.abs(a.y - an.y) < 3; })
        .sort(function (a, b) { return a.x - b.x; }).map(function (a) { return a.s; }).join('');
      res.lineas.push({ codigo: an.s, desc: desc, cantidad: cant ? num(cant.s) : 0, unidad: uni, cinco: esCincoLitros(uni) });
    });

    res.total5L = 0;
    res.por5L = {};
    var hayOtros = false;
    res.lineas.forEach(function (l) {
      if (l.cinco) {
        res.total5L += l.cantidad;
        res.por5L[l.codigo] = res.por5L[l.codigo] || { codigo: l.codigo, desc: l.desc, cantidad: 0 };
        res.por5L[l.codigo].cantidad += l.cantidad;
      } else hayOtros = true;
    });
    res.subrayar = hayOtros || res.total5L === 0;
    return res;
  }

  function campo(t, nombre) {
    var a = t.filter(function (a) { return a.s.indexOf(nombre) === 0; })[0];
    if (!a) return null;
    var dos = t.filter(function (b) { return b.s === ':' && Math.abs(b.y - a.y) < 2 && b.x > a.x && b.x < a.x + 150; });
    var x = dos.length ? Math.max.apply(null, dos.map(function (b) { return b.x; })) + 6 : a.x + 95;
    return { x: x, y: a.y, h: a.h };
  }

  function tablaAlbaranes(t) {
    var filas = t.filter(function (a) { return a.x < 60 && RE_ALBARAN.test(a.s) && a.s.length < 12; }).sort(function (a, b) { return a.y - b.y; });
    if (!filas.length) return null;
    var tope = t.filter(function (a) { return /^RELACI[ÓO]N DE ART|^EXPEDICI[ÓO]N|^Carga:?$/.test(a.s) && a.y > filas[0].y; }).sort(function (a, b) { return a.y - b.y; })[0];
    var limite = tope ? tope.y - 14 : filas[filas.length - 1].y + 20;
    var cols = {}, cab = filas[0].y;
    t.forEach(function (a) { if (a.y < filas[0].y - 2 && a.y > filas[0].y - 30) { cols[a.s] = a.x; cab = Math.min(cab, a.y); } });
    var res = filas.map(function (f, i) {
      var arriba = f.y - 7.5, abajo;
      if (i + 1 < filas.length) abajo = filas[i + 1].y - 7.5;
      else {
        var ult = t.filter(function (a) { return a.y >= f.y && a.y < limite; }).reduce(function (m, a) { return Math.max(m, a.y); }, f.y);
        abajo = ult + 3;
      }
      var nom = {};
      t.forEach(function (a) {
        if (a.y >= f.y - 1 && a.y < abajo + 7.5 && a.x >= cols['Nombre de búsqueda'] - 1 && a.x < (cols['Bultos'] || 1e9) - 1) {
          var k = Math.round(a.y);
          nom[k] = nom[k] || { x0: a.x, x1: a.x + a.w, y: a.y - arriba, partes: [] };
          nom[k].x0 = Math.min(nom[k].x0, a.x); nom[k].x1 = Math.max(nom[k].x1, a.x + a.w);
          nom[k].partes.push(a);
        }
      });
      var lineas = Object.keys(nom).map(function (k) { return nom[k]; }).sort(function (a, b) { return a.y - b.y; });
      var busqueda = lineas.map(function (l) { return l.partes.sort(function (a, b) { return a.x - b.x; }).map(function (a) { return a.s; }).join(' '); }).join(' ');
      lineas.forEach(function (l) { delete l.partes; });
      return { numero: f.s, arriba: arriba, abajo: abajo, nombre: lineas, busqueda: busqueda };
    });
    return { filas: res, arriba: res[0].arriba, cabArriba: cab < filas[0].y ? cab - 8 : res[0].arriba, limite: limite, cols: { cliente: cols['Cliente'], nombre: cols['Nombre'], busqueda: cols['Nombre de búsqueda'], fecha: cols['entrega'] || cols['Fecha de'], bultos: cols['Bultos'], albaran: filas[0].x } };
  }

  function tablaArticulos(t) {
    var hdr = t.filter(function (a) { return a.s === 'Artículo'; })[0];
    if (!hdr) return null;
    var tope = t.filter(function (a) { return /^EXPEDICI[ÓO]N|^Carga:?$/.test(a.s) && a.y > hdr.y; }).sort(function (a, b) { return a.y - b.y; })[0];
    var limite = tope ? (/^Carga/.test(tope.s) ? tope.y - 58 : tope.y - 16) : hdr.y + 300;
    var cods = t.filter(function (a) { return a.x < 60 && RE_CODIGO.test(a.s) && a.y > hdr.y && a.y < limite; }).sort(function (a, b) { return a.y - b.y; });
    var filas = cods.map(function (c, i) {
      var fila = t.filter(function (a) { return Math.abs(a.y - c.y) < 2; });
      var cant = fila.filter(function (a) { return a.x > 380 && a.x < 446 && RE_CANT.test(a.s); })[0];
      var uni = fila.filter(function (a) { return a.x >= 446 && a.x < 520; })[0];
      return {
        codigo: c.s, arriba: c.y - 7.5, abajo: i + 1 < cods.length ? cods[i + 1].y - 7.5 : c.y + 4,
        cantidad: cant ? num(cant.s) : 0, cant: cant ? { x: cant.x, w: cant.w, y: cant.y - c.y + 7.5, h: cant.h } : null,
        unidad: uni ? uni.s : '', nombre: fila.filter(function (a) { return a.x > 70 && a.x < 240; }).map(function (a) { return a.s; }).join(' ')
      };
    });
    var cab = t.filter(function (a) { return a.y <= hdr.y + 1 && a.y > hdr.y - 15 && a.x > 20; }).reduce(function (m, a) { return Math.min(m, a.y); }, hdr.y);
    var tit = t.filter(function (a) { return /^RELACI[ÓO]N DE ART/.test(a.s) && a.y < hdr.y && a.y > hdr.y - 50; })[0];
    return { filas: filas, arriba: hdr.y + 3.5, cabArriba: cab - 8, tituloArriba: tit ? tit.y - 11 : null, limite: limite };
  }

  function campoPeso(t) {
    var l = t.filter(function (a) { return a.s === 'Peso'; })[0];
    if (!l) return null;
    var v = t.filter(function (a) { return Math.abs(a.y - l.y) < 2 && a.x > l.x && a.x < l.x + 90 && /^[\d.]+,\d+$/.test(a.s); })[0];
    return v ? { valor: num(v.s), x: v.x, y: v.y, w: v.w, h: v.h } : null;
  }

  function cuerpo(t, alto) {
    var obs = t.filter(function (a) { return /^Observaciones/.test(a.s); })[0];
    var exp = t.filter(function (a) { return /^EXPEDICI[ÓO]N/.test(a.s); })[0];
    var carga = t.filter(function (a) { return /^Carga:?$/.test(a.s); })[0];
    return { inicio: obs ? obs.y + 8 : 230, fin: exp ? exp.y - 16 : carga ? carga.y - 58 : alto - 80 };
  }

  function campoPagina(t) {
    var l = t.filter(function (a) { return a.s === 'Página'; })[0];
    if (!l) return null;
    var fila = t.filter(function (a) { return Math.abs(a.y - l.y) < 2 && a.x > l.x + 40 && a.x < l.x + 200 && /^(\d+|de)$/.test(a.s); }).sort(function (a, b) { return a.x - b.x; });
    return fila.length === 3 && fila[1].s === 'de' ? fila.map(function (a) { return { s: a.s, x: a.x, y: a.y, w: a.w, h: a.h }; }) : null;
  }

  function parseCarta(items, alto) {
    var t = normaliza(items, alto);
    var texto = t.map(function (a) { return a.s; }).join(' ');
    var dm = texto.match(/\bDEX\d+\b/);
    var om = texto.match(/Observaciones[\s.:]*([^\s.:].*?)\s+(?:RELACI[ÓO]N|Albar[áa]n\b|Art[íi]culo\b)/);
    var albaranes = [];
    (texto.match(new RegExp(RE_ALBARAN.source, 'g')) || []).forEach(function (n) { if (albaranes.indexOf(n) < 0) albaranes.push(n); });
    return { diario: dm ? dm[0] : null, ruta: om ? om[1] : null, albaranes: albaranes, matricula: campo(t, 'Matr'), conductor: campo(t, 'Conductor'), tabla: tablaAlbaranes(t), articulos: tablaArticulos(t), peso: campoPeso(t), cuerpo: cuerpo(t, alto), pagina: campoPagina(t) };
  }

  root.AlbCore = { parseAlbaran: parseAlbaran, parseCarta: parseCarta, normaliza: normaliza, pesoUnidad: pesoUnidad };
  if (typeof module !== 'undefined') module.exports = root.AlbCore;
})(typeof window !== 'undefined' ? window : globalThis);

