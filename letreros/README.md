# AP · Letreros LED

Web para que tus clientes diseñen su letrero en línea, vean el precio al instante y hagan su pedido,
más un **panel de administración** para controlar los pedidos, la cola de impresión y los letreros ya impresos.

## ✨ Qué incluye

**Letrero LED de puntos (`#/`, tipo Radox)**
- Escribe el texto (hasta 4 líneas), elige entre **56 fuentes** (bloque, moderna, display, pixel, script, clásica) y el color del LED por línea
- **80 íconos LED** por categoría (comida, mascotas, negocios, señalética, decoración): taco, perro, huella, restaurante,
  café, baños, flechas, corazón… Se convierten en puntos siguiendo su trazo; van a la izquierda o derecha del texto o solos
- **Modelos** listos (taquería, café, pet shop, baños, salida, open, pizza, barbería, mesa)
- **Base**: forma (recto, redondeado, cápsula, círculo, arco, hexágono) y montaje (pared, colgante o base LED de mesa);
  el contorno real y los barrenos de montaje salen en plantillas, DXF (capa `MONTAJE`) y G-code
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


**Vista 3D realista**
- La placa se ve con grosor, sombra en la pared y **gira con el mouse o el dedo**
- LED con domo de cristal, brillo y reflejo; de noche la luz se proyecta sobre la placa y la pared
- Separadores metálicos en el montaje de pared
- **Pruébalo en tu local**: el cliente sube una foto de su fachada, arrastra el letrero y ajusta el tamaño

**Acabados, fondos y combinaciones**
- **15 acabados de placa** con textura realista a escala real: color liso, madera (pino, roble, nogal),
  mármol, concreto, pizarra, terrazo, fibra de carbono, aluminio cepillado, espejo, oro, oro rosa y cobre;
  precio por m² editable en el panel
- **Relieve con luz real** (mapa de alturas + luz difusa y especular): la veta de la madera, el poro del concreto,
  las capas de la pizarra y el cepillado del aluminio tienen sombra y brillo; barniz/pulido en nogal, mármol y carbono
- **Día / Tarde / Noche** y **brillo regulable** en la vista previa (la tarde opaca un poco el LED y entibia la pared)
- **Tu logo en LED**: el cliente sube su logo (PNG/JPG, fondo blanco o transparente); se convierte en puntos con el
  mismo estilo que las letras (trazo, contorno o relleno) y viaja en el pedido como máscara comprimida
- **Bandera doble cara**: montaje con ménsula que sale de la fachada; duplica placa, LED, cadenas y lista de materiales
- **Varios letreros** (sucursales, mesas, puertas): mismo diseño con un texto por renglón, precio de cada uno,
  descuento por volumen y un folio por letrero (`POST /api/orders/batch`, envío cobrado una sola vez)
- **Catálogo imprimible** (panel → Prospectos → Imprimir catálogo): los modelos con medida y precio vigente, listo para PDF
- **Variantes**: el cliente guarda hasta 4 versiones y las compara (medida, LED, precio, la más económica)
- **Descargar imagen**: PNG del letrero sobre la pared elegida o sobre la foto de su local, con la luz de noche,
  medida y precio, para mandarlo por WhatsApp
- **12 fondos de pared**: rosa, blanco, arena, salvia, concreto, ladrillo, ladrillo blanco, duela de madera,
  azulejo, mármol, terrazo y muro verde (texturas SVG, sin descargar imágenes)
- **Combinar LED** por línea: un color, dos colores alternados por letra o arcoíris
- **Marco LED** sencillo o doble siguiendo la forma de la placa, con su propio color / combinación;
  en *secuencial* corre como marquesina. Se calcula en las cadenas, capacitores, diagrama y archivos
- Efecto **Respirar** (desvanecido suave con controlador PWM)
- **148 íconos** y modelos nuevos (Café madera, Bar, Boutique, Fiesta)

**Opiniones verificadas y fotos reales**
- Al entregar, el botón *Pedir opinión por WhatsApp* manda al cliente su enlace privado; ahí califica (1–5 ★), comenta y sube la foto de su letrero instalado
- Solo pueden opinar clientes con pedido terminado; cada opinión se revisa en *Opiniones* antes de publicarse (compra verificada, se muestra solo nombre e inicial)
- El taller sube fotos reales de cada trabajo en el pedido (hasta 12, se reducen a 1600 px); se guardan en Vercel Blob privado o en `data/fotos`
- La página pública muestra el promedio de estrellas, las opiniones con foto y la galería con fotos reales

**Confianza y venta**
- Barra de garantías en la página: garantía (meses), entrega en días, envío gratis desde cierto monto, anticipo o meses sin intereses
- Envío: se cobra solo si el pedido no llega al monto de envío gratis (el servidor lo agrega al presupuesto como *Envío a domicilio*)
- Tras una opinión de 4–5 ★, el cliente ve el botón para dejar reseña también en Google (enlace configurable)
- Pie de página con WhatsApp, Instagram, Facebook y seguimiento; SEO: descripción, vista previa para WhatsApp/Facebook (`public/og.jpg`) y datos estructurados
- *Ficha MercadoLibre* en cada pedido LED: copia título (≤ 60 caracteres) y descripción con medidas, garantía y liga al editor

**Proveedores, costos y margen (panel → Estrategia → Proveedores)**
- Directorio de proveedores reales en México (LED, electrónica, acrílico, PVC, MDF, vinil de texturas, envíos) + los tuyos
- Costos editables (LED, hojas, vinil, capacitores, placas, mano de obra…) → costo estimado y **margen** de cada letrero y
  de cada pedido (en el pedido, solo para Ventas/Precios)
- **Máquinas, corte por servicio, cobro con tarjeta y financiamiento**: láser CO2 (K40, 60–130 W), diodo 20 W, router CNC,
  talleres de corte por minuto (CDMX, GDL), Mercado Pago / Clip y créditos NAFIN
- **Equipo e inversión**: compara mandar a cortar ($15–$18/min) contra taladro, K40, diodo, CO2 60/100 W y CNC: tiempo por
  letrero (placa + barrenos), costo, ahorro al mes y meses para recuperar la inversión; avisa si el letrero no cabe o si
  el diodo no corta acrílico transparente
- **Lista de compras** automática con los pedidos por fabricar (hojas, LED por color, capacitores, placas)
- **Lo que falta** (en Mercado): lista priorizada que se marca sola con tus datos; documento `docs/analisis-faltantes.md`
- Aviso de privacidad (`#/privacidad`) enlazado en el pie y en el formulario de pedido
- Íconos de puntos LED en lugar de emojis; acción **WhatsApp** para mandar el diseño al negocio

**Prospectos (panel → Estrategia)**
- Registra los negocios que visitas (giro, contacto, zona, nota) y sigue el embudo: por visitar → visitado → muestra enviada → cotizado → cliente
- Cada prospecto tiene una **muestra con su nombre** sobre el modelo de su giro; se manda por WhatsApp con un toque
- Meta semanal de 20 visitas y tasa de conversión

**Mercado (panel → Estrategia)**
- Análisis con fuentes: tamaño del mercado (INEGI), competencia y precios (Radox, programables, neón flex), tu precio actual en vivo contra el mercado y plan de acción. Documento: `docs/analisis-mercado.md`

**Hecho por AP (galería pública)**
- En el panel marca un pedido con *Mostrar en “Hecho por AP”* y aparece en la página del cliente
- Solo se publica el diseño (nunca nombre ni teléfono); el cliente toca **Lo quiero así** y lo usa de base

**Pedir es fácil**
- Tamaños en palabras del cliente: *Chico, Mediano, Grande, Extra* (ancho final); las letras se ajustan solas
- Lo técnico (estilo de puntos, separación, LED, alimentación, márgenes) va en *Opciones avanzadas*, cerrado por defecto
- **Compartir diseño**: enlace con el diseño para mandarlo o terminarlo después
- Formulario con WhatsApp validado, forma de entrega (recoger, envío, instalación), fecha deseada y datos recordados
- Al pedir: pasos siguientes, **Ver mi presupuesto** y **Confirmar por WhatsApp** al negocio

**Presupuestos profesionales**
- Cada pedido genera un presupuesto formal con tu marca: conceptos, descuento por volumen, subtotal, **IVA**
  (incluido o aparte), **anticipo**, vigencia, entrega estimada, datos de pago y términos
- El cliente lo abre en un **enlace privado** (`#/presupuesto/<folio>/<token>`), lo descarga en PDF y lo **acepta**
  (el pedido pasa a *Aprobado*) o lo rechaza
- En el panel se ajusta: cargos extra (flete, urgencia…), descuento % o $, nota; se envía por WhatsApp o se copia el enlace

**Equipo y permisos (delegar)**
- El dueño entra con usuario vacío o `admin` + `ADMIN_PASSWORD`; agrega personas con su propio usuario y contraseña
- Roles rápidos (Gerente, Ventas, Producción, Precios) o permisos a la medida: ver pedidos y clientes, cambiar estado,
  presupuestos, producción y archivos, ver montos, **editar precios**, datos del negocio, eliminar, administrar equipo
- El servidor valida cada permiso; desactivar a alguien corta su acceso al instante; el historial dice quién hizo cada cambio

**Cobros y anticipos**
- En cada pedido: registra pagos (efectivo, transferencia, tarjeta, depósito), barra de avance con la marca del anticipo,
  saldo y estado (*sin pago, parcial, anticipo cubierto, pagado*); quitar un pago queda en el historial
- En el resumen: *Ventas, Cobrado y Por cobrar*; en la tabla de pedidos, el saldo de cada uno
- El presupuesto del cliente muestra lo pagado y el saldo pendiente

**Avisos de pedido nuevo**
- El panel revisa cada 20 s; al llegar un pedido muestra un aviso con botón *Ver*
- Con **Activar avisos** además suena un tono y sale una notificación del navegador

**Precios y negocio editables** (sin tocar código): placas, LED por color, armado, fuentes, formas, montajes,
letrero impreso, descuentos por volumen; IVA, anticipo, vigencia, WhatsApp, datos bancarios y términos

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

## ✅ Pruebas

```bash
cd letreros
npm test        # 32 pruebas: costos, proveedores, bandera, logo, pedido múltiple, prospectos, envío, enlaces seguros, opiniones y fotos, combinaciones de color, marco, acabados, precios, IVA, pagos, galería, cálculo eléctrico (tabla de la placa B), archivos láser, API y permisos
npm run check   # pruebas + build
```

GitHub Actions (`.github/workflows/letreros.yml`) corre `npm ci`, `npm test` y `npm run build` en cada cambio de `letreros/`.
La API limita intentos de acceso (10 / 10 min) y pedidos (15 / 10 min) por IP.

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

## Créditos

Íconos de [Lucide](https://lucide.dev) (licencia ISC). Taco, figuras de baño, chile y WC: dibujos propios.

## 🗂️ Estructura

```
letreros/
├── api/index.js             función de Vercel
├── server/app.js            API: pedidos, login admin, estadísticas
├── server/store.js          almacenamiento: archivo JSON o Vercel Blob
├── server/index.js          servidor Node local / VPS
├── tests/                   pruebas (node --test)
└── src/
    ├── lib/design.js        modelo del letrero, plantillas, validación
    ├── lib/pricing.js       materiales, extras y cotizador (compartido con el servidor)
    ├── lib/status.js        estados de producción
    ├── lib/render.js        composición, efectos LED y exportación PNG
    ├── lib/files.js         descargas: SVG, diagrama, hojas, DXF, G-code, CSV
    ├── lib/production.js    hojas 1:1, DXF, G-code GRBL, CSV
    ├── lib/ledPoints.js     posición real (mm) de cada punto LED
    ├── lib/ledSign.js       letrero LED: modelo, cadenas, capacitores, materiales, precio
    ├── lib/ledText.js       texto e íconos → puntos LED (esqueleto, contorno, relleno, matriz 5×7)
    ├── lib/icons.js         catálogo de íconos LED
    ├── lib/prices.js        precios editables, datos del negocio, permisos, totales con IVA
    ├── lib/customer.js      validación del cliente y formas de entrega
    ├── lib/ledModels.js     ideas / modelos por giro
    ├── lib/share.js         compartir diseño por enlace
    ├── components/          SignPreview (SVG), TechDiagram, StatusPill, SiteHeader
    └── pages/               LedEditor, Editor (impreso), Track, QuotePage, Admin, AdminSections
```

Los precios se editan desde el panel (sección *Precios*); los valores de fábrica están en `src/lib/prices.js`. El servidor siempre recalcula el total.
