# 🪧 LetreroLab – Diseña e imprime letreros

Web para que tus clientes diseñen su letrero en línea, vean el precio al instante y hagan su pedido,
más un **panel de administración** para controlar los pedidos, la cola de impresión y los letreros ya impresos.

## ✨ Qué incluye

**Sitio público (`#/`)**
- Editor visual con vista previa en vivo sobre una pared (con medidas en cm)
- Hasta 6 líneas de texto: 10 tipografías, color, tamaño, negritas/itálicas, espaciado, alineación
- Íconos, fondo sólido o degradado, borde, esquinas redondeadas y efecto neón
- 6 plantillas (cafetería, neón, taquería, barbería, se vende, minimal)
- Medidas rápidas o personalizadas, 8 materiales (lona, vinil, coroplast, PVC, MDF, acrílico, caja de luz, neón LED) y extras
- Cotizador automático con descuento por volumen
- Descarga del diseño en PNG
- Pedido con folio (`LT-0001`) y página de seguimiento (`#/seguimiento`)

**Panel admin (`#/admin`)**
- **Resumen:** pedidos totales, por imprimir, imprimiendo, piezas y m² impresos, ventas, gráfica por estado
- **Pedidos:** tabla con miniatura del diseño, búsqueda y filtros por estado
- **Cola de impresión:** tablero Aprobado → Imprimiendo → Impreso con botones de un clic
- **Impresos:** galería de todos los letreros impresos/entregados
- Detalle de cada pedido: diseño grande, **PNG en alta resolución (6000 px) listo para imprimir**,
  cambio de estado, datos del cliente (tel/WhatsApp/correo), cotización, notas internas e historial

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
    ├── lib/render.js        composición + exportación PNG
    ├── components/          SignPreview (SVG), StatusPill, SiteHeader
    └── pages/               Editor, Track, Admin
```

Precios y materiales se editan en `src/lib/pricing.js`; el servidor siempre recalcula el total.
