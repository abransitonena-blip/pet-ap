// Letrero de puntos LED (tipo Radox): letras formadas por LED de 5 mm en una placa.
// Módulo puro (sin DOM): lo usan el editor, el admin y el servidor (validación y precio).
//
// Alimentación, igual que las placas del repo de hardware:
//  - 127 V: fuente capacitiva no aislada (placa B, 3 salidas). I = 240 × C(µF) × (180 V − Vtira) mA
//  - 12 V: eliminador + LED en serie con resistencia (15 mA por cadena)
import { FONTS } from './design.js'
import { DEFAULT_PRICES } from './prices.js'

export const LED_COLORS = [
  // Colores calibrados a la longitud de onda real de cada LED de 5 mm (nm) o su temperatura de color
  { id: 'rojo', name: 'Rojo', hex: '#ff2a14', vf: 2.0, price: 2.5, nm: '625 nm' },
  { id: 'naranja', name: 'Naranja', hex: '#ff6a00', vf: 2.0, price: 2.5, nm: '605 nm' },
  { id: 'ambar', name: 'Ámbar', hex: '#ffa800', vf: 2.0, price: 2.5, nm: '590 nm' },
  { id: 'amarillo', name: 'Amarillo', hex: '#ffdc0a', vf: 2.1, price: 2.5, nm: '585 nm' },
  { id: 'verde', name: 'Verde', hex: '#1dff4a', vf: 3.0, price: 3, nm: '525 nm' },
  { id: 'cian', name: 'Cian', hex: '#00e0ff', vf: 3.1, price: 3.5, nm: '500 nm' },
  { id: 'azul', name: 'Azul', hex: '#2e6cff', vf: 3.1, price: 3.5, nm: '470 nm' },
  { id: 'blanco', name: 'Blanco frío', hex: '#f2f7ff', vf: 3.1, price: 3.5, nm: '6500 K' },
  { id: 'calido', name: 'Blanco cálido', hex: '#ffc988', vf: 3.0, price: 3.5, nm: '3000 K' },
  { id: 'rosa', name: 'Rosa', hex: '#ff47c8', vf: 3.1, price: 3.5, nm: 'rosa' },
  { id: 'morado', name: 'Morado', hex: '#9a4dff', vf: 3.1, price: 3.5, nm: '405 nm' }
]

export const DOT_STYLES = [
  { id: 'trazo', name: 'Trazo', note: 'Una línea de LED por el centro de la letra' },
  { id: 'contorno', name: 'Contorno', note: 'LED siguiendo el borde · letras gruesas' },
  { id: 'relleno', name: 'Relleno', note: 'Letra llena de puntos' },
  { id: 'matriz', name: 'Matriz 5×7', note: 'Clásico letrero de puntos' }
]

// Fondos de placa minimalistas
export const BOARDS = [
  { id: 'negro', name: 'Negro', hex: '#0b0b0c' },
  { id: 'humo', name: 'Grafito', hex: '#2b2d33' },
  { id: 'azulnoche', name: 'Noche', hex: '#18202f' },
  { id: 'rosa', name: 'Rosa', hex: '#f4a9c6' },
  { id: 'rosapalo', name: 'Rosa palo', hex: '#f3dbe2' },
  { id: 'blanco', name: 'Blanco', hex: '#f4f3ef' },
  { id: 'arena', name: 'Arena', hex: '#e4d8c6' },
  { id: 'gris', name: 'Gris', hex: '#9a9ca3' },
  { id: 'salvia', name: 'Salvia', hex: '#a9b69f' },
  { id: 'transparente', name: 'Cristal', hex: '#cfdde2' },
  { id: 'madera', name: 'Madera', hex: '#7a5134' }
]

// Acabado / textura de la placa (vinil o lámina sobre la placa). `liso` usa el color elegido
export const FINISHES = [
  { id: 'liso', name: 'Liso', base: null, price: 0 },
  { id: 'pino', name: 'Pino', base: '#dcb88e', group: 'Madera', price: 250 },
  { id: 'roble', name: 'Roble', base: '#b88a5b', group: 'Madera', price: 300 },
  { id: 'nogal', name: 'Nogal', base: '#6e4a31', group: 'Madera', price: 350 },
  { id: 'marmol', name: 'Mármol', base: '#eeebe5', group: 'Piedra', price: 400 },
  { id: 'concreto', name: 'Concreto', base: '#b6b2ab', group: 'Piedra', price: 250 },
  { id: 'pizarra', name: 'Pizarra', base: '#474c52', group: 'Piedra', price: 300 },
  { id: 'terrazo', name: 'Terrazo', base: '#efe6df', group: 'Piedra', price: 350 },
  { id: 'carbono', name: 'Carbono', base: '#26282c', group: 'Especial', price: 450 },
  { id: 'aluminio', name: 'Aluminio', base: '#c9cdd3', group: 'Metal', price: 450 },
  { id: 'espejo', name: 'Espejo', base: '#d5dae0', group: 'Metal', price: 500 },
  { id: 'oro', name: 'Oro', base: '#d8b867', group: 'Metal', price: 550 },
  { id: 'rosaoro', name: 'Oro rosa', base: '#e2aa9f', group: 'Metal', price: 550 },
  { id: 'cobre', name: 'Cobre', base: '#c98355', group: 'Metal', price: 550 }
]

// Pared de la vista previa (solo visual). `tex`: pared con textura (ver lib/walls.js)
export const SCENES = [
  { id: 'rosa', name: 'Rosa', hex: '#f2c4d4' },
  { id: 'blanco', name: 'Blanco', hex: '#efeeea' },
  { id: 'arena', name: 'Arena', hex: '#dccfbb' },
  { id: 'salvia', name: 'Salvia', hex: '#c9d3c0' },
  { id: 'concreto', name: 'Concreto', hex: '#a9a6a0', tex: true },
  { id: 'ladrillo', name: 'Ladrillo', hex: '#a4563d', tex: true },
  { id: 'ladrillob', name: 'Ladrillo blanco', hex: '#ebe7e1', tex: true },
  { id: 'madera', name: 'Duela de madera', hex: '#b07f55', tex: true },
  { id: 'azulejo', name: 'Azulejo', hex: '#f3f3f1', tex: true },
  { id: 'marmol', name: 'Mármol', hex: '#ece9e4', tex: true },
  { id: 'terrazo', name: 'Terrazo', hex: '#efe6df', tex: true },
  { id: 'verde', name: 'Muro verde', hex: '#4d7a45', tex: true }
]

// Cómo se combinan los colores de LED en una línea o en el marco
export const COLOR_MIXES = [
  { id: 'solido', name: 'Un color' },
  { id: 'alternado', name: 'Dos colores' },
  { id: 'arcoiris', name: 'Arcoíris' }
]
export const RAINBOW = ['rojo', 'naranja', 'amarillo', 'verde', 'cian', 'azul', 'morado']
// Índice de "línea" reservado para los LED del marco
export const FRAME_LINE = 9

export const BOARD_MATERIALS = [
  { id: 'acrilico', name: 'Acrílico 3 mm', pricePerM2: 950 },
  { id: 'pvc', name: 'PVC 6 mm', pricePerM2: 520 },
  { id: 'mdf', name: 'MDF 6 mm', pricePerM2: 560 }
]

export const ANIMATIONS = [
  { id: 'fijo', name: 'Fijo', note: 'Siempre encendido' },
  { id: 'parpadeo', name: 'Parpadeo', note: 'Enciende y apaga' },
  { id: 'secuencial', name: 'Secuencial', note: 'Letra por letra · el marco corre como marquesina' },
  { id: 'respirar', name: 'Respirar', note: 'Se enciende y apaga suave · controlador PWM' }
]

export const POWER = [
  { id: '127v', name: 'Directo a la corriente', note: 'Se conecta a 127 V, como los letreros tipo Radox' },
  { id: '12v', name: 'Con eliminador de 12 V', note: 'Bajo voltaje en el letrero; el eliminador va al contacto' }
]

// Modelos de placa (forma) y de montaje
export const SHAPES = [
  { id: 'rect', name: 'Recto', price: 0 },
  { id: 'round', name: 'Redondeado', price: 0 },
  { id: 'pill', name: 'Cápsula', price: 60 },
  { id: 'circle', name: 'Círculo', price: 120 },
  { id: 'arch', name: 'Arco', price: 120 },
  { id: 'hex', name: 'Hexágono', price: 120 }
]

export const MOUNTS = [
  { id: 'pared', name: 'Pared', note: '2 barrenos para taquete', price: 0 },
  { id: 'colgante', name: 'Colgante', note: 'Cable de acero y gancho', price: 90 },
  { id: 'base', name: 'Base LED de mesa', note: 'Placa sobre base con ranura', price: 280 },
  { id: 'bandera', name: 'Bandera doble cara', note: 'Sale de la fachada · se ve de ambos lados', price: 450 }
]

// Halo trasero: tira LED 12 V detrás de la placa (la pared brilla alrededor). Solo en montaje de pared.
export const HALO_W_PER_M = 9.6 // tira 2835, 120 LED/m
export const haloOn = (design) => Boolean(design.halo?.on) && design.mount === 'pared'
export function haloMeters(design) {
  if (!haloOn(design)) return 0
  // La tira va ~3 cm hacia adentro del borde
  const inset = 30
  const w = Math.max(0, design.widthCm * 10 - 2 * inset)
  const h = Math.max(0, design.heightCm * 10 - 2 * inset)
  const k = design.shape === 'circle' || design.shape === 'pill' ? 0.86 : 1
  return Math.ceil(((2 * (w + h) * k) / 1000) * 10) / 10
}
// Fuente Mean Well con 25 % de holgura
export const haloSupplyW = (m) => [35, 60, 100, 150, 200].find((w) => w >= m * HALO_W_PER_M * 1.25) || 320

// Letrero de bandera: dos caras con LED (se ve al caminar por la banqueta en ambos sentidos)
export const faceCount = (design) => (design.mount === 'bandera' ? 2 : 1)

// Logo del cliente: máscara binaria comprimida (corridas alternas 0/1 en base 36)
export const LOGO_MAX = 160
export function normalizeLogo(logo) {
  if (!logo || typeof logo !== 'object') return null
  const w = Math.round(Number(logo.w))
  const h = Math.round(Number(logo.h))
  const rle = typeof logo.rle === 'string' ? logo.rle : ''
  if (!(w >= 4 && w <= LOGO_MAX && h >= 4 && h <= LOGO_MAX) || !/^[0-9a-z.]{1,12000}$/.test(rle)) return null
  const total = rle.split('.').reduce((a, n) => a + (parseInt(n, 36) || 0), 0)
  return total === w * h ? { w, h, rle } : null
}
export function logoMask(logo) {
  const mask = new Uint8Array(logo.w * logo.h)
  let i = 0
  logo.rle.split('.').forEach((n, k) => {
    const run = parseInt(n, 36) || 0
    if (k % 2) mask.fill(1, i, i + run)
    i += run
  })
  return mask
}
export function encodeMask(mask) {
  const runs = []
  let cur = 0
  let run = 0
  for (const v of mask) {
    if (v === cur) run++
    else {
      runs.push(run)
      cur = v
      run = 1
    }
  }
  runs.push(run)
  return runs.map((n) => n.toString(36)).join('.')
}

export const LED_SIZES = [3, 5, 8]
export const MAX_DOTS = 4000
export const SEQ_CHANNELS = 3

export const ledColorById = (id) => LED_COLORS.find((c) => c.id === id) || LED_COLORS[0]
export const boardById = (id) => BOARDS.find((b) => b.id === id) || BOARDS[0]
export const finishById = (id) => FINISHES.find((f) => f.id === id) || FINISHES[0]
// Color base visible de la placa (acabado o color liso)
export const boardBase = (design) => finishById(design.finish).base || boardById(design.board).hex

// Color de cada LED según su línea (o el marco) y la combinación elegida
export function dotColorId(design, p) {
  const src = p[2] === FRAME_LINE ? design.frame : design.lines[p[2]]
  if (!src) return 'rojo'
  if (src.mix === 'alternado' && src.color2) return p[3] % 2 ? src.color2 : src.color
  if (src.mix === 'arcoiris') return RAINBOW[p[3] % RAINBOW.length]
  return src.color
}

export const boardMaterialById = (id) => BOARD_MATERIALS.find((m) => m.id === id) || BOARD_MATERIALS[0]

export function newLedLine(overrides = {}) {
  return { text: 'TEXTO', font: 'Anton', heightMm: 100, color: 'rojo', color2: 'blanco', mix: 'solido', bold: false, icon: '', iconPos: 'left', ...overrides }
}

export function defaultLedDesign() {
  return {
    kind: 'led',
    widthCm: 60,
    heightCm: 25,
    material: 'acrilico',
    board: 'blanco',
    finish: 'liso',
    frame: { on: false, double: false, color: 'blanco', color2: 'rosa', mix: 'solido' },
    halo: { on: false, color: 'calido' },
    logo: null,
    wifi: false,
    shape: 'round',
    mount: 'pared',
    cornerMm: 16,
    marginMm: 40,
    style: 'contorno',
    pitchMm: 12,
    ledMm: 5,
    animation: 'fijo',
    power: '127v',
    extras: [],
    lines: [newLedLine({ text: 'ABIERTO', font: 'Anton', heightMm: 120, color: 'rojo' })],
    dots: []
  }
}

const clamp = (n, min, max, fallback) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, v))
}
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback)
const r1 = (n) => Math.round(n * 10) / 10

export function normalizeLedDesign(input) {
  const d = input && typeof input === 'object' ? input : {}
  const def = defaultLedDesign()
  const fontIds = FONTS.map((f) => f.id)
  const colorIds = LED_COLORS.map((c) => c.id)
  const mixIds = COLOR_MIXES.map((m) => m.id)
  const fr = d.frame && typeof d.frame === 'object' ? d.frame : {}
  const widthCm = Math.round(clamp(d.widthCm, 5, 1000, def.widthCm))
  const heightCm = Math.round(clamp(d.heightCm, 5, 1000, def.heightCm))
  const lines = (Array.isArray(d.lines) ? d.lines : def.lines).slice(0, 4).map((l) => ({
    text: typeof l?.text === 'string' ? l.text.slice(0, 40) : '',
    font: oneOf(l?.font, fontIds, 'Anton'),
    heightMm: Math.round(clamp(l?.heightMm, 20, 1000, 100)),
    color: oneOf(l?.color, colorIds, 'rojo'),
    color2: oneOf(l?.color2, colorIds, 'blanco'),
    mix: oneOf(l?.mix, mixIds, 'solido'),
    bold: Boolean(l?.bold),
    icon: typeof l?.icon === 'string' && /^[a-z0-9-]{1,40}$/.test(l.icon) ? l.icon : '',
    iconPos: oneOf(l?.iconPos, ['left', 'right'], 'left')
  }))
  const dots = (Array.isArray(d.dots) ? d.dots : [])
    .slice(0, MAX_DOTS)
    .filter((p) => Array.isArray(p) && p.length >= 2 && p.every((v) => Number.isFinite(Number(v))))
    .map((p) => [
      r1(clamp(p[0], 0, widthCm * 10, 0)),
      r1(clamp(p[1], 0, heightCm * 10, 0)),
      Number(p[2]) === FRAME_LINE ? FRAME_LINE : Math.round(clamp(p[2], 0, lines.length - 1, 0)),
      Math.round(clamp(p[3], 0, 999, 0))
    ])
  return {
    kind: 'led',
    widthCm,
    heightCm,
    material: oneOf(d.material, BOARD_MATERIALS.map((m) => m.id), def.material),
    board: oneOf(d.board, BOARDS.map((b) => b.id), def.board),
    finish: oneOf(d.finish, FINISHES.map((f) => f.id), 'liso'),
    logo: normalizeLogo(d.logo),
    halo: { on: Boolean(d.halo?.on), color: oneOf(d.halo?.color, colorIds, 'calido') },
    wifi: Boolean(d.wifi),
    frame: {
      on: Boolean(fr.on),
      double: Boolean(fr.double),
      color: oneOf(fr.color, colorIds, 'blanco'),
      color2: oneOf(fr.color2, colorIds, 'rosa'),
      mix: oneOf(fr.mix, mixIds, 'solido')
    },
    shape: oneOf(d.shape, SHAPES.map((x) => x.id), 'round'),
    mount: oneOf(d.mount, MOUNTS.map((x) => x.id), 'pared'),
    cornerMm: Math.round(clamp(d.cornerMm, 0, 200, def.cornerMm)),
    marginMm: Math.round(clamp(d.marginMm, 10, 200, def.marginMm)),
    style: oneOf(d.style, DOT_STYLES.map((s) => s.id), def.style),
    pitchMm: r1(clamp(d.pitchMm, 5, 40, def.pitchMm)),
    ledMm: oneOf(Number(d.ledMm), LED_SIZES, 5),
    animation: oneOf(d.animation, ANIMATIONS.map((a) => a.id), 'fijo'),
    power: oneOf(d.power, POWER.map((p) => p.id), '127v'),
    extras: [], // la instalación se elige al pedir (forma de recibir)
    lines,
    dots
  }
}

// ---------- Forma de la placa ----------
const f2 = (n) => Math.round(n * 100) / 100

// Radio del arco superior (forma "arco")
export const archRadius = (W, H) => Math.min(W / 2, H * 0.6)

// Contorno de corte en mm: `d` para SVG y `points` (polígono cerrado) para DXF / G-code
export function boardOutline(design) {
  const W = design.widthCm * 10
  const H = design.heightCm * 10
  const shape = design.shape || 'round'
  const arc = (cx, cy, rx, ry, a0, a1, n) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
      return [f2(cx + rx * Math.cos(a)), f2(cy + ry * Math.sin(a))]
    })
  let points
  if (shape === 'circle') {
    points = arc(W / 2, H / 2, W / 2, H / 2, 0, 360, 96).slice(0, -1)
  } else if (shape === 'pill') {
    const r = Math.min(W, H) / 2
    points = [...arc(W - r, H / 2, r, r, -90, 90, 24), ...arc(r, H / 2, r, r, 90, 270, 24)]
  } else if (shape === 'arch') {
    const ry = archRadius(W, H)
    points = [[0, H], ...arc(W / 2, ry, W / 2, ry, 180, 360, 48), [W, H]]
  } else if (shape === 'hex') {
    const k = Math.min(H * 0.29, W / 4)
    points = [[k, 0], [W - k, 0], [W, H / 2], [W - k, H], [k, H], [0, H / 2]]
  } else {
    const r = shape === 'rect' ? 0 : Math.min(design.cornerMm || 0, W / 2, H / 2)
    points = r
      ? [...arc(W - r, r, r, r, -90, 0, 8), ...arc(W - r, H - r, r, r, 0, 90, 8), ...arc(r, H - r, r, r, 90, 180, 8), ...arc(r, r, r, r, 180, 270, 8)]
      : [[0, 0], [W, 0], [W, H], [0, H]]
  }
  const d = 'M' + points.map((p) => p.join(' ')).join(' L') + ' Z'
  return { d, points, W, H }
}

// Barrenos de montaje (Ø 4 mm) para pared y colgante
export function mountHoles(design) {
  if (design.mount === 'base') return []
  const W = design.widthCm * 10
  const H = design.heightCm * 10
  const shape = design.shape || 'round'
  if (shape === 'circle' || shape === 'arch') {
    const y = shape === 'arch' ? archRadius(W, H) * 0.45 : H * 0.14
    return [[f2(W / 2 - W * 0.16), f2(y)], [f2(W / 2 + W * 0.16), f2(y)]]
  }
  const inset = shape === 'pill' ? Math.min(W, H) / 2 : shape === 'hex' ? Math.min(H * 0.29, W / 4) + 12 : 15
  return [[f2(inset), 15], [f2(W - inset), 15]]
}

// ---------- Cálculo eléctrico ----------
const CAPS = [
  { code: '224J', uF: 0.22 },
  { code: '334J', uF: 0.33 },
  { code: '474J', uF: 0.47 }
]
const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]
const e12Up = (ohms) => {
  let decade = 1
  while (decade * 100 < ohms) decade *= 10
  for (const d of [decade, decade * 10]) for (const v of E12) if (v * d >= ohms) return v * d
  return Math.ceil(ohms)
}
export const V_MAX_127 = 100 // la tira no debe pasar de ~100 V (LEEME placa B)
const I_12V = 0.015

// Corriente de una salida capacitiva a 127 V (mA)
export const capCurrent = (uF, volts) => (240 * uF * (180 - volts)) / 1000

function chooseCap(volts) {
  // El capacitor que deja la corriente más cerca de 10 mA sin pasar de 11.5 mA
  // (coincide con la tabla de la placa B: ≤30 V → 224J, 40–60 V → 334J, 60–100 V → 474J)
  const options = CAPS.map((c) => ({ ...c, mA: capCurrent(c.uF, volts) })).filter((c) => c.mA <= 11.5)
  const pick = (options.length ? options : [CAPS[0]].map((c) => ({ ...c, mA: capCurrent(c.uF, volts) }))).reduce((a, b) =>
    Math.abs(b.mA - 10) < Math.abs(a.mA - 10) ? b : a
  )
  return { code: pick.code, mA: Math.round(pick.mA * 10) / 10 }
}

function split(total, maxPer) {
  const n = Math.max(1, Math.ceil(total / maxPer))
  const base = Math.floor(total / n)
  const extra = total % n
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0))
}

// Reparte los LED en cadenas en serie y calcula capacitores / resistencias y placas
export function planPower(design) {
  const dots = design.dots || []
  const seq = design.animation === 'secuencial'
  const groups = new Map()
  dots.forEach((p, i) => {
    const color = dotColorId(design, p)
    const channel = seq ? p[3] % SEQ_CHANNELS : 0
    const key = `${channel}|${color}`
    if (!groups.has(key)) groups.set(key, { channel, color, idx: [] })
    groups.get(key).idx.push(i)
  })

  const strings = []
  const dotString = new Array(dots.length).fill(0)
  for (const g of [...groups.values()].sort((a, b) => a.channel - b.channel)) {
    const c = ledColorById(g.color)
    const maxPer = design.power === '12v' ? Math.floor((12 - 1.2) / c.vf) : Math.floor(V_MAX_127 / c.vf)
    let offset = 0
    for (const count of split(g.idx.length, maxPer)) {
      const id = strings.length + 1
      const members = g.idx.slice(offset, offset + count)
      offset += count
      members.forEach((i) => (dotString[i] = id))
      const volts = Math.round(count * c.vf * 10) / 10
      const s = { id, color: g.color, channel: g.channel, count, volts, first: members[0], last: members[members.length - 1] }
      if (design.power === '12v') {
        s.resistor = e12Up((12 - volts) / I_12V)
        s.mA = Math.round(((12 - volts) / s.resistor) * 10000) / 10
      } else {
        const cap = chooseCap(volts)
        s.cap = cap.code
        s.mA = cap.mA
      }
      strings.push(s)
    }
  }

  // Bandera: la segunda cara lleva las mismas cadenas
  const faces = faceCount(design)
  if (faces === 2) {
    const n = strings.length
    strings.forEach((s) => (s.face = 1))
    for (const s of strings.slice(0, n)) strings.push({ ...s, id: s.id + n, face: 2 })
  }

  // Salidas: 127 V → placa B de 3 salidas; secuencial → placa A (3 canales) por cada juego de cadenas
  const perChannel = [0, 1, 2].map((ch) => strings.filter((s) => s.channel === ch).length)
  let boardsA = 0
  let boardsB = 0
  if (design.power === '127v') {
    if (seq) {
      boardsA = Math.max(...perChannel)
      for (const ch of [0, 1, 2]) {
        strings.filter((s) => s.channel === ch).forEach((s, i) => (s.output = `Placa A${i + 1} · canal ${ch + 1}`))
      }
    } else {
      boardsB = Math.ceil(strings.length / 3)
      strings.forEach((s, i) => (s.output = `Placa B${Math.floor(i / 3) + 1} · S${(i % 3) + 1}`))
    }
  } else {
    strings.forEach((s) => (s.output = seq ? `Canal ${s.channel + 1}` : 'Bus 12 V'))
  }

  const totalMa = strings.reduce((a, s) => a + s.mA, 0)
  const supplyA = [1, 2, 3, 5, 10, 20].find((a) => a * 1000 >= totalMa * 1.25) || Math.ceil((totalMa * 1.25) / 1000)
  const watts =
    design.power === '12v'
      ? Math.round(((12 * totalMa) / 1000) * 10) / 10
      : Math.round(strings.reduce((a, s) => a + (s.volts * s.mA) / 1000, 0) * 10) / 10

  const colorCount = {}
  for (const p of dots) {
    const color = dotColorId(design, p)
    colorCount[color] = (colorCount[color] || 0) + faces
  }

  // Lista de materiales
  const bom = Object.entries(colorCount).map(([id, n]) => ({
    qty: n + Math.ceil(n * 0.05),
    item: `LED ${design.ledMm} mm ${ledColorById(id).name.toLowerCase()} (incluye 5 % de repuesto)`
  }))
  if (design.power === '127v') {
    const caps = {}
    strings.forEach((s) => (caps[s.cap] = (caps[s.cap] || 0) + 1))
    Object.entries(caps).forEach(([code, n]) => bom.push({ qty: n, item: `Capacitor poliéster ${code} 400 V` }))
    bom.push({ qty: strings.length, item: 'Resistencia 220 Ω 1 W fusible' })
    bom.push({ qty: strings.length, item: 'Puente rectificador 2W10' })
    if (boardsB) bom.push({ qty: boardsB, item: 'Placa B (fuente capacitiva 3 salidas) + R 1 MΩ + clema' })
    if (boardsA) bom.push({ qty: boardsA, item: 'Placa A (NE555 + CD4017 + 3 SCR MCR100-6)' })
    if (design.animation === 'parpadeo') bom.push({ qty: 1, item: 'Módulo intermitente 127 V (o placa A con un solo canal)' })
    if (design.animation === 'respirar') bom.push({ qty: 1, item: 'Atenuador PWM 127 V (triac + optoacoplador) para efecto respirar' })
  } else {
    const res = {}
    strings.forEach((s) => (res[s.resistor] = (res[s.resistor] || 0) + 1))
    Object.entries(res).forEach(([ohm, n]) => bom.push({ qty: n, item: `Resistencia ${ohm} Ω ¼ W` }))
    bom.push({ qty: 1, item: `Eliminador 12 V ${supplyA} A` })
    if (seq) bom.push({ qty: 1, item: 'Arduino Nano o NE555 + CD4017, y 3 MOSFET IRLZ44N' })
    if (design.animation === 'parpadeo') bom.push({ qty: 1, item: 'Módulo intermitente 12 V (NE555 + MOSFET)' })
    if (design.animation === 'respirar') bom.push({ qty: 1, item: 'Módulo PWM 12 V (NE555 o Arduino + MOSFET IRLZ44N)' })
  }

  if (faces === 2) bom.push({ qty: 1, item: 'Brazo de bandera (ménsula) con tornillería y caja de 2 caras' })
  if (design.wifi) bom.push({ qty: 1, item: 'Módulo WiFi Sonoff Basic R2 (prender/apagar, horario y control por celular)' })
  const haloM = haloMeters(design)
  if (haloM) {
    bom.push({ qty: haloM, item: `metros de tira LED 2835 12 V ${ledColorById(design.halo.color).name.toLowerCase()} (halo trasero)` })
    bom.push({ qty: 1, item: `Fuente 12 V ${haloSupplyW(haloM)} W (Mean Well LRS) para el halo` })
    bom.push({ qty: 4, item: 'Separadores de 25 mm (la placa se despega de la pared para que salga la luz)' })
  }

  return { strings, dotString, boardsA, boardsB, faces, haloM, haloWatts: Math.round(haloM * HALO_W_PER_M * 10) / 10, totalLeds: dots.length * faces, totalMa: Math.round(totalMa), watts, supplyA, bom, colorCount }
}

// Precio del letrero LED (lo recalcula el servidor con la tabla de precios vigente)
export function ledQuoteParts(design, prices = DEFAULT_PRICES) {
  const P = { ...DEFAULT_PRICES.led, ...(prices?.led || {}) }
  const areaM2 = Math.round((design.widthCm / 100) * (design.heightCm / 100) * 100) / 100
  const plan = planPower(design)
  const mat = boardMaterialById(design.material)
  const perM2 = P.boards?.[mat.id] ?? mat.pricePerM2
  const faces = faceCount(design)
  const parts = [{ label: `Placa ${mat.name} (${areaM2} m²)${faces === 2 ? ' × 2 caras' : ''}`, amount: Math.max(P.minBoard, areaM2 * perM2) * faces }]
  const ledCost = Object.entries(plan.colorCount).reduce((a, [id, n]) => a + n * (P.colors?.[id] ?? ledColorById(id).price), 0)
  parts.push({ label: `${plan.totalLeds} LED ${design.ledMm} mm`, amount: ledCost })
  parts.push({ label: 'Perforado y armado', amount: plan.totalLeds * P.assembly })
  if (design.power === '127v') {
    if (plan.boardsB) parts.push({ label: `Fuente capacitiva × ${plan.boardsB} (placa B)`, amount: plan.boardsB * P.boardB })
    if (plan.boardsA) parts.push({ label: `Secuenciador × ${plan.boardsA} (placa A)`, amount: plan.boardsA * P.boardA })
  } else {
    const supply = P.supply12?.[plan.supplyA] ?? P.supply12?.[20] ?? 950
    parts.push({ label: `Eliminador 12 V ${plan.supplyA} A + resistencias`, amount: supply + plan.strings.length * P.resistor })
    if (design.animation === 'secuencial') parts.push({ label: 'Controlador secuencial', amount: P.controller12 })
  }
  if (design.animation === 'parpadeo') parts.push({ label: 'Intermitente', amount: P.flasher })
  if (design.animation === 'respirar') parts.push({ label: 'Controlador efecto respirar', amount: P.fader })
  const finish = finishById(design.finish)
  const finishM2 = P.finishes?.[finish.id] ?? finish.price
  if (finishM2) parts.push({ label: `Acabado ${finish.name.toLowerCase()}`, amount: Math.max(80, Math.round(areaM2 * finishM2)) * faces })
  if (design.wifi) parts.push({ label: 'Control WiFi desde el celular (horario y encendido)', amount: P.wifi })
  if (plan.haloM) parts.push({ label: `Halo trasero (${plan.haloM} m de tira + fuente 12 V)`, amount: Math.round(plan.haloM * P.haloPerM + P.haloSupply) })
  const frameDots = (design.dots || []).filter((p) => p[2] === FRAME_LINE).length
  if (frameDots) parts.push({ label: `Marco LED (${frameDots} puntos)`, amount: P.frame })
  const shape = SHAPES.find((x) => x.id === design.shape)
  const shapePrice = P.shapes?.[design.shape] ?? shape?.price ?? 0
  if (shapePrice) parts.push({ label: `Corte en forma de ${shape.name.toLowerCase()}`, amount: shapePrice })
  const mount = MOUNTS.find((x) => x.id === design.mount)
  const mountPrice = P.mounts?.[design.mount] ?? mount?.price ?? 0
  if (mountPrice) parts.push({ label: mount.name, amount: mountPrice })
  return { areaM2, parts, plan }
}
