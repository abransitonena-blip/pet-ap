// Ajustes editables desde el panel: precios, datos del negocio y permisos del equipo.
// Módulo puro (sin DOM): lo usan el servidor (fuente de verdad) y el navegador.

export const DEFAULT_PRICES = {
  // Descuento por volumen: [piezas mínimas, % de descuento]
  volume: [
    [5, 5],
    [10, 8],
    [20, 12],
    [50, 20]
  ],
  led: {
    boards: { acrilico: 950, pvc: 520, mdf: 560 }, // por m²
    minBoard: 200,
    colors: { rojo: 2.5, ambar: 2.5, amarillo: 2.5, verde: 3, azul: 3.5, blanco: 3.5, calido: 3.5, rosa: 3.5, morado: 3.5 }, // por LED
    assembly: 2, // perforado y armado por LED
    boardB: 180, // fuente capacitiva 3 salidas
    boardA: 260, // secuenciador
    flasher: 120,
    supply12: { 1: 180, 2: 220, 3: 280, 5: 380, 10: 600, 20: 950 },
    resistor: 2, // por cadena a 12 V
    controller12: 260,
    shapes: { rect: 0, round: 0, pill: 60, circle: 120, arch: 120, hex: 120 },
    mounts: { pared: 0, colgante: 90, base: 280 },
    installation: 450
  },
  print: {
    materials: { lona: 180, vinil: 260, coroplast: 340, pvc: 480, mdf: 620, acrilico: 950 }, // por m²
    minPiece: 150,
    extras: { ojillos: 40, bastidor: 320, laminado: 90, instalacion: 450, control: 280 },
    light: { neon: 2200, backlit: 1500, perimeter: 280 },
    powerSupply: 350
  }
}

export const DEFAULT_BUSINESS = {
  name: 'AP letreros',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  ivaRate: 16,
  ivaIncluded: true,
  depositPct: 50,
  validityDays: 15,
  deliveryDays: 7,
  bank: '',
  terms:
    'Precios en pesos mexicanos. Para iniciar la producción se requiere el anticipo; el resto se paga contra entrega.\n' +
    'Garantía de 6 meses en LED y fuente de poder. Los colores en pantalla pueden variar ligeramente del producto final.'
}

// ---------- Permisos (delegar funciones) ----------
export const PERMISSIONS = [
  { id: 'pedidos', name: 'Ver pedidos y clientes' },
  { id: 'editar', name: 'Cambiar estado y notas' },
  { id: 'presupuestos', name: 'Ajustar y enviar presupuestos' },
  { id: 'produccion', name: 'Producción y archivos' },
  { id: 'ventas', name: 'Ver ventas y montos' },
  { id: 'precios', name: 'Editar precios' },
  { id: 'ajustes', name: 'Datos del negocio' },
  { id: 'eliminar', name: 'Eliminar pedidos' },
  { id: 'equipo', name: 'Administrar equipo' }
]
export const PERM_IDS = PERMISSIONS.map((p) => p.id)

export const ROLES = [
  { id: 'gerente', name: 'Gerente', perms: PERM_IDS.filter((p) => p !== 'equipo') },
  { id: 'ventas', name: 'Ventas', perms: ['pedidos', 'editar', 'presupuestos', 'ventas'] },
  { id: 'produccion', name: 'Producción', perms: ['pedidos', 'editar', 'produccion'] },
  { id: 'precios', name: 'Precios', perms: ['precios', 'ventas'] },
  { id: 'personalizado', name: 'Personalizado', perms: [] }
]

// ---------- Validación ----------
const num = (v, fallback, max = 1e6) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n * 100) / 100)) : fallback
}

// Mezcla precios recibidos con los predeterminados (solo claves conocidas, números ≥ 0)
export function mergePrices(input, defaults = DEFAULT_PRICES) {
  const out = {}
  for (const [k, def] of Object.entries(defaults)) {
    const v = input?.[k]
    if (k === 'volume') {
      const rows = Array.isArray(v) ? v : def
      out.volume = rows
        .filter((r) => Array.isArray(r) && r.length === 2)
        .map(([q, p]) => [Math.round(num(q, 0, 10000)), num(p, 0, 90)])
        .filter(([q, p]) => q >= 2 && p > 0)
        .sort((a, b) => a[0] - b[0])
        .slice(0, 8)
    } else if (def && typeof def === 'object') {
      out[k] = mergePrices(v, def)
    } else {
      out[k] = num(v, def)
    }
  }
  return out
}

const text = (v, max, fallback = '') => (typeof v === 'string' ? v.trim().slice(0, max) : fallback)

export function mergeBusiness(input) {
  const d = DEFAULT_BUSINESS
  const b = input || {}
  return {
    name: text(b.name, 60, d.name) || d.name,
    whatsapp: text(b.whatsapp, 20, d.whatsapp).replace(/[^\d+ ]/g, ''),
    email: text(b.email, 80, d.email),
    address: text(b.address, 160, d.address),
    city: text(b.city, 60, d.city),
    ivaRate: num(b.ivaRate, d.ivaRate, 30),
    ivaIncluded: typeof b.ivaIncluded === 'boolean' ? b.ivaIncluded : d.ivaIncluded,
    depositPct: num(b.depositPct, d.depositPct, 100),
    validityDays: Math.round(num(b.validityDays, d.validityDays, 365)),
    deliveryDays: Math.round(num(b.deliveryDays, d.deliveryDays, 365)),
    bank: text(b.bank, 300, d.bank),
    terms: text(b.terms, 2000, d.terms)
  }
}

// Datos del negocio que se pueden mostrar al público
export const publicBusiness = (b) => {
  const { name, whatsapp, email, address, city, ivaRate, ivaIncluded, depositPct, validityDays, deliveryDays } = b
  return { name, whatsapp, email, address, city, ivaRate, ivaIncluded, depositPct, validityDays, deliveryDays }
}

// Descuento por volumen según la tabla de precios
export function volumeDiscount(qty, prices = DEFAULT_PRICES) {
  let rate = 0
  for (const [q, p] of prices.volume || []) if (qty >= q) rate = p / 100
  return rate
}

// ---------- Totales del presupuesto (IVA, ajustes, anticipo) ----------
const r2 = (n) => Math.round(n * 100) / 100

export function normalizeAdjust(a) {
  const items = (Array.isArray(a?.items) ? a.items : [])
    .slice(0, 12)
    .map((i) => ({ label: text(i?.label, 80), amount: Math.round(Number(i?.amount) || 0) }))
    .filter((i) => i.label && i.amount && Math.abs(i.amount) <= 1e6)
  return {
    items,
    discountPct: num(a?.discountPct, 0, 100),
    discountAmt: num(a?.discountAmt, 0),
    note: text(a?.note, 600)
  }
}

export function computeTotals(quote, adjust, business) {
  const adj = normalizeAdjust(adjust)
  const extras = adj.items.reduce((s, i) => s + i.amount, 0)
  const gross = Math.max(0, quote.total + extras)
  const discount = Math.min(gross, Math.round((gross * adj.discountPct) / 100) + adj.discountAmt)
  const net = gross - discount
  const rate = business.ivaRate / 100
  let subtotal, iva, total
  if (business.ivaIncluded) {
    total = Math.round(net)
    subtotal = r2(total / (1 + rate))
    iva = r2(total - subtotal)
  } else {
    subtotal = r2(net)
    iva = r2(net * rate)
    total = Math.round(net + iva)
  }
  return {
    base: quote.total,
    extras,
    discount,
    subtotal,
    iva,
    total,
    deposit: Math.round((total * business.depositPct) / 100),
    ivaRate: business.ivaRate,
    ivaIncluded: business.ivaIncluded,
    depositPct: business.depositPct
  }
}
