# Pone el icono del camión y la pantalla de arranque en el proyecto Android (android/app/src/main/res).
# Se vuelve a ejecutar si se regenera la carpeta android/.
from PIL import Image
import glob, os

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
res = os.path.join(raiz, 'android', 'app', 'src', 'main', 'res')
icono = Image.open(os.path.join(raiz, 'src', 'iconos', 'icon-512.png')).convert('RGBA')
mascara = Image.open(os.path.join(raiz, 'src', 'iconos', 'icon-maskable-512.png')).convert('RGBA')
AZUL = (30, 95, 216)

for dens, lado in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    d = os.path.join(res, 'mipmap-' + dens)
    icono.resize((lado, lado), Image.LANCZOS).save(os.path.join(d, 'ic_launcher.png'))
    icono.resize((lado, lado), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_round.png'))
    # icono adaptable: 108dp con la zona segura en el centro (el dibujo «maskable» ya deja margen)
    fg = int(lado * 108 / 48)
    mascara.resize((fg, fg), Image.LANCZOS).save(os.path.join(d, 'ic_launcher_foreground.png'))

with open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w', encoding='utf-8') as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1E5FD8</color>\n</resources>\n')

# pantalla de arranque: fondo azul con el camión en el centro
for p in glob.glob(os.path.join(res, 'drawable*', 'splash.png')):
    w, h = Image.open(p).size
    s = Image.new('RGB', (w, h), AZUL)
    lado = int(min(w, h) * 0.35)
    s.paste(icono.resize((lado, lado), Image.LANCZOS), ((w - lado) // 2, (h - lado) // 2), icono.resize((lado, lado), Image.LANCZOS))
    s.save(p)
print('iconos Android listos')
