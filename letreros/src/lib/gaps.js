// Qué le falta al negocio para vender más (se evalúa con los datos reales del panel)
import { DEFAULT_COSTS } from './costs.js'

export function gapAnalysis({ settings, orders = [] }) {
  const b = settings?.business || {}
  const photos = orders.reduce((a, o) => a + (o.photos?.length || 0), 0)
  const reviews = orders.filter((o) => o.review?.status === 'publicada').length
  const real = orders.filter((o) => o.status !== 'cancelado').length
  const costsReviewed = settings?.costs && JSON.stringify(settings.costs) !== JSON.stringify(DEFAULT_COSTS)
  return [
    { area: 'Contacto', title: 'WhatsApp del negocio', done: Boolean(b.whatsapp), impact: 'alto', how: 'Negocio → WhatsApp. Sin él no aparece el botón de WhatsApp ni la confirmación del pedido.' },
    { area: 'Cobro', title: 'Datos bancarios para el anticipo', done: Boolean(b.bank), impact: 'alto', how: 'Negocio → Datos para pago (banco, CLABE, titular). Salen en cada presupuesto.' },
    { area: 'Confianza', title: '3 fotos reales de trabajos terminados', done: photos >= 3, impact: 'alto', how: `Llevas ${photos}. Sube fotos en cada pedido terminado y márcalo en “Hecho por AP”.` },
    { area: 'Confianza', title: '3 opiniones publicadas', done: reviews >= 3, impact: 'alto', how: `Llevas ${reviews}. Usa “Pedir opinión por WhatsApp” al entregar.` },
    { area: 'Confianza', title: 'Enlace de reseñas de Google', done: Boolean(b.googleReviewUrl), impact: 'medio', how: 'Crea tu Perfil de Empresa en Google y pega el enlace “Pedir reseñas” en Negocio.' },
    { area: 'Redes', title: 'Instagram o Facebook', done: Boolean(b.instagram || b.facebook), impact: 'medio', how: 'Negocio → Instagram / Facebook. Publica las imágenes que genera “Descargar imagen”.' },
    { area: 'Contacto', title: 'Ciudad y dirección', done: Boolean(b.city), impact: 'medio', how: 'Negocio → Ciudad. Ayuda a salir en búsquedas locales y da confianza.' },
    { area: 'Números', title: 'Costos reales de tus proveedores', done: Boolean(costsReviewed), impact: 'alto', how: 'Proveedores → Costos y margen: pon lo que realmente pagas por LED, hojas y mano de obra.' },
    { area: 'Números', title: 'Precios revisados', done: Boolean(settings?.pricesUpdated), impact: 'medio', how: 'Precios: ajusta y guarda al menos una vez con tus costos reales.' },
    { area: 'Ventas', title: 'Primeros 5 pedidos', done: real >= 5, impact: 'alto', how: `Llevas ${real}. Usa Prospectos: 20 visitas por semana con muestra por WhatsApp.` },
    { area: 'Cobro', title: 'Pago en línea (tarjeta / meses)', done: b.installments > 0, impact: 'medio', how: 'Mercado Pago (link ≈ 3.49 % + $4 + IVA) o Clip (3.6 % + IVA). Activa “meses sin intereses” en Negocio; detalles en Proveedores → Cobro con tarjeta.' },
    { area: 'Marca', title: 'Dominio propio (.mx)', done: !/vercel\.app$|^localhost$|^127\./.test(window.location.hostname), impact: 'medio', how: 'Compra por ejemplo ap-letreros.mx (≈ $300–$600 al año) y conéctalo en Vercel → Domains.' },
    { area: 'Legal', title: 'Facturación (CFDI)', done: false, impact: 'medio', how: 'Muchos negocios piden factura: da de alta tu RFC en RESICO y usa un facturador (Facturama, Alegra) o tu contador.' },
    { area: 'Taller', title: 'Decidir cómo cortar (láser propio o servicio)', done: false, impact: 'medio', how: 'Proveedores → Equipo e inversión compara K40, CO2 60 W, diodo y corte por minuto con tu volumen.' },
    { area: 'Legal', title: 'Aviso de privacidad', done: true, impact: 'bajo', how: 'Listo en #/privacidad (se llena con los datos de Negocio).' }
  ]
}
