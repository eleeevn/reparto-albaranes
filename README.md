# Reparto de albaranes

App de un solo archivo (`dist/Reparto.html`) para preparar la impresión diaria de cartas de porte (C.P.) y albaranes.

## Uso
1. Abrir `dist/Reparto.html` (doble clic; funciona sin internet, también en móvil).
2. Arrastrar todos los PDF del día (albaranes + cartas de porte).
3. Asignar ruta a los albaranes de SIN RUTA (se recuerda cliente → ruta para los días siguientes), o dejarlos y SIN RUTA se imprime como una ruta más.
4. Elegir conductor y matrícula por ruta en sus desplegables (se recuerdan por ruta; «+ Añadir nuevo…» guarda uno nuevo). El apartado «Conductores y matrículas guardados» permite añadir y eliminar (localStorage alb.listas; matrículas en mayúsculas). Las etiquetas de la C.P. («Peso:», «Agencia», cualquier cosa acabada en «:») no se admiten y se limpian solas al abrir. Mover clientes entre rutas si hace falta.
5. Elegir cómo salen los PDF (se recuerda) y «Generar PDF»: **separados** (por defecto: por ruta, `Na. Ruta X - Carta de porte - CONDUCTOR - fecha.pdf` y `Nb. Ruta X - Albaranes - …`), **junto** (`N. Ruta X - CONDUCTOR - fecha.pdf` con la C.P. delante de sus albaranes) o **todo** en un PDF (`Reparto - todas las rutas - fecha.pdf`). N = orden de impresión. Descargar uno a uno, «Descargar todos» o «Enviar todos…». Cada PDF lleva la orden de imprimir al abrir (OpenAction JavaScript): Adobe Reader la respeta; el visor de Edge/Chrome puede ignorarla (entonces Ctrl+P). Cada PDF es un trabajo de impresión: la impresora grapa cada uno aparte.

## App instalable
- `dist/` es una PWA (manifest, service worker, iconos): servida por https se instala en PC, Android e iPhone y funciona sin internet.
- Sin publicar todavía.
- En este PC: acceso directo «Reparto de albaranes» en el escritorio (Edge `--app` sobre `dist/Reparto.html`).
- Tras generar: botones Descargar y Enviar… (compartir del sistema, para WhatsApp/correo en el móvil).

## APK de Android
- `Reparto.apk` (Capacitor 6, id `app.reparto.albaranes`, firmado en modo depuración). Se instala pasándolo al móvil y permitiendo «instalar apps desconocidas».
- Publicado como release en GitHub (privado): v1.0 → https://github.com/propietario/reparto-albaranes/releases. Nueva versión: `apk.cmd` y `gh release create vX.Y Reparto.apk`.
- Versión: al publicar una nueva, subir VERSION_APP en build.js (se ve junto al título), versionCode/versionName en android/app/build.gradle y "version" en package.json.
- Regenerar tras cualquier cambio: `apk.cmd` (build.js + cap sync + gradle). Herramientas en `C:\herramientas` (JDK 17 + SDK 34).
- Dentro del APK: «Descargar» guarda en Documentos/Reparto (plugin Filesystem) y «Enviar todos…» usa el menú de compartir de Android (plugin Share; en el APK se muestra siempre porque navigator.canShare no existe en el WebView).
- Icono y pantalla de arranque: `python src/iconos_android.py` (si se regenera android/).
- iPhone: sin IPA (haría falta Mac + cuenta Apple). Para iPhone, la PWA publicada.

## Imágenes
- Casilla «Además, una imagen de la 1ª hoja de cada carta de porte» (marcada por defecto, se recuerda): JPG ~180 ppp por ruta, con todo lo escrito encima.

## Reglas
- No hay rutas fijas: el nombre sale de «Observaciones» de cada C.P. y los albaranes se emparejan por número. Cualquier ruta nueva con el mismo formato vale.
- Ruta de cada albarán: la C.P. que lo cita (Relación de albaranes), salvo que se mueva a mano.
- Total 5L: suma de las líneas con unidad `5Litros`, por albarán y por ruta (desglose por producto). Va en el recuadro superior izquierdo de la C.P.
- Cartas de porte de varias hojas: la relación de albaranes (y la de artículos) puede seguir en la 2ª hoja o más; se juntan los albaranes de todas las hojas de la misma carta (mismo Nº de diario).
- Cambios de ruta: el cuerpo de la C.P. (relación de albaranes y luego de artículos) se recoloca como texto que corre de página en página, SIN encoger: filas copiadas tal cual (de la C.P. propia o de la de origen), en orden de número/código; al llenarse una hoja sigue en la siguiente repitiendo la cabecera de columnas; si no cabe, se añaden hojas (copias de la última) y se reescribe «Página X de N». Ruta sin cambios: la C.P. se deja igual y solo se marcan las filas en la hoja donde están.
- Subrayado: una raya roja bajo el «Nombre de búsqueda» del cliente en la Relación de albaranes de la C.P. (no en el albarán), si su albarán lleva algún producto que no sea de 5L, o ninguno de 5L.
- Zumo por cliente: en la Relación de albaranes de la C.P., detrás del «Nombre de búsqueda» va el zumo de NARANJA 5L del albarán, en negrita, 7 pt: normal sin letra y HPP con H (« - 10», « - 3 H», « - 5 / 2 H»). Nunca pisa la columna Bultos: si no cabe se reduce hasta 5 pt y, en último caso, se apoya en el borde tapando el final del nombre. Limón y pomelo no cuentan aquí (sí en el total 5L del recuadro). Sin naranja 5L, nada.
- Observaciones: solo cuenta un renglón que EMPIEZA en la columna de las etiquetas (x de «Cuenta de pedido» ±8); los valores desbordados («123456X», «ABC») y bloques de datos (EXPEDICIÓN, Bultos, Peso…) no. Si un albarán trae un texto suelto así encima de la tabla («Entregar antes de las 9», «ENTREGAR POR LA MAÑANA»), en la 1ª hoja de la C.P. se escribe bajo «Agencia»: «OBSERVACIONES:» y una línea por cliente «NOMBRE DE BÚSQUEDA: observación». Viaja con el cliente si cambia de ruta. También se ve en la pantalla (Obs.).
- Posponer: en el desplegable de cada albarán, «Posponer a otro día…» (fecha por defecto: el día siguiente al del albarán, mínimo mañana). Sale del reparto de hoy como si se moviera fuera (se resta de su C.P.: fila, artículos, peso) y se guarda su PDF en IndexedDB (base «reparto», almacén «pospuestos»). Al recargar los PDF sigue fuera. El día marcado (o después) sale un recordatorio arriba con Añadir al reparto (lo carga y, si su ruta de antes existe ese día, va a ella), Descargar y Quitar. Solo avisa al abrir la app (no hay notificaciones).
- Orden de impresión: C.P. de la ruta + sus albaranes, luego la siguiente ruta (orden con ↑↓).
- Tipografía: todo lo que escribe la app va como el documento (Helvetica = Arial, negro, al tamaño de los textos de al lado); solo el subrayado es rojo. Matrícula y conductor SOLO en la carta de porte (no en los albaranes).
- Avisos: la pantalla muestra arriba los clientes de SIN RUTA colocados solos por ruta recordada (por si acaso), todas las observaciones (ruta · cliente: texto), una marca «⚠ N obs.» en cada ruta, y un recordatorio al generar.
- Los PDF originales no se alteran: solo se escribe encima (matrícula, conductor, recuadro de totales, subrayado, relación de albaranes).
- Al mover albaranes, la «Relación de artículos» de la C.P. se rehace: cantidades = C.P. original + albaranes que llegan − los que se van (todos los artículos, no solo el zumo). Orden por código; las filas a cero desaparecen; las nuevas se copian de la C.P. de origen y la cantidad se reescribe encima. 
- Peso de la C.P. = original + peso de los que llegan − los que se van. El peso de un albarán sale de sus líneas (kg., NLitros, 750ml, Bja250 = 250 g, Bolsa5kg…). Las unidades sin peso escrito («ud.», «Bdja», «Manojo») se estiman con el peso medio de esas unidades en su C.P. de origen. Comprobado: las tablas de artículos de las 5 C.P. de muestra coinciden exactamente con la suma de sus albaranes.

## Desarrollo
- `src/core.js` lectura de PDF (columnas por coordenadas), `src/app.html` pantalla y generación.
- `node build.js` → `dist/` (mete pdf.js 3.11.174 para leer y pdf-lib 1.17.1 para crear el PDF).
- El PDF final copia las páginas originales (vectoriales) con pdf-lib y escribe encima; las filas movidas se copian como franja recortada de la página de origen (embedPage + clip).
- `node test/leer.mjs` (lectura) y `node test/e2e_pospuestos.js` (posponer y recordatorio), `node test/e2e_varias.js` (todo a RutaB: carta de 4 hojas), `node test/cuerpo.js` (lo que se lee de cada hoja de C.P.), `node test/e2e.js` (prueba completa con Edge oculto, salida en `test/salida`) y `python test/paginas.py` (pasa el PDF a imágenes).
- Muestras reales en `muestras/` (solo en local: con datos de clientes, excluidas del repositorio por .gitignore).
