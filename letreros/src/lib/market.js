// Análisis de mercado (investigación de septiembre 2026). Precios públicos de la competencia
// tomados de tiendas en línea; cambian seguido: revísalos cada 3 meses.

export const MARKET_UPDATED = 'septiembre 2026'

export const SOURCES = {
  radox: { name: 'Magia Digital / MercadoLibre (Radox)', url: 'https://www.magia-digital.com.mx/MLM-1571625790-anuncio-letrero-luminoso-bar-radox-246-454-led-tipo-neon-_JM' },
  radoxProg: { name: 'World Cam de México (Radox 246-480)', url: 'https://worldcamdemexico.com/detalles_arreglos.php?ver=246-480' },
  mlProg: { name: 'MercadoLibre · letrero LED desplazable', url: 'https://www.mercadolibre.com.mx/letrero-led-de-publicidad-desplazable-programable-a-todo-col/p/MLM2014533266' },
  luminarte: { name: 'LuminArte', url: 'https://shop.luminarte.mx/' },
  electric: { name: 'Electric Neon', url: 'https://electricneon.com.mx/' },
  chidos: { name: 'Neones Chidos', url: 'https://neoneschidos.com/' },
  inegi: { name: 'INEGI · Censos Económicos 2024', url: 'https://www.inegi.org.mx/programas/ce/2024/' },
  mcv: { name: 'México ¿cómo vamos? · CE 2024', url: 'https://mexicocomovamos.mx/publicaciones/2025/07/censos-economicos-2024-como-vamos-con-la-estructura-productiva-del-pais/' },
  credence: { name: 'Credence Research · Signage lighting', url: 'https://www.credenceresearch.com/report/signage-lighting-market' },
  imarc: { name: 'IMARC · Mexico LED display', url: 'https://www.imarcgroup.com/mexico-led-display-market' },
  capterra: { name: 'Capterra México · reseñas', url: 'https://www.capterra.mx/blog/2681/confianza-en-resenas-online-en-mexico' },
  google: { name: 'Partoo · fotos en Perfil de Google', url: 'https://www.partoo.co/es/blog/todo-sobre-fotos-google-my-business/' }
}

// Competencia por segmento (precios al público en MXN, IVA incluido)
export const COMPETITORS = [
  {
    segment: 'Radox genérico (texto fijo)',
    who: 'Radox en MercadoLibre, ferreterías y papelerías',
    price: [139, 659],
    examples: 'Taxi $139 · Tacos $350 · Abierto $485 · Hamburguesa $595 · Bar $659',
    time: 'Inmediato',
    custom: 'No: solo textos de catálogo',
    source: 'radox'
  },
  {
    segment: 'Matriz programable',
    who: 'Radox 246-480 · importados en MercadoLibre / Amazon',
    price: [158, 1467],
    examples: 'Desplazable importado $158–$628 · Radox programable $1,467',
    time: '1–5 días',
    custom: 'Texto sí, pero se ve genérico',
    source: 'mlProg'
  },
  {
    segment: 'Neón LED flex a la medida',
    who: 'LuminArte, Electric Neon, Neones Chidos, Neonizados',
    price: [999, 1999],
    examples: 'LuminArte desde $1,025 · modelos $1,099–$1,980 · envío gratis desde $1,999 (Electric Neon)',
    time: '5–12 días hábiles',
    custom: 'Sí, con editor en línea y cotización por WhatsApp',
    source: 'luminarte'
  }
]

export const MARKET_FACTS = [
  { value: '7.06 M', label: 'establecimientos en México', note: '95.5 % son micronegocios (0–10 personas): el cliente ideal de un letrero LED', source: 'inegi' },
  { value: '44.6 %', label: 'son comercio', note: 'y 42.1 % servicios: tiendas, fondas, taquerías, estéticas, consultorios', source: 'mcv' },
  { value: '7.95 %', label: 'crecimiento anual', note: 'iluminación para letreros: USD 30.1 mil M (2024) → 55.6 mil M (2032); LatAm ≈ 7.8 %', source: 'credence' },
  { value: '11.9 %', label: 'crecimiento anual en México', note: 'mercado de pantallas y displays LED 2025–2033', source: 'imarc' },
  { value: '57 %', label: 'de compradores en México', note: 'considera las reseñas esenciales para decidir; 80 % valora ver fotos del producto', source: 'capterra' },
  { value: '+42 %', label: 'solicitudes de ruta', note: 'en perfiles de Google con fotos (y +35 % de clics al sitio)', source: 'google' }
]

// Diseños de referencia para comparar tu precio actual con el mercado
export const REFERENCE_SIGNS = [
  { name: 'Chico · “ABIERTO”', widthCm: 40, heightCm: 15, leds: 120, compare: [0, 2] },
  { name: 'Mediano · nombre del negocio', widthCm: 60, heightCm: 22, leds: 190, compare: [2] },
  { name: 'Grande · logo + texto', widthCm: 90, heightCm: 32, leds: 300, compare: [2] },
  { name: 'Mediano con marco LED', widthCm: 60, heightCm: 28, leds: 190, frame: 110, compare: [2] }
]

export const STRENGTHS = [
  'Personalizado de verdad con estilo de puntos tipo Radox: nadie más lo ofrece a la medida en línea',
  'Vista 3D, acabados reales (madera, mármol, metal) y prueba en foto del local antes de pagar',
  'Presupuesto formal con IVA, anticipo y aceptación en línea; seguimiento del pedido por folio',
  'Producción propia con diagrama, plantillas 1:1 y archivos para láser: costos y tiempos bajo control',
  'Funciona directo a 127 V (sin eliminador) o a 12 V más seguro'
]

export const RISKS = [
  'El Radox genérico cuesta $300–$650: hay que explicar por qué el tuyo vale más (a la medida, tu nombre, tu logo, garantía)',
  'El neón flex tiene fama y muchas reseñas en Google e Instagram: sin opiniones reales, el cliente desconfía',
  'Los importados programables son muy baratos; compite por diseño, acabado y servicio, no por precio',
  '127 V capacitiva no es aislada: vende instalación o la opción 12 V a quien la vaya a tocar seguido'
]

// Acciones recomendadas (se marcan como hechas en el panel)
export const ACTIONS = [
  { id: 'precio-chico', title: 'Letrero de entrada entre $690 y $990', detail: 'Arriba del Radox genérico y debajo del neón flex ($999+): “tu nombre en LED” como producto gancho.' },
  { id: 'resenas', title: 'Pedir opinión a cada cliente al entregar', detail: 'Botón “Pedir opinión” en el pedido: el cliente califica y sube foto desde su enlace. Publica solo lo real.' },
  { id: 'fotos', title: 'Foto real de cada letrero terminado', detail: 'Súbela en el pedido y márcalo en “Hecho por AP”. De día y de noche, instalado en el local.' },
  { id: 'google', title: 'Perfil de Empresa en Google con 20+ fotos', detail: 'Los perfiles con fotos reciben 42 % más solicitudes de ruta. Pide ahí también las reseñas.' },
  { id: 'entrega', title: 'Prometer entrega en 7 días o menos', detail: 'La competencia de neón tarda 5–12 días hábiles; ser más rápido es un argumento de venta.' },
  { id: 'garantia', title: 'Garantía escrita de 12 meses', detail: 'Ponla en los términos del presupuesto (Negocio → Términos). El neón flex suele ofrecer 1–2 años.' },
  { id: 'pagos', title: 'Pagos a meses o en quincenas', detail: 'LuminArte vende con pagos diferidos; ofrece anticipo + saldo o meses con tarjeta.' },
  { id: 'envio', title: 'Envío gratis desde $1,999', detail: 'Mismo umbral que Electric Neon; sube el ticket promedio.' },
  { id: 'ml', title: 'Publicar 5 modelos en MercadoLibre', detail: 'Taquería, café, barbería, abierto y baños con liga a “personaliza el tuyo” en tu web.' },
  { id: 'giros', title: 'Visitar 20 negocios por semana de un solo giro', detail: 'Empieza por taquerías, cafeterías, barberías y abarrotes: muchos, cercanos y ya usan letreros.' }
]
