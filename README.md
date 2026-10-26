# Reparto de albaranes

Aplicación para preparar el reparto diario: lee las cartas de porte y los albaranes en PDF, los agrupa por ruta, calcula los totales y genera los documentos listos para imprimir.

Funciona sin conexión y sin servidor: todo el procesamiento se hace en el dispositivo.

## Funciones

- Lectura de cartas de porte (de una o varias hojas) y albaranes en PDF; las rutas se toman de la propia carta.
- Asignación de los albaranes de **SIN RUTA**, con memoria de la ruta de cada cliente y aviso de los colocados automáticamente.
- Total de zumo de 5 L por ruta y, junto a cada cliente, su zumo de naranja normal y HPP (`- 5 / 2 H`).
- Subrayado de los clientes cuyo albarán incluye productos que no son zumo de 5 L.
- Movimiento de albaranes entre rutas: se recalculan la relación de albaranes, la de artículos y el peso de cada carta; las tablas pasan de hoja en hoja y se añaden hojas cuando hace falta.
- Detección de observaciones del albarán, con aviso en pantalla y traslado a la carta de porte.
- Posponer un albarán a otra fecha: sale del reparto, se guarda su PDF y se recuerda el día indicado.
- Conductores y matrículas guardados, seleccionables por ruta.
- Salida en PDF (carta y albaranes por separado, juntos por ruta o todo en un archivo) e imagen JPG de la primera hoja de cada carta.

## Uso

1. Abrir la aplicación y cargar los PDF del día (cartas de porte y albaranes).
2. Revisar los avisos y asignar los albaranes de SIN RUTA.
3. Elegir conductor y matrícula de cada ruta; mover o posponer albaranes si es necesario.
4. Elegir el formato de salida y pulsar **Generar PDF**; descargar o enviar los archivos.

Cada PDF se imprime como un trabajo independiente. El documento incluye la orden de impresión al abrirse (la respetan los visores compatibles, como Adobe Reader).

## Estructura

| Ruta | Contenido |
|---|---|
| `src/core.js` | Lectura de los PDF: campos, tablas y posiciones |
| `src/app.html` | Interfaz y generación de documentos |
| `src/sw.js`, `src/manifest.webmanifest`, `src/iconos/` | Aplicación web instalable |
| `build.js` | Construcción de `dist/` |
| `android/` | Proyecto Android (Capacitor) |
| `test/` | Pruebas automáticas |

## Desarrollo

Requisitos: Node.js 18 o superior y Microsoft Edge (para las pruebas).

```
npm install
node build.js
```

`node build.js` genera `dist/` con la aplicación en un único archivo (`index.html` y `Reparto.html`), incluyendo pdf.js 3.11 y pdf-lib 1.17.

### Pruebas

Las pruebas usan PDF de ejemplo en `muestras/` (no incluidos en el repositorio).

| Comando | Comprueba |
|---|---|
| `node test/e2e.js` | Flujo completo: carga, asignación, movimientos y generación |
| `node test/e2e_varias.js` | Carta de porte que ocupa varias hojas |
| `node test/e2e_pospuestos.js` | Posponer un albarán y su recordatorio |
| `node test/e2e_recordada.js` | Avisos de ruta recordada y observaciones |
| `node test/e2e_etiquetas.js` | Limpieza de conductores y matrículas no válidos |
| `node test/instalable.js` | Aplicación web instalable y uso sin conexión |
| `python test/paginas.py` | Conversión de los PDF generados a imágenes para revisarlos |

### Android

Requisitos: JDK 17 y SDK de Android 34. Las rutas se indican con `JAVA_HOME` y `ANDROID_HOME`, o en un archivo local `entorno.local.cmd` (no incluido en el repositorio).

```
apk.cmd
```

Genera `Reparto.apk` (identificador `app.reparto.albaranes`). Si se regenera la carpeta `android/`, ejecutar `python src/iconos_android.py` para el icono y la pantalla de inicio.

### Versiones

Al publicar una versión se actualiza el número en `build.js` (`VERSION_APP`, visible junto al título), en `android/app/build.gradle` (`versionCode` y `versionName`) y en `package.json`.

## Datos

- Los documentos se procesan en el dispositivo; no se envían a ningún servidor.
- Las preferencias (rutas de clientes, conductores, matrículas) se guardan en el almacenamiento local del navegador y los albaranes pospuestos en IndexedDB.
- Los PDF originales no se modifican: la aplicación genera documentos nuevos a partir de ellos.
