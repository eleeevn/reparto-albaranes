import glob, os, pymupdf

salida = os.path.join(os.path.dirname(__file__), 'salida')
for pdf in sorted(glob.glob(os.path.join(salida, '*.pdf'))):
    d = pymupdf.open(pdf)
    js = any('this.print' in d.xref_object(x) for x in range(1, d.xref_length()))
    print(os.path.basename(pdf), '|', len(d), 'páginas | título:', d.metadata.get('title'), '| imprimir al abrir:', js)
    pref = os.path.basename(pdf).split('.')[0]
    for i, p in enumerate(d):
        p.get_pixmap(dpi=100).save(os.path.join(salida, '%s_pag%d.png' % (pref, i + 1)))
