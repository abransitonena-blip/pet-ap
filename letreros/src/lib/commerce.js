// Datos de mercado para Comercio, Marketing y RRHH (investigación de septiembre 2026).
// Cifras públicas de cada plataforma o de fuentes secundarias: confírmalas antes de decidir.

export const RESEARCH_DATE = 'septiembre 2026'

// Canales de venta: comisión % + cargo fijo por venta (MXN, antes de IVA)
export const SALES_CHANNELS = [
  { id: 'web', name: 'Tu sitio + WhatsApp', pct: 0, fixed: 0, note: 'Sin comisión de canal; solo pagas el medio de cobro.', url: '' },
  {
    id: 'mercadolibre', name: 'MercadoLibre (Clásica)', pct: 13, fixed: 0,
    note: 'Clásica 8–16 % y Premium 12.5–20.5 % según categoría; sin cargo fijo desde $299. Retiene 2.5 % ISR + IVA. Desde marzo 2026 el costo fijo también depende de medidas y peso.',
    url: 'https://www.enretail.com/2026/03/11/mercado-libre-desde-el-12-de-marzo-nuevos-costos-canal-mayorista-y-rentabilidad-real/'
  },
  { id: 'amazon', name: 'Amazon México', pct: 15, fixed: 0, note: 'Tarifa por referencia 8–20 % (Hogar 15 %), mínimo $8; plan profesional $600/mes tras 12 meses gratis.', url: 'https://vender.amazon.com.mx/precios' },
  { id: 'tiktok', name: 'TikTok Shop México', pct: 6, fixed: 0, note: '6 % con impuestos; 0 % los primeros 60 días para vendedores nuevos; +8 % si usas su programa de envíos (desde ene-2026).', url: 'https://www.tiendanube.com/blog/tiktok-shop/' },
  { id: 'etsy', name: 'Etsy', pct: 6.5, fixed: 3.6, note: 'USD 0.20 por publicación + 6.5 % por transacción (incluye envío).', url: 'https://www.etsy.com/legal/fees/' },
  { id: 'facebook', name: 'Facebook Marketplace', pct: 0, fixed: 0, note: 'Publicar es gratis; Meta retiró el checkout nativo en 2025: el pago va a tu sitio o por transferencia.', url: 'https://feedonomics.com/blog/meta-removing-native-checkout/' }
]

// Medios de cobro: % + fijo (MXN) + IVA sobre la comisión cuando aplica
export const PAYMENT_FEES = [
  { id: 'spei', name: 'Transferencia SPEI / CoDi', pct: 0, fixed: 0, iva: false, note: 'Banxico no cobra; revisa lo que cobre tu banco.', url: 'https://fintoc.com/blog/pagos-sin-tarjeta-en-mexico-spei-codi-y-dimo' },
  { id: 'efectivo', name: 'Efectivo', pct: 0, fixed: 0, iva: false, note: '', url: '' },
  { id: 'mp', name: 'Mercado Pago (dinero al instante)', pct: 3.49, fixed: 4, iva: true, note: '3.19 % a 7 días, 2.95 % a 30 días; 3 MSI 4.69 %, 12 MSI 12.89 %.', url: 'https://www.mercadopago.com.mx/ayuda/costo-recibir-pagos_220' },
  { id: 'stripe', name: 'Stripe México', pct: 3.6, fixed: 3, iva: false, note: '+0.5 % con tarjeta internacional.', url: 'https://wise.com/mx/blog/comisiones-stripe-mexico' },
  { id: 'clip', name: 'Clip', pct: 3.6, fixed: 0, iva: true, note: 'Con meses sin intereses puede llegar a 27 %.', url: 'https://atempora.studio/blog/comisiones-clip-2026' },
  { id: 'conekta', name: 'Conekta', pct: 3.4, fixed: 3, iva: true, note: '', url: 'https://atempora.studio/blog/comisiones-clip-2026' },
  { id: 'paypal', name: 'PayPal México', pct: 3.95, fixed: 4, iva: true, note: '', url: 'https://atempora.studio/blog/comisiones-paypal-mexico-2026' }
]

// Lo que te queda de una venta según canal y medio de cobro
export function netFromSale(price, channel, payment) {
  const ch = Math.round(((price * channel.pct) / 100 + channel.fixed) * 100) / 100
  const payBase = (price * payment.pct) / 100 + payment.fixed
  const pay = Math.round(payBase * (payment.iva ? 1.16 : 1) * 100) / 100
  return { channel: ch, payment: pay, net: Math.round((price - ch - pay) * 100) / 100, pct: price ? Math.round(((price - ch - pay) / price) * 1000) / 10 : 0 }
}

// Publicidad: rangos de referencia en México (agencias; varían por giro y temporada)
export const AD_BENCHMARKS = [
  { name: 'Meta Ads · costo por clic', value: '$1.50 – $15', url: 'https://clayton.agency/es/blog/cuanto-cuesta-meta-ads-mexico/' },
  { name: 'Meta Ads · CPM', value: '$30 – $90 (sube a $120–160 en Buen Fin, Hot Sale y Navidad)', url: 'https://clayton.agency/es/blog/cuanto-cuesta-meta-ads-mexico/' },
  { name: 'Meta Ads · costo por compra', value: '$140 – $580', url: 'https://clayton.agency/es/blog/cuanto-cuesta-meta-ads-mexico/' },
  { name: 'Meta Ads · presupuesto de prueba', value: '$3,000 – $5,000 al mes', url: 'https://rableb.com/guias/presupuesto-minimo-para-meta-ads/' },
  { name: 'Google Ads · costo por clic (servicios locales)', value: '$3 – $15', url: 'https://www.clicktoaction.com.mx/blog/cuanto-cuesta-google-ads-mexico/' },
  { name: 'Conversión típica e-commerce México', value: '1 – 2 % de visitas', url: 'https://pricelabsolutions.com/blog/tasa-de-conversion-e-commerce-como-mejorarla/' },
  { name: 'Clientes que esperan respuesta en WhatsApp', value: '65 % en menos de 5 minutos', url: 'https://www.blip.ai/blog/es/whatsapp/estadisticas-whatsapp-marketing-latam/' },
  { name: 'Perfil de Google con fotos', value: '+42 % solicitudes de ruta, +35 % clics', url: 'https://datacomunicacion.com/2024/05/17/15-estadisticas-de-google-my-business-que-debes-conocer/' },
  { name: 'Cliente referido vs. otros', value: '4× más probabilidad de comprar', url: 'https://growsurf.com/statistics/referral-marketing-statistics/' }
]

// Fechas comerciales 2026–2027 (confirmadas donde hay fuente)
export const COMMERCE_DATES = [
  { date: '2026-11-13', end: '2026-11-17', name: 'El Buen Fin 2026', url: 'https://www.informador.mx/economia/buen-fin-2026-estos-son-todos-los-dias-que-duraran-las-ofertas-20260928-0085.html' },
  { date: '2026-12-12', name: 'Guadalupe–Reyes: fachadas y regalos de temporada', url: '' },
  { date: '2026-12-25', name: 'Navidad', url: '' },
  { date: '2027-01-06', name: 'Día de Reyes', url: '' },
  { date: '2027-02-14', name: '14 de febrero: parejas, cafeterías y florerías', url: '' },
  { date: '2027-05-10', name: 'Día de las Madres', url: '' },
  { date: '2027-05-24', name: 'Hot Sale 2027 (fecha estimada: fin de mayo; en 2026 fue 25-may a 2-jun)', url: 'https://blog.amvo.org.mx/blog/confirmado-fechas-oficiales-y-datos-clave-del-hot-sale-2026' },
  { date: '2027-06-20', name: 'Día del Padre: barberías, taquerías, talleres', url: '' },
  { date: '2027-07-09', name: 'Fin de ciclo escolar SEP (regreso a clases a fines de agosto)', url: 'https://educacionbasica.sep.gob.mx/publica-sep-calendario-escolar-2026-2027-para-educacion-basica-y-normal/' },
  { date: '2027-09-15', name: 'Fiestas patrias', url: '' }
]

// Tácticas de marketing con respaldo
export const TACTICS = [
  { title: 'Reels / TikToks del proceso y del letrero encendido', how: 'Graba el armado y el “momento de prenderlo”. Publica 3 por semana.', url: 'https://neonsign.com/from-storefront-to-tiktok-how-businesses-are-going-viral-with-neon-signs/' },
  { title: 'Contenido de clientes (UGC)', how: 'Pide foto etiquetando tu cuenta a cambio de un cupón para su siguiente compra.', url: 'https://voodooneon.com/blogs/voodoo/25-expert-tips-led-neon-backdrops-for-business' },
  { title: 'Alianzas con wedding planners, fotógrafos y salones', how: 'Comisión o precio especial por cada letrero de evento que te refieran.', url: 'https://customneon.com/wedding-vendors/' },
  { title: 'Perfil de Google Business con fotos reales', how: 'Sube fotos de cada trabajo terminado y pide reseñas en Google.', url: 'https://datacomunicacion.com/2024/05/17/15-estadisticas-de-google-my-business-que-debes-conocer/' },
  { title: 'Programa de referidos', how: 'Cupón personal para cada cliente: su amigo recibe descuento y él también.', url: 'https://growsurf.com/statistics/referral-marketing-statistics/' },
  { title: 'Responder WhatsApp en menos de 5 minutos', how: 'Asigna la tarea de atención por turnos en Tareas; usa respuestas rápidas.', url: 'https://www.blip.ai/blog/es/whatsapp/estadisticas-whatsapp-marketing-latam/' },
  { title: 'Recuperar presupuestos sin respuesta', how: 'A las 48 h manda la imagen del letrero en su local y un cupón con vencimiento.', url: 'https://chatsell.net/recuperar-carritos-abandonados-whatsapp-ecommerce-latam-conversion/' },
  { title: 'Campañas por temporada', how: 'Sube anuncios 2 semanas antes de Buen Fin y Navidad, cuando aún es barato el CPM.', url: 'https://clayton.agency/es/blog/cuanto-cuesta-meta-ads-mexico/' }
]

// Sueldos mensuales de referencia en México (promedios nacionales, 2026)
export const JOB_REFS = [
  { position: 'Armador / soldador de LED', area: 'produccion', monthly: 12670, range: '$8,500 – $18,900', url: 'https://mx.indeed.com/career/soldador/salaries' },
  { position: 'Operador de láser / CNC', area: 'produccion', monthly: 13700, range: '$12,800 – $14,600', url: 'https://www.erieri.com/salary/job/cnc-laser-operator/mexico' },
  { position: 'Diseñador gráfico', area: 'diseno', monthly: 10500, range: '$9,900 – $11,150', url: 'https://mx.computrabajo.com/salarios/diseno-grafico' },
  { position: 'Ejecutivo de ventas (base + comisión)', area: 'ventas', monthly: 11700, range: '$10,800 – $12,500', url: 'https://mx.indeed.com/career/ejecutivo-de-ventas/salaries' },
  { position: 'Community manager', area: 'marketing', monthly: 13000, range: '$8,000 – $13,000', url: 'https://mx.computrabajo.com/salarios/community-manager' },
  { position: 'Instalador', area: 'instalacion', monthly: 9900, range: '$9,200 – $10,700', url: 'https://mx.computrabajo.com/salarios/instalador' }
]

// Obligaciones del patrón en México (taller de 1–15 personas)
export const HR_DUTIES = [
  { title: 'Alta en el IMSS dentro de 5 días hábiles', url: 'https://leyes-mx.com/ley_del_seguro_social/15.htm' },
  { title: 'Recibo de nómina CFDI timbrado en cada pago', url: 'https://sdv.com.mx/compendio/ley-isr/articulo-99/' },
  { title: 'Contrato de trabajo por escrito (LFT arts. 24–25)', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf' },
  { title: 'Aguinaldo mínimo de 15 días antes del 20 de diciembre', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf' },
  { title: 'Vacaciones dignas: 12 días desde el primer año + prima de 25 %', url: 'https://www.cegid.com/lat/mx/nueva-reforma-laboral-mexico/vacaciones-dignas/' },
  { title: 'NOM-035 (hasta 15 trabajadores): política escrita, buzón de quejas y medidas contra la violencia laboral', url: 'https://www.gob.mx/stps/nom035/articulos/obligaciones-de-los-patrones' },
  { title: 'NOM-019: comisión de seguridad e higiene (aplica a todo centro de trabajo)', url: 'https://asinom.stps.gob.mx/upload/nom/34.pdf' },
  { title: 'PTU: 10 % de la utilidad fiscal, a más tardar 31 de mayo (personas morales)', url: 'https://www.siemprecontable.net/blog/reparto-utilidades-ptu-2026' },
  { title: 'Jornada: 48 h en 2026 → 46 h en 2027, 44 h en 2028, 42 h en 2029, 40 h en 2030', url: 'https://www.gob.mx/stps/documentos/reduccion-de-la-jornada-laboral-a-40-horas-preguntas-frecuentes' }
]

// Horas máximas por semana según el año (reforma publicada en 2026)
export const weeklyHoursFor = (year) => (year <= 2026 ? 48 : year >= 2030 ? 40 : 48 - 2 * (year - 2026))

export const MIN_WAGE_2026 = { general: 315.04, frontera: 440.87, url: 'https://www.bdomexico.com/es-mx/publicaciones/flash-fiscal/2026/incremento-al-salario-minimo-para-2026' }
