// Catálogo y cotizador. Compartido entre navegador y servidor
// (el servidor siempre recalcula el precio, nunca confía en el cliente).

export const MATERIALS = [
  { id: 'lona', name: 'Lona 13 oz', pricePerM2: 180, note: 'Exterior · económica' },
  { id: 'vinil', name: 'Vinil adhesivo', pricePerM2: 260, note: 'Vidrios y paredes' },
  { id: 'coroplast', name: 'Coroplast 4 mm', pricePerM2: 340, note: 'Ligero · temporal' },
  { id: 'pvc', name: 'PVC 3 mm', pricePerM2: 480, note: 'Rígido · interior' },
  { id: 'mdf', name: 'MDF impreso', pricePerM2: 620, note: 'Decorativo' },
  { id: 'acrilico', name: 'Acrílico 6 mm', pricePerM2: 950, note: 'Premium · ideal LED' }
]

export const EXTRAS = [
  { id: 'ojillos', name: 'Ojillos metálicos', price: 40, per: 'pieza' },
  { id: 'bastidor', name: 'Bastidor metálico', price: 320, per: 'm2' },
  { id: 'laminado', name: 'Laminado UV', price: 90, per: 'm2' },
  { id: 'instalacion', name: 'Instalación', price: 450, per: 'pedido' },
  { id: 'control', name: 'Control remoto + dimmer', price: 280, per: 'pieza' }
]

// Precio de iluminación LED
export const LED_PRICING = {
  none: null,
  neon: { name: 'Neón LED flex', per: 'm2', price: 2200 },
  backlit: { name: 'Retroiluminación LED', per: 'm2', price: 1500 },
  perimeter: { name: 'Tira LED en contorno', per: 'ml', price: 280 }
}
export const LED_POWER_SUPPLY = { name: 'Fuente 12 V', price: 350 }

export const MIN_PRICE_PER_PIECE = 150

export const materialById = (id) => MATERIALS.find((m) => m.id === id) || MATERIALS[0]
export const extraById = (id) => EXTRAS.find((e) => e.id === id)

export function quantityDiscount(qty) {
  if (qty >= 50) return 0.2
  if (qty >= 20) return 0.12
  if (qty >= 10) return 0.08
  if (qty >= 5) return 0.05
  return 0
}

const round2 = (n) => Math.round(n * 100) / 100

// Especificación técnica de la iluminación (para cotizar y para el diagrama)
export function ledSpec({ widthCm, heightCm, led }) {
  const mode = led?.mode || 'none'
  const areaM2 = (widthCm / 100) * (heightCm / 100)
  const perimeterM = (2 * (widthCm + heightCm)) / 100
  if (mode === 'none') return null
  let spec
  if (mode === 'neon') {
    const meters = Math.max(1, round2(areaM2 * 6))
    spec = { mode, label: 'Neón LED flex 6×12 mm', quantity: `${meters} m aprox.`, watts: meters * 10 }
  } else if (mode === 'backlit') {
    const modules = Math.max(6, Math.ceil(areaM2 * 60))
    spec = { mode, label: 'Módulos LED 3 × 2835', quantity: `${modules} módulos`, watts: modules * 0.72 }
  } else {
    const meters = round2(perimeterM)
    const bulbs = Math.round(meters * 30)
    spec = { mode, label: 'Tira LED 2835 · 60 led/m', quantity: `${meters} m · ${bulbs} puntos`, watts: meters * 14.4 }
  }
  spec.watts = Math.ceil(spec.watts)
  spec.supplyWatts = [30, 60, 100, 150, 200, 300, 400, 600].find((w) => w >= spec.watts * 1.2) || Math.ceil(spec.watts * 1.2)
  return spec
}

export function quote({ widthCm, heightCm, material, extras = [], led, quantity = 1 }) {
  const qty = Math.max(1, Math.min(500, Math.round(Number(quantity) || 1)))
  const areaM2 = round2((widthCm / 100) * (heightCm / 100))
  const perimeterM = round2((2 * (widthCm + heightCm)) / 100)
  const mat = materialById(material)

  const materialCost = Math.max(MIN_PRICE_PER_PIECE, areaM2 * mat.pricePerM2)
  let perPiece = materialCost
  let perOrder = 0
  const lines = [{ label: `${mat.name} (${areaM2} m²)`, amount: round2(materialCost * qty) }]

  const ledPrice = LED_PRICING[led?.mode]
  if (ledPrice) {
    const ledCost = ledPrice.per === 'm2' ? Math.max(600, areaM2 * ledPrice.price) : perimeterM * ledPrice.price
    const total = ledCost + LED_POWER_SUPPLY.price
    perPiece += total
    lines.push({ label: `${ledPrice.name} + ${LED_POWER_SUPPLY.name}`, amount: round2(total * qty) })
  }

  for (const id of extras) {
    const ex = extraById(id)
    if (!ex) continue
    let amount
    if (ex.per === 'm2') {
      amount = areaM2 * ex.price
      perPiece += amount
      amount *= qty
    } else if (ex.per === 'pieza') {
      perPiece += ex.price
      amount = ex.price * qty
    } else {
      perOrder += ex.price
      amount = ex.price
    }
    lines.push({ label: ex.name, amount: round2(amount) })
  }

  const subtotal = perPiece * qty + perOrder
  const discountRate = quantityDiscount(qty)
  const discount = perPiece * qty * discountRate
  const total = subtotal - discount

  return {
    quantity: qty,
    areaM2,
    unitPrice: round2(perPiece),
    lines,
    subtotal: round2(subtotal),
    discountRate,
    discount: round2(discount),
    total: Math.round(total)
  }
}

export const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
