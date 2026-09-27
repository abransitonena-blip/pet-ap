# AP · Letreros LED

Web para que tus clientes diseñen su letrero en línea, vean el precio al instante y hagan su pedido,
más un **panel de administración** para controlar los pedidos, la cola de impresión y los letreros ya impresos.

## ✨ Qué incluye

**Letrero LED de puntos (`#/`, tipo Radox)**
- Escribe el texto (hasta 4 líneas), elige entre **30 fuentes** (bloque, moderna, display, script) y el color del LED por línea
- La app **convierte cada letra en puntos LED** con la fuente real:
  *trazo* (una línea por el centro, ideal para cursivas), *contorno* (letras gruesas), *relleno* o *matriz 5×7* clásica
- Separación entre LED, LED de 3/5/8 mm, placa (negro, humo, blanco, cristal, madera; acrílico, PVC o MDF)
- Encendido **fijo, parpadeo o secuencial** (letra por letra en 3 canales), con vista previa animada
- **Cálculo eléctrico** como las placas del repo de hardware:
  - 127 V capacitiva (placa B): cadenas ≤ 100 V, capacitor 224J/334J/474J por salida con `I = 240·C·(180 − Vtira)`;
    secuencial con placa A (NE555 + CD4017 + SCR)
  - 12 V eliminador: cadenas en serie con resistencia E12 a 15 mA
- En el admin: **diagrama de conexión** (recorrido de cada cadena S+ → S−, tabla de capacitores/resistencias,
  lista de materiales y advertencia de 127 V), plantilla de **barrenos 1:1** numerada en orden de cableado,
  DXF con barrenos del tamaño del LED, G-code y CSV con cadena y salida de cada punto


**Letrero impreso (`#/impreso`), minimalista**
- Vista previa en vivo sobre una pared, con medidas en cm y modo **☀ Día / ☾ Noche** para ver el LED encendido
- **3 colores por letrero** (fondo · texto · acento): 8 paletas en tendencia o colores propios
- **Iluminación LED**: neón LED, retroiluminado (halo) o tira LED en el contorno; el LED usa el color de acento
- Medidas rápidas (40×30 a 300×90, verticales y cuadradas) o personalizadas
- Hasta 6 líneas de texto: 10 tipografías, tamaño, espaciado, negritas/itálicas, color texto o acento, íconos
- 6 estilos de inicio, 6 materiales y extras, precio al instante con descuento por volumen
- Pedido con folio (`LT-0001`) y seguimiento en `#/seguimiento`

**Panel admin (`#/admin`), minimalista con indicadores LED**
- **Resumen:** KPIs y tablero de estados con LEDs (parpadea lo que se está imprimiendo)
- **Pedidos:** tabla con miniatura, búsqueda y filtros
- **Producción:** tablero Aprobado → Imprimiendo → Impreso
- **Impresos:** galería de letreros impresos/entregados (vista nocturna)
- **Archivos:** por cada pedido
  - **PNG** 6000 px para impresión
  - **SVG** vectorial a escala real (ancho/alto en cm)
  - **Diagrama técnico** SVG: plano con cotas, escala, 3 colores en HEX, tipografías, material,
    cantidad de LED, consumo en watts y fuente de poder recomendada
  - **PDF**: abre el diagrama listo para "Imprimir → Guardar como PDF" (A4 horizontal)
- **Producción** (escala real, en mm)
  - **Hojas 1:1** en Carta, Oficio, A4 o Tabloide: el letrero se divide en hojas con mapa de armado,
    10 mm para encimar, marcas de registro ⊕, línea de corte, **puntos LED numerados** y barra de 10 cm
    para verificar la escala. Modo *plantilla* (ahorra tinta) o *color completo*
  - **DXF** (capas `CORTE` y `LED`) para LightBurn, LaserGRBL, Inkscape o CAD
  - **G-code GRBL 1.1** (Arduino): marca los puntos LED y corta el contorno. Origen = esquina inferior izquierda
  - **CSV** con las coordenadas de cada punto

## 🚀 Uso local

```bash
cd letreros
npm install

# Terminal 1 – API (http://localhost:5001)
ADMIN_PASSWORD=tu-clave npm run server

# Terminal 2 – Frontend (http://localhost:3001)
npm run dev
```

Panel admin: http://localhost:3001/#/admin

## 📦 Producción (un solo servicio)

```bash
npm install
npm run build
ADMIN_PASSWORD=tu-clave ADMIN_SECRET=texto-largo-aleatorio PORT=5001 npm run server
```

El servidor Express sirve el frontend compilado (`dist/`) y la API en `/api`. Sirve en Render, Railway, un VPS, etc.

| Variable | Descripción |
| --- | --- |
| `ADMIN_PASSWORD` | Contraseña del panel (por defecto `admin123` – **cámbiala**) |
| `ADMIN_SECRET` | Firma las sesiones; si no la defines, las sesiones se cierran al reiniciar |
| `PORT` | Puerto del servidor (5001) |

Los pedidos se guardan en `server/data/orders.json`. En hosts con disco efímero (p. ej. Render gratis)
agrega un disco persistente o cambia `loadDb/saveDb` en `server/index.js` por una base de datos.

## ▲ Vercel

El proyecto ya incluye `vercel.json` y `api/index.js` (función serverless con la API).
En Vercel los pedidos se guardan en **Vercel Blob privado** (`letreros/orders.json`), porque el disco
de las funciones no es persistente.

1. Proyecto con *Root Directory* = `letreros`
2. Conecta un Blob store al proyecto (crea `BLOB_READ_WRITE_TOKEN`)
3. Variables: `ADMIN_PASSWORD` y `ADMIN_SECRET`

## 🔧 Láser con Arduino (GRBL)

El G-code usa `$32=1` (modo láser), `M3/M4` con potencia `S` y velocidad `F`.
Los valores por defecto (`S1000` corte, `S300` marcado, `F600`) son de ejemplo: ajústalos en
`gcode()` de `src/lib/production.js` o en tu programa emisor según tu láser y material.

## 🗂️ Estructura

```
letreros/
├── api/index.js             función de Vercel
├── server/app.js            API: pedidos, login admin, estadísticas
├── server/store.js          almacenamiento: archivo JSON o Vercel Blob
├── server/index.js          servidor Node local / VPS
└── src/
    ├── lib/design.js        modelo del letrero, plantillas, validación
    ├── lib/pricing.js       materiales, extras y cotizador (compartido con el servidor)
    ├── lib/status.js        estados de producción
    ├── lib/render.js        composición, efectos LED y exportación PNG
    ├── lib/files.js         descargas: SVG, diagrama, hojas, DXF, G-code, CSV
    ├── lib/production.js    hojas 1:1, DXF, G-code GRBL, CSV
    ├── lib/ledPoints.js     posición real (mm) de cada punto LED
    ├── lib/ledSign.js       letrero LED: modelo, cadenas, capacitores, materiales, precio
    ├── lib/ledText.js       texto → puntos LED (esqueleto, contorno, relleno, matriz 5×7)
    ├── components/          SignPreview (SVG), TechDiagram, StatusPill, SiteHeader
    └── pages/               LedEditor, Editor (impreso), Track, Admin
```

Precios, materiales y LED se editan en `src/lib/pricing.js`; paletas en `src/lib/design.js`; el servidor siempre recalcula el total.
