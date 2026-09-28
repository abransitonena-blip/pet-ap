// Inventario del taller: qué material consume cada letrero y cuánto hay en existencia.
// Módulo puro: lo usan el servidor (descuenta al terminar un pedido) y el panel.
import { LED_COLORS, boardMaterialById, faceCount, haloSupplyW, ledColorById, planPower } from './ledSign.js'

export const SHEET_M2 = 1.22 * 2.44

export const INVENTORY_ITEMS = [
  ...LED_COLORS.map((c) => ({ key: `led-${c.id}`, name: `LED 5 mm ${c.name.toLowerCase()}`, unit: 'pz', category: 'led', min: 300 })),
  { key: 'hoja-acrilico', name: 'Acrílico 3 mm', unit: 'm²', category: 'acrilico', min: 3 },
  { key: 'hoja-pvc', name: 'PVC 6 mm', unit: 'm²', category: 'pvc', min: 3 },
  { key: 'hoja-mdf', name: 'MDF 6 mm', unit: 'm²', category: 'mdf', min: 3 },
  { key: 'cap-224J', name: 'Capacitor 224J 400 V', unit: 'pz', category: 'electronica', min: 10 },
  { key: 'cap-334J', name: 'Capacitor 334J 400 V', unit: 'pz', category: 'electronica', min: 10 },
  { key: 'cap-474J', name: 'Capacitor 474J 400 V', unit: 'pz', category: 'electronica', min: 10 },
  { key: 'puente', name: 'Puente rectificador 2W10', unit: 'pz', category: 'electronica', min: 10 },
  { key: 'resistencia', name: 'Resistencias', unit: 'pz', category: 'electronica', min: 20 },
  { key: 'placa-b', name: 'Placa B (fuente 3 salidas)', unit: 'pz', category: 'electronica', min: 3 },
  { key: 'placa-a', name: 'Placa A (secuenciador)', unit: 'pz', category: 'electronica', min: 2 },
  { key: 'eliminador', name: 'Eliminador / fuente 12 V', unit: 'pz', category: 'fuentes', min: 2 },
  { key: 'tira', name: 'Tira LED 2835 12 V', unit: 'm', category: 'tiras', min: 5 },
  { key: 'separador', name: 'Separadores (standoff)', unit: 'pz', category: 'herrajes', min: 8 },
  { key: 'wifi', name: 'Módulo WiFi Sonoff', unit: 'pz', category: 'wifi', min: 2 },
  { key: 'caja', name: 'Cajas de envío', unit: 'pz', category: 'empaque', min: 5 }
]
export const inventoryItem = (key) => INVENTORY_ITEMS.find((i) => i.key === key)

const add = (m, k, n) => m.set(k, Math.round(((m.get(k) || 0) + n) * 100) / 100)

// Material que consume un pedido (por pieza × cantidad), con 5 % de LED de repuesto y 15 % de corte
export function consumption(design, quantity = 1) {
  const m = new Map()
  if (design.kind !== 'led') return m
  const plan = planPower(design)
  for (const [color, n] of Object.entries(plan.colorCount)) add(m, `led-${color}`, Math.ceil(n * 1.05) * quantity)
  const area = (design.widthCm / 100) * (design.heightCm / 100) * faceCount(design) * 1.15
  add(m, `hoja-${boardMaterialById(design.material).id}`, area * quantity)
  if (design.power === '127v') {
    for (const s of plan.strings) add(m, `cap-${s.cap}`, quantity)
    add(m, 'puente', plan.strings.length * quantity)
    add(m, 'resistencia', plan.strings.length * quantity)
    add(m, 'placa-b', plan.boardsB * quantity)
    add(m, 'placa-a', plan.boardsA * quantity)
  } else {
    add(m, 'resistencia', plan.strings.length * quantity)
    add(m, 'eliminador', quantity)
  }
  if (plan.haloM) {
    add(m, 'tira', plan.haloM * quantity)
    add(m, 'eliminador', quantity)
    add(m, 'separador', 4 * quantity)
  } else if (design.mount === 'pared') add(m, 'separador', 2 * quantity)
  if (design.wifi) add(m, 'wifi', quantity)
  add(m, 'caja', quantity)
  return m
}

export function normalizeInventory(input = {}) {
  const out = {}
  for (const it of INVENTORY_ITEMS) {
    const v = input?.[it.key] || {}
    const qty = Number(v.qty)
    const min = Number(v.min)
    out[it.key] = {
      qty: Number.isFinite(qty) ? Math.round(Math.max(-1e6, Math.min(1e6, qty)) * 100) / 100 : 0,
      min: Number.isFinite(min) && min >= 0 ? Math.round(Math.min(1e6, min) * 100) / 100 : it.min
    }
  }
  return out
}

export const lowStock = (inv) => INVENTORY_ITEMS.filter((it) => (inv?.[it.key]?.qty ?? 0) < (inv?.[it.key]?.min ?? it.min))
export const ledName = (key) => ledColorById(key.replace('led-', '')).name
export { haloSupplyW }
