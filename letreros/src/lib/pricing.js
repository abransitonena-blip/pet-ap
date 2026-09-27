// Catálogo y cotizador. Compartido entre navegador y servidor
// (el servidor siempre recalcula el precio, nunca confía en el cliente).

export const MATERIALS = [
  { id: 'lona', name: 'Lona front 13 oz', pricePerM2: 180, note: 'Exterior · económica' },
  { id: 'vinil', name: 'Vinil adhesivo', pricePerM2: 260, note: 'Vidrios y paredes' },
  { id: 'coroplast', name: 'Coroplast 4 mm', pricePerM2: 340, note: 'Ligero · temporal' },
  { id: 'pvc', name: 'PVC espumado 3 mm', pricePerM2: 480, note: 'Rígido · interior' },
  { id: 'mdf', name: 'MDF impreso', pricePerM2: 620, note: 'Decorativo' },
  { id: 'acrilico', name: 'Acrílico 3 mm', pricePerM2: 950, note: 'Acabado premium' },
  { id: 'cajaluz', name: 'Caja de luz LED', pricePerM2: 2800, note: 'Iluminado · exterior' },
  { id: 'neon', name: 'Neón LED flex', pricePerM2: 3600, note: 'Efecto neón real' }
]

export const EXTRAS = [
  { id: 'ojillos', name: 'Ojillos metálicos', price: 40, per: 'pieza' },
  { id: 'bastidor', name: 'Bastidor metálico', price: 320, per: 'm2' },
  { id: 'laminado', name: 'Laminado UV', price: 90, per: 'm2' },
  { id: 'instalacion', name: 'Instalación', price: 450, per: 'pedido' },
  { id: 'diseno', name: 'Revisión por diseñador', price: 200, per: 'pedido' }
]

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

export function quote({ widthCm, heightCm, material, extras = [], quantity = 1 }) {
  const qty = Math.max(1, Math.min(500, Math.round(Number(quantity) || 1)))
  const areaM2 = round2((widthCm / 100) * (heightCm / 100))
  const mat = materialById(material)

  const materialCost = Math.max(MIN_PRICE_PER_PIECE, areaM2 * mat.pricePerM2)
  let perPieceExtras = 0
  let perOrderExtras = 0
  const lines = [{ label: `${mat.name} (${areaM2} m²)`, amount: round2(materialCost * qty) }]

  for (const id of extras) {
    const ex = extraById(id)
    if (!ex) continue
    let amount
    if (ex.per === 'm2') {
      amount = areaM2 * ex.price
      perPieceExtras += amount
      amount *= qty
    } else if (ex.per === 'pieza') {
      perPieceExtras += ex.price
      amount = ex.price * qty
    } else {
      perOrderExtras += ex.price
      amount = ex.price
    }
    lines.push({ label: ex.name, amount: round2(amount) })
  }

  const subtotal = (materialCost + perPieceExtras) * qty + perOrderExtras
  const discountRate = quantityDiscount(qty)
  const discount = (materialCost + perPieceExtras) * qty * discountRate
  const total = subtotal - discount

  return {
    quantity: qty,
    areaM2,
    unitPrice: round2(materialCost + perPieceExtras),
    lines,
    subtotal: round2(subtotal),
    discountRate,
    discount: round2(discount),
    total: Math.round(total)
  }
}

export const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
