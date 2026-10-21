# Genera los iconos de la app (camión sobre fondo azul) en src/iconos/.
from PIL import Image, ImageDraw
import os

AZUL = (30, 95, 216)
BLANCO = (255, 255, 255)
dest = os.path.join(os.path.dirname(__file__), 'iconos')
os.makedirs(dest, exist_ok=True)


def icono(tam, margen_seguro):
    # Se dibuja a 4x y se reduce para suavizar bordes.
    S = tam * 4
    im = Image.new('RGBA', (S, S), AZUL + (255,))
    d = ImageDraw.Draw(im)
    m = S * margen_seguro          # zona segura (iconos «maskable» recortados en círculo)
    u = (S - 2 * m) / 100          # unidad sobre una rejilla de 100
    def r(x0, y0, x1, y1, rad=0, fill=BLANCO):
        d.rounded_rectangle([m + x0 * u, m + y0 * u, m + x1 * u, m + y1 * u], radius=rad * u, fill=fill)
    # documento detrás
    r(18, 8, 62, 44, 4)
    for y in (16, 24, 32):
        r(25, y, 55, y + 4, 2, AZUL)
    # caja del camión y cabina
    r(6, 40, 64, 76, 4)
    r(64, 50, 92, 76, 6)
    r(70, 55, 84, 64, 2, AZUL)
    # ruedas
    for cx in (24, 78):
        d.ellipse([m + (cx - 10) * u, m + 70 * u, m + (cx + 10) * u, m + 90 * u], fill=AZUL)
        d.ellipse([m + (cx - 6) * u, m + 74 * u, m + (cx + 6) * u, m + 86 * u], fill=BLANCO)
    return im.resize((tam, tam), Image.LANCZOS)


icono(192, 0.14).save(os.path.join(dest, 'icon-192.png'))
icono(512, 0.14).save(os.path.join(dest, 'icon-512.png'))
icono(512, 0.22).save(os.path.join(dest, 'icon-maskable-512.png'))
icono(180, 0.14).convert('RGB').save(os.path.join(dest, 'apple-touch-icon.png'))
print('iconos listos')
