// Convierte texto en puntos LED (mm) usando cualquier fuente web.
// Cada letra se dibuja en un canvas y de su máscara se obtienen los puntos:
//  - trazo:    esqueleto de la letra (Zhang-Suen) muestreado cada `pitch`
//  - contorno: borde de la letra encogida (para que el LED quepa dentro del trazo)
//  - relleno:  rejilla hexagonal dentro de la letra
//  - matriz:   fuente clásica de 5 × 7 puntos
// El orden de los puntos sigue el recorrido de la letra: es el orden de cableado en serie.
import { fontsCssReady } from './fonts'
import { iconById } from './icons'
import { FRAME_LINE, archRadius, boardOutline } from './ledSign'

// ---------- Fuente 5 × 7 ----------
const M = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
  D: [28, 18, 17, 17, 17, 18, 28], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 17, 10, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31], 'Ñ': [13, 22, 17, 25, 21, 19, 17],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31],
  3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14],
  6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4],
  '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], '-': [0, 0, 0, 31, 0, 0, 0],
  ':': [0, 12, 12, 0, 12, 12, 0], '&': [12, 18, 20, 8, 21, 18, 13], "'": [12, 4, 8, 0, 0, 0, 0],
  '/': [0, 1, 2, 4, 8, 16, 0], $: [4, 15, 20, 14, 5, 30, 4], '#': [10, 10, 31, 10, 31, 10, 10],
  '+': [0, 4, 4, 31, 4, 4, 0], '%': [24, 25, 2, 4, 8, 19, 3], '♥': [0, 10, 31, 31, 14, 4, 0],
  '❤': [0, 10, 31, 31, 14, 4, 0], '*': [0, 4, 21, 14, 21, 4, 0]
}

export function matrixGlyph(ch) {
  const up = ch === 'ñ' ? 'Ñ' : ch.toUpperCase()
  if (M[up]) return M[up]
  const plain = up.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return M[plain] || null
}

function matrixLine(text, heightMm) {
  const p = heightMm / 6
  const dots = []
  let x = 0
  let letter = 0
  for (const ch of [...text]) {
    if (!ch.trim()) {
      x += 4 * p
      continue
    }
    const g = matrixGlyph(ch)
    if (g) {
      // Recorrido en serpentina: fila por fila, alternando sentido
      g.forEach((row, r) => {
        const cols = [0, 1, 2, 3, 4].filter((c) => row & (1 << (4 - c)))
        if (r % 2) cols.reverse()
        cols.forEach((c) => dots.push([x + c * p, -heightMm + r * p, letter]))
      })
      letter++
    }
    x += 6 * p
  }
  return dots
}

// ---------- Procesamiento de imagen ----------
function distanceTransform(mask, w, h) {
  const d = new Float32Array(w * h)
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 1e9 : 0
  const D = Math.SQRT2
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x])
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!d[i]) continue
      d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + D, at(x + 1, y - 1) + D)
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x
      if (!d[i]) continue
      d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + D, at(x - 1, y + 1) + D)
    }
  return d
}

function skeleton(mask, w, h) {
  const img = Uint8Array.from(mask)
  const P = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x])
  let changed = true
  while (changed) {
    changed = false
    for (const step of [0, 1]) {
      const del = []
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!img[y * w + x]) continue
          const n = [P(x, y - 1), P(x + 1, y - 1), P(x + 1, y), P(x + 1, y + 1), P(x, y + 1), P(x - 1, y + 1), P(x - 1, y), P(x - 1, y - 1)]
          const b = n.reduce((a, v) => a + v, 0)
          if (b < 2 || b > 6) continue
          let a = 0
          for (let k = 0; k < 8; k++) if (!n[k] && n[(k + 1) % 8]) a++
          if (a !== 1) continue
          if (step === 0 ? n[0] * n[2] * n[4] || n[2] * n[4] * n[6] : n[0] * n[2] * n[6] || n[0] * n[4] * n[6]) continue
          del.push(y * w + x)
        }
      if (del.length) changed = true
      for (const i of del) img[i] = 0
    }
  }
  return img
}

// Recorre la curva (1 px de ancho) en profundidad y acepta un punto cada `step` px
function sampleCurve(curve, w, h, step) {
  const visited = new Uint8Array(w * h)
  const out = []
  const cell = step
  const grid = new Map()
  const key = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`
  const min2 = (step * 0.92) ** 2
  const far = (x, y) => {
    const cx = Math.floor(x / cell)
    const cy = Math.floor(y / cell)
    for (let i = cx - 1; i <= cx + 1; i++)
      for (let j = cy - 1; j <= cy + 1; j++)
        for (const [px, py] of grid.get(`${i},${j}`) || []) if ((px - x) ** 2 + (py - y) ** 2 < min2) return false
    return true
  }
  const neighbors = (i) => {
    const x = i % w
    const y = (i / w) | 0
    const r = []
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && curve[ny * w + nx]) r.push(ny * w + nx)
      }
    return r
  }
  // Empieza por las puntas (1 vecino) para recorrer cada trazo de extremo a extremo
  const starts = []
  for (let i = 0; i < curve.length; i++) if (curve[i] && neighbors(i).length === 1) starts.push(i)
  for (let i = 0; i < curve.length; i++) if (curve[i]) starts.push(i)
  for (const s of starts) {
    if (visited[s]) continue
    const stack = [s]
    while (stack.length) {
      const i = stack.pop()
      if (visited[i]) continue
      visited[i] = 1
      const x = i % w
      const y = (i / w) | 0
      if (far(x, y)) {
        out.push([x, y])
        const k = key(x, y)
        if (!grid.has(k)) grid.set(k, [])
        grid.get(k).push([x, y])
      }
      for (const n of neighbors(i)) if (!visited[n]) stack.push(n)
    }
  }
  return out
}

function dotsFromMask(mask, w, h, style, stepPx, ledPx, ppm) {
  if (style === 'relleno') {
    const dist = distanceTransform(mask, w, h)
    const r = ledPx / 2 + ppm
    const rowStep = stepPx * 0.866
    const out = []
    for (let row = 0, y = rowStep / 2; y < h; row++, y += rowStep) {
      const xs = []
      for (let x = (row % 2 ? stepPx / 2 : 0) + stepPx / 4; x < w; x += stepPx) xs.push(x)
      if (row % 2) xs.reverse()
      for (const x of xs) if (dist[Math.round(y) * w + Math.round(x)] >= r) out.push([x, y])
    }
    if (out.length) return out
  }
  if (style === 'contorno') {
    const dist = distanceTransform(mask, w, h)
    const inset = ledPx / 2 + ppm * 1.2
    const inner = new Uint8Array(w * h)
    for (let i = 0; i < inner.length; i++) inner[i] = dist[i] >= inset ? 1 : 0
    const edge = new Uint8Array(w * h)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if (!inner[i]) continue
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1 || !inner[i - 1] || !inner[i + 1] || !inner[i - w] || !inner[i + w]) edge[i] = 1
      }
    const out = sampleCurve(edge, w, h, stepPx)
    if (out.length >= 3) return out
  }
  return sampleCurve(skeleton(mask, w, h), w, h, stepPx)
}

// ---------- Texto con fuente web ----------
const capCache = new Map()
let ctx = null

async function fontLine(line, style, pitchMm, ledMm) {
  const weight = line.bold ? 800 : 400
  await fontsCssReady()
  if (document.fonts) await document.fonts.load(`${weight} 100px "${line.font}"`, line.text).catch(() => {})
  ctx = ctx || document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const key = `${weight}|${line.font}`
  if (!capCache.has(key)) {
    ctx.font = `${weight} 100px "${line.font}"`
    capCache.set(key, (ctx.measureText('H').actualBoundingBoxAscent || 70) / 100)
  }
  const ppm = Math.min(4, Math.max(0.8, 14 / pitchMm)) // píxeles por mm
  const fontPx = (line.heightMm * ppm) / capCache.get(key)
  const font = `${weight} ${fontPx}px "${line.font}"`
  const chars = [...line.text]
  const dots = []
  let letter = 0
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (!ch.trim()) continue
    ctx.font = font
    const advance = ctx.measureText(chars.slice(0, i).join('')).width
    const m = ctx.measureText(ch)
    const left = Math.ceil(m.actualBoundingBoxLeft || 0)
    const asc = Math.ceil(m.actualBoundingBoxAscent || fontPx)
    const pad = Math.ceil(2 * ppm) + 2
    const cw = Math.max(1, Math.ceil(left + (m.actualBoundingBoxRight || m.width)) + pad * 2)
    const chh = Math.max(1, Math.ceil(asc + (m.actualBoundingBoxDescent || 0)) + pad * 2)
    const canvas = ctx.canvas
    canvas.width = cw
    canvas.height = chh
    ctx.font = font
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(ch, pad + left, pad + asc)
    const data = ctx.getImageData(0, 0, cw, chh).data
    const mask = new Uint8Array(cw * chh)
    for (let k = 0; k < mask.length; k++) mask[k] = data[k * 4 + 3] > 127 ? 1 : 0
    const pts = dotsFromMask(mask, cw, chh, style, pitchMm * ppm, ledMm * ppm, ppm)
    for (const [px, py] of pts) dots.push([(advance + px - pad - left) / ppm, (py - pad - asc) / ppm, letter])
    letter++
  }
  return dots
}

// ---------- Íconos: puntos a lo largo del trazo real ----------
let svgHost = null
const CLOSED = new Set(['circle', 'ellipse', 'rect', 'polygon'])

// Devuelve puntos (mm) en un cuadro de `sizeMm` con origen arriba a la izquierda
export function iconDots(iconId, sizeMm, pitchMm) {
  const icon = iconById(iconId)
  if (!icon || typeof document === 'undefined') return []
  if (!svgHost) {
    svgHost = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svgHost.setAttribute('viewBox', '0 0 24 24')
    svgHost.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden'
    document.body.appendChild(svgHost)
  }
  svgHost.innerHTML = icon.body
  const k = sizeMm / 24
  const pts = []
  const min2 = (pitchMm * 0.62) ** 2
  const add = (x, y) => {
    if (pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < min2)) return
    pts.push([x, y])
  }
  for (const el of svgHost.children) {
    if (typeof el.getTotalLength !== 'function') continue
    const len = el.getTotalLength()
    const lenMm = len * k
    if (!len) continue
    if (lenMm < pitchMm * 0.7) {
      const p = el.getPointAtLength(len / 2)
      add(p.x * k, p.y * k)
      continue
    }
    const closed = CLOSED.has(el.tagName) || /z\s*$/i.test(el.getAttribute('d') || '')
    const n = Math.max(1, Math.round(lenMm / pitchMm))
    const count = closed ? n : n + 1
    for (let i = 0; i < count; i++) {
      const p = el.getPointAtLength(Math.min(len, (i * len) / n))
      add(p.x * k, p.y * k)
    }
  }
  return pts
}

const r1 = (n) => Math.round(n * 10) / 10

// Letras chicas necesitan puntos más juntos para leerse: máx. altura / 9 (nunca menos de 5 mm)
const linePitch = (line, design) => Math.min(design.pitchMm, Math.max(5, line.heightMm / 9))

// Texto + ícono de una línea, en mm con y relativa a la línea base
async function lineWithIcon(line, design) {
  let dots = []
  if (line.text.trim()) {
    dots =
      design.style === 'matriz'
        ? matrixLine(line.text, line.heightMm)
        : await fontLine(line, design.style, linePitch(line, design), design.ledMm)
  }
  if (!line.icon) return dots
  const size = line.heightMm * (line.text.trim() ? 1.25 : 1.6)
  const pitch = design.style === 'matriz' ? line.heightMm / 6 : design.pitchMm
  const ic = iconDots(line.icon, size, pitch)
  if (!ic.length) return dots
  const iy = -line.heightMm / 2 - size / 2
  if (!dots.length) return ic.map(([x, y]) => [x, y + iy, 0])
  const xs = dots.map((d) => d[0])
  const gap = Math.max(design.pitchMm * 1.5, line.heightMm * 0.3)
  const letters = Math.max(...dots.map((d) => d[2])) + 1
  if (line.iconPos === 'right') {
    const x0 = Math.max(...xs) + gap
    return [...dots, ...ic.map(([x, y]) => [x + x0, y + iy, letters])]
  }
  const x0 = Math.min(...xs) - gap - size
  return [...ic.map(([x, y]) => [x + x0, y + iy, 0]), ...dots.map(([x, y, l]) => [x, y, l + 1])]
}

// Marco LED: distancia del borde (deja libres los separadores de pared) y separación entre anillos
export const FRAME_INSET = 28
const frameGap = (design) => Math.max(design.pitchMm, 10)
export const frameReserve = (design) => (design.frame?.on ? FRAME_INSET + (design.frame.double ? frameGap(design) : 0) : 0)

// Puntos repartidos a paso parejo sobre un polígono cerrado
function resample(points, pitch) {
  const segs = points.map((p, i) => {
    const q = points[(i + 1) % points.length]
    return { p, q, len: Math.hypot(q[0] - p[0], q[1] - p[1]) }
  })
  const total = segs.reduce((a, s) => a + s.len, 0)
  const n = Math.max(3, Math.round(total / pitch))
  const step = total / n
  const out = []
  let seg = 0
  let acc = 0
  for (let k = 0; k < n; k++) {
    const t = k * step
    while (seg < segs.length - 1 && acc + segs[seg].len < t) acc += segs[seg++].len
    const s = segs[seg]
    const f = s.len ? (t - acc) / s.len : 0
    out.push([s.p[0] + (s.q[0] - s.p[0]) * f, s.p[1] + (s.q[1] - s.p[1]) * f])
  }
  return out
}

// Anillo(s) de LED siguiendo la forma de la placa, hacia adentro
export function frameDots(design, widthCm, heightCm) {
  if (!design.frame?.on) return []
  const W = widthCm * 10
  const H = heightCm * 10
  const rings = design.frame.double ? [FRAME_INSET, FRAME_INSET + frameGap(design)] : [FRAME_INSET]
  const pitch = Math.max(design.pitchMm, 8)
  const out = []
  let k = 0
  for (const inset of rings) {
    if (W - 2 * inset < 20 || H - 2 * inset < 20) continue
    const inner = boardOutline({
      widthCm: (W - 2 * inset) / 10,
      heightCm: (H - 2 * inset) / 10,
      shape: design.shape,
      cornerMm: Math.max(0, (design.cornerMm || 0) - inset / 2)
    })
    // k % 6: alterna 2 colores, recorre el arcoíris y, en secuencial, corre en 3 canales
    for (const [x, y] of resample(inner.points, pitch)) out.push([r1(x + inset), r1(y + inset), FRAME_LINE, k++ % 6])
  }
  return out
}

// Calcula todos los puntos del letrero y el tamaño de la placa según su forma
export async function computeLedDots(design) {
  const laid = []
  let letterBase = 0
  for (let li = 0; li < design.lines.length; li++) {
    const line = design.lines[li]
    if (!line.text.trim() && !line.icon) continue
    const dots = await lineWithIcon(line, design)
    if (!dots.length) continue
    const xs = dots.map((d) => d[0])
    const ys = dots.map((d) => d[1])
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
    laid.push({ li, dots, minX, maxX, minY, maxY, letterBase, height: line.heightMm })
    letterBase += Math.max(...dots.map((d) => d[2])) + 1
  }
  if (!laid.length) return { dots: [], widthCm: 30, heightCm: 15 }

  const led = design.ledMm
  const contentW = Math.max(...laid.map((l) => l.maxX - l.minX)) + led
  const gaps = laid.slice(1).reduce((a, l) => a + Math.max(design.pitchMm, l.height * 0.3), 0)
  const contentH = laid.reduce((a, l) => a + (l.maxY - l.minY) + led, 0) + gaps
  const m = design.marginMm + frameReserve(design)

  // Tamaño de placa según la forma (el contenido debe quedar dentro del contorno)
  let W = contentW + 2 * m
  let H = contentH + 2 * m
  let top = 0 // espacio reservado arriba (arco)
  const shape = design.shape || 'round'
  if (shape === 'circle') {
    W = H = Math.hypot(contentW, contentH) + m * 1.2
  } else if (shape === 'pill') {
    W += H * 0.55
  } else if (shape === 'hex') {
    W += H * 0.6
  } else if (shape === 'arch') {
    top = Math.min(W / 2, (H + W * 0.35) * 0.6) * 0.55
    H += top
  }
  const widthCm = Math.ceil(W / 10)
  const heightCm = Math.ceil(H / 10)
  if (shape === 'arch') top = archRadius(widthCm * 10, heightCm * 10) * 0.55
  const offX = (widthCm * 10 - contentW) / 2 + led / 2
  let y = top + (heightCm * 10 - top - contentH) / 2 + led / 2

  const out = []
  for (const [k, l] of laid.entries()) {
    if (k) y += Math.max(design.pitchMm, l.height * 0.3)
    const lineW = l.maxX - l.minX
    const x0 = offX + (contentW - led - lineW) / 2 - l.minX
    const y0 = y - l.minY
    for (const [x, yy, letter] of l.dots) out.push([r1(x + x0), r1(yy + y0), l.li, l.letterBase + letter])
    y += l.maxY - l.minY + led
  }
  out.push(...frameDots(design, widthCm, heightCm))
  return { dots: out, widthCm, heightCm }
}
