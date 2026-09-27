// Posición física (en mm) de cada punto LED. Sin APIs del DOM: lo usan
// el cotizador del servidor, las hojas de impresión y los archivos DXF/G-code.
// Origen: esquina superior izquierda del letrero, Y hacia abajo.

export const LED_PITCH_MM = 33 // separación entre focos de la tira en el contorno (~30 por metro)
export const BACKLIT_PITCH_MM = 130 // separación entre módulos LED retroiluminados
export const LED_HOLE_MM = 5 // diámetro de marca / barreno por punto

// Barreno según el tipo de letrero (letrero LED: el tamaño del LED elegido)
export const holeMm = (design) => (design.kind === 'led' ? design.ledMm : LED_HOLE_MM)

// Geometría real del letrero en mm (mismas proporciones que layoutSign)
export function signGeometryMm(design) {
  if (design.kind === 'led') {
    const w = design.widthCm * 10
    const h = design.heightCm * 10
    return { w, h, border: 0, radius: Math.min(design.cornerMm, Math.min(w, h) / 2) }
  }
  const w = design.widthCm * 10
  const h = design.heightCm * 10
  const base = Math.min(w, h)
  return {
    w,
    h,
    border: (design.border.width * base) / 500,
    radius: Math.min((design.border.radius * base) / 500, base / 2)
  }
}

// Puntos repartidos a lo largo de un rectángulo redondeado (incluye las curvas)
export function perimeterPoints(W, H, inset, radius, step) {
  const r = Math.max(0, Math.min(radius - inset, (Math.min(W, H) - inset * 2) / 2))
  const x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset
  const arc = (cx, cy, deg) => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  const toDeg = (t) => (r ? (t / r) * (180 / Math.PI) : 0)
  const segs = [
    { len: x1 - x0 - 2 * r, at: (t) => [x0 + r + t, y0] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x1 - r, y0 + r, -90 + toDeg(t)) },
    { len: y1 - y0 - 2 * r, at: (t) => [x1, y0 + r + t] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x1 - r, y1 - r, toDeg(t)) },
    { len: x1 - x0 - 2 * r, at: (t) => [x1 - r - t, y1] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x0 + r, y1 - r, 90 + toDeg(t)) },
    { len: y1 - y0 - 2 * r, at: (t) => [x0, y1 - r - t] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x0 + r, y0 + r, 180 + toDeg(t)) }
  ]
  const total = segs.reduce((s, g) => s + Math.max(0, g.len), 0)
  const count = Math.max(8, Math.round(total / step))
  const gap = total / count
  const pts = []
  for (let i = 0; i < count; i++) {
    let d = i * gap
    for (const g of segs) {
      const len = Math.max(0, g.len)
      if (d <= len) {
        pts.push(g.at(d))
        break
      }
      d -= len
    }
  }
  return pts
}

function backlitGrid(w, h) {
  const margin = Math.min(60, Math.min(w, h) * 0.15)
  const cols = Math.max(2, Math.round((w - 2 * margin) / BACKLIT_PITCH_MM) + 1)
  const rows = Math.max(2, Math.round((h - 2 * margin) / BACKLIT_PITCH_MM) + 1)
  const pts = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pts.push([margin + (c * (w - 2 * margin)) / (cols - 1), margin + (r * (h - 2 * margin)) / (rows - 1)])
    }
  }
  return pts
}

const round1 = (n) => Math.round(n * 10) / 10

// Devuelve los puntos LED del letrero en mm, o [] si la luz no lleva puntos (neón sigue las letras)
export function ledPointsMm(design) {
  if (design.kind === 'led') return (design.dots || []).map((d) => [d[0], d[1]])
  const mode = design.led?.mode || 'none'
  const g = signGeometryMm(design)
  let pts = []
  if (mode === 'perimeter') {
    const inset = g.border + Math.max(12, Math.min(g.w, g.h) * 0.04)
    pts = perimeterPoints(g.w, g.h, inset, g.radius, LED_PITCH_MM)
  } else if (mode === 'backlit') {
    pts = backlitGrid(g.w, g.h)
  }
  return pts.map(([x, y]) => [round1(x), round1(y)])
}
