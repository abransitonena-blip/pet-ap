// Costo real de fabricación (material + mano de obra) para saber el margen de cada letrero.
// Los costos se editan en el panel → Proveedores. Módulo puro: lo usan el panel y el servidor.
import { FRAME_LINE, faceCount, finishById, planPower } from './ledSign.js'

const SHEET_M2 = 1.22 * 2.44

export const DEFAULT_COSTS = {
  ledEach: 0.45, // LED 5 mm comprado por millar
  sheets: { acrilico: 1500, pvc: 700, mdf: 420 }, // hoja 1.22 × 2.44 m
  wastePct: 15, // desperdicio de corte
  vinylM2: 220, // vinil con textura (madera, mármol, metal)
  capacitor: 8, // poliéster 400 V
  bridge: 6, // puente rectificador
  resistor: 1.5,
  boardB: 45, // placa B armada (PCB + fusible + clema)
  boardA: 90, // secuenciador (NE555 + CD4017 + SCR)
  supply12: 140, // eliminador 12 V
  bracket: 180, // ménsula de bandera
  stripM: 30, // tira LED 2835 12 V por metro (rollo de 5 m)
  supplyHalo: 180, // fuente Mean Well LRS 35–60 W
  wifiModule: 150, // Sonoff Basic R2
  packaging: 70, // caja y protección
  laborHour: 70, // mano de obra por hora
  minutesPer100Led: 22 // perforar, soldar y probar 100 LED
}

const num = (v, def, max = 1e6) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 && n <= max ? Math.round(n * 100) / 100 : def
}

export function mergeCosts(input = {}) {
  const out = {}
  for (const [k, def] of Object.entries(DEFAULT_COSTS)) {
    out[k] = def && typeof def === 'object' ? Object.fromEntries(Object.entries(def).map(([kk, dv]) => [kk, num(input?.[k]?.[kk], dv)])) : num(input?.[k], def)
  }
  return out
}

// Costo estimado de un letrero LED y su desglose
export function costEstimate(design, costs = DEFAULT_COSTS) {
  const c = mergeCosts(costs)
  const faces = faceCount(design)
  const plan = planPower(design)
  const area = (design.widthCm / 100) * (design.heightCm / 100) * faces
  const sheet = c.sheets[design.material] ?? c.sheets.acrilico
  const leds = plan.totalLeds
  const parts = [
    { label: 'Placa', amount: (area / SHEET_M2) * sheet * (1 + c.wastePct / 100) },
    { label: `${leds} LED`, amount: leds * c.ledEach * 1.05 }
  ]
  if (finishById(design.finish).id !== 'liso') parts.push({ label: 'Vinil de acabado', amount: area * c.vinylM2 * (1 + c.wastePct / 100) })
  if (design.power === '127v') {
    parts.push({ label: 'Capacitores, puentes y resistencias', amount: plan.strings.length * (c.capacitor + c.bridge + c.resistor) })
    parts.push({ label: 'Placas de fuente / secuenciador', amount: plan.boardsB * c.boardB + plan.boardsA * c.boardA })
  } else {
    parts.push({ label: 'Eliminador y resistencias', amount: c.supply12 + plan.strings.length * c.resistor })
  }
  if (faces === 2) parts.push({ label: 'Ménsula de bandera', amount: c.bracket })
  if (design.wifi) parts.push({ label: 'Módulo WiFi', amount: c.wifiModule })
  if (plan.haloM) parts.push({ label: `Halo: ${plan.haloM} m de tira + fuente`, amount: plan.haloM * c.stripM + c.supplyHalo })
  const minutes = (leds / 100) * c.minutesPer100Led + 30 // + corte, armado y prueba
  parts.push({ label: `Mano de obra (${Math.round(minutes)} min)`, amount: (minutes / 60) * c.laborHour })
  parts.push({ label: 'Empaque', amount: c.packaging })
  const rounded = parts.map((p) => ({ ...p, amount: Math.round(p.amount) }))
  return { parts: rounded, total: rounded.reduce((a, p) => a + p.amount, 0), minutes: Math.round(minutes), frameLeds: design.dots.filter((p) => p[2] === FRAME_LINE).length }
}

// Margen sobre el precio sin IVA
export function margin(price, cost) {
  if (!price) return { profit: 0, pct: 0 }
  const profit = price - cost
  return { profit: Math.round(profit), pct: Math.round((profit / price) * 100) }
}
