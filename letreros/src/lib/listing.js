// Ficha lista para publicar un modelo en MercadoLibre (o Facebook Marketplace)
import { ANIMATIONS, FRAME_LINE, POWER, boardById, boardMaterialById, finishById, ledColorById } from './ledSign.js'

export function marketListing(design, price, business, link) {
  const text = design.lines.map((l) => l.text.trim()).filter(Boolean).join(' ')
  const finish = finishById(design.finish)
  const colors = [...new Set(design.lines.map((l) => (l.mix === 'arcoiris' ? 'Multicolor' : ledColorById(l.color).name)))]
  const title = `Letrero Led Personalizado ${text} ${design.widthCm}x${design.heightCm} Cm Tipo Radox`.replace(/\s+/g, ' ').slice(0, 60)
  const frame = design.dots.filter((p) => p[2] === FRAME_LINE).length
  const lines = [
    `✨ Letrero LED de puntos hecho a la medida: "${text}"`,
    '',
    '📐 CARACTERÍSTICAS',
    `• Medida: ${design.widthCm} × ${design.heightCm} cm`,
    `• ${design.dots.length} LED de ${design.ledMm} mm · color ${colors.join(', ').toLowerCase()}`,
    `• Placa: ${boardMaterialById(design.material).name} ${finish.id === 'liso' ? boardById(design.board).name.toLowerCase() : `con acabado ${finish.name.toLowerCase()}`}`,
    frame ? `• Marco LED ${design.frame.double ? 'doble' : 'sencillo'} alrededor` : null,
    `• Efecto: ${ANIMATIONS.find((a) => a.id === design.animation)?.name.toLowerCase()}`,
    `• Alimentación: ${POWER.find((p) => p.id === design.power)?.name}`,
    '',
    '✅ CON TU NOMBRE, LOGO O FRASE',
    'Lo fabricamos con el texto, colores y forma que quieras. Diseña el tuyo y ve el precio al instante:',
    link,
    '',
    '🚚 ENTREGA Y GARANTÍA',
    `• Listo en ${business.deliveryDays} días hábiles`,
    business.warrantyMonths ? `• Garantía de ${business.warrantyMonths} meses en LED y fuente` : null,
    business.freeShippingFrom && business.shippingCost ? `• Envío gratis desde $${business.freeShippingFrom.toLocaleString('es-MX')}` : null,
    '',
    `Precio de referencia: $${Math.round(price).toLocaleString('es-MX')} MXN`,
    `${business.name}${business.city ? ` · ${business.city}` : ''}`
  ].filter((l) => l !== null)
  return { title, description: lines.join('\n') }
}
