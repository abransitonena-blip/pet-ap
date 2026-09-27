# 🪧 LetreroLab – Diseña e imprime letreros

Web para que tus clientes diseñen su letrero en línea, vean el precio al instante y hagan su pedido,
más un **panel de administración** para controlar los pedidos, la cola de impresión y los letreros ya impresos.

## ✨ Qué incluye

**Panel público (`#/`), minimalista**
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

## 🗂️ Estructura

```
letreros/
├── server/index.js          API: pedidos, login admin, estadísticas
└── src/
    ├── lib/design.js        modelo del letrero, plantillas, validación
    ├── lib/pricing.js       materiales, extras y cotizador (compartido con el servidor)
    ├── lib/status.js        estados de producción
    ├── lib/render.js        composición, efectos LED y exportación PNG
    ├── lib/files.js         SVG vectorial y diagrama técnico (SVG/PDF)
    ├── components/          SignPreview (SVG), TechDiagram, StatusPill, SiteHeader
    └── pages/               Editor, Track, Admin
```

Precios, materiales y LED se editan en `src/lib/pricing.js`; paletas en `src/lib/design.js`; el servidor siempre recalcula el total.
