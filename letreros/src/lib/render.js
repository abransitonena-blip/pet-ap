// Calcula la composición del letrero una sola vez; el SVG (vista previa,
// archivo vectorial y diagrama) y el canvas (PNG) dibujan las mismas primitivas.
import { lineColor } from './design'

const LINE_HEIGHT = 1.15
let measureCtx = null

export function fontString({ font, px, bold, italic }) {
  return `${italic ? 'italic ' : ''}${bold ? 800 : 400} ${px}px "${font}"`
}

function measureText(text, style, spacingPx) {
  const chars = [...text].length
  if (typeof document !== 'undefined') {
    measureCtx = measureCtx || document.createElement('canvas').getContext('2d')
    measureCtx.font = fontString(style)
    return measureCtx.measureText(text).width + spacingPx * chars
  }
  return chars * style.px * 0.6 + spacingPx * chars
}

// Puntos de la tira LED a lo largo del contorno (esquinas redondeadas incluidas)
function perimeterDots(W, H, inset, radius, step) {
  const r = Math.max(0, Math.min(radius - inset, (Math.min(W, H) - inset * 2) / 2))
  const x0 = inset, y0 = inset, x1 = W - inset, y1 = H - inset
  const segs = [
    { len: x1 - x0 - 2 * r, at: (t) => [x0 + r + t, y0] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x1 - r, y0 + r, -90 + (t / r) * (180 / Math.PI)) },
    { len: y1 - y0 - 2 * r, at: (t) => [x1, y0 + r + t] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x1 - r, y1 - r, (t / r) * (180 / Math.PI)) },
    { len: x1 - x0 - 2 * r, at: (t) => [x1 - r - t, y1] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x0 + r, y1 - r, 90 + (t / r) * (180 / Math.PI)) },
    { len: y1 - y0 - 2 * r, at: (t) => [x0, y1 - r - t] },
    { len: (Math.PI * r) / 2, at: (t) => arc(x0 + r, y0 + r, 180 + (t / r) * (180 / Math.PI)) }
  ]
  function arc(cx, cy, deg) {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  const total = segs.reduce((s, g) => s + g.len, 0)
  const count = Math.max(8, Math.round(total / step))
  const gap = total / count
  const dots = []
  for (let i = 0; i < count; i++) {
    let d = i * gap
    for (const g of segs) {
      if (d <= g.len) {
        dots.push(g.at(d))
        break
      }
      d -= g.len
    }
  }
  return dots
}

export function layoutSign(design) {
  const { widthCm, heightCm, colors } = design
  const W = widthCm >= heightCm ? 1000 : Math.round((1000 * widthCm) / heightCm)
  const H = heightCm >= widthCm ? 1000 : Math.round((1000 * heightCm) / widthCm)
  const base = Math.min(W, H)
  const s = base / 500
  const mode = design.led?.mode || 'none'

  const borderPx = design.border.width * s
  const radiusPx = Math.min(design.border.radius * s, base / 2)
  const ledInset = Math.max(borderPx, base * 0.025) + base * 0.025
  const pad = base * 0.08 + borderPx + (mode === 'perimeter' ? base * 0.04 : 0)
  const availW = W - pad * 2
  const availH = H - pad * 2

  const items = []
  if (design.icon) items.push({ type: 'icon', text: design.icon, px: (design.iconSize / 100) * base })
  for (const line of design.lines) {
    if (!line.text.trim()) continue
    const item = { type: 'text', ...line, color: lineColor(design, line), px: (line.size / 100) * base }
    item.spacing = (line.letterSpacing / 100) * item.px
    const w = measureText(line.text, item, item.spacing)
    if (w > availW) {
      const k = availW / w
      item.px *= k
      item.spacing *= k
    }
    items.push(item)
  }
  for (const it of items) if (it.type === 'icon' && it.px > availW) it.px = availW

  let totalH = items.reduce((sum, it) => sum + it.px * LINE_HEIGHT, 0)
  if (totalH > availH) {
    const k = availH / totalH
    for (const it of items) {
      it.px *= k
      if (it.spacing) it.spacing *= k
    }
    totalH = availH
  }

  const anchor = { left: 'start', center: 'middle', right: 'end' }[design.align]
  const x = { left: pad, center: W / 2, right: W - pad }[design.align]
  let y = pad + (availH - totalH) / 2
  for (const it of items) {
    const h = it.px * LINE_HEIGHT
    it.x = x
    it.y = y + h / 2
    it.anchor = anchor
    y += h
  }

  const dots = mode === 'perimeter' ? perimeterDots(W, H, ledInset, radiusPx, base * 0.05) : []
  return { W, H, s, base, borderPx, radiusPx, items, colors, mode, dots, dotR: base * 0.009 }
}

// Qué tan oscuro se ve el panel de noche según el tipo de luz
export function nightOverlay(mode) {
  return { none: 0.72, neon: 0.55, perimeter: 0.45, backlit: 0 }[mode] ?? 0
}

// ---------- Exportar PNG en alta resolución ----------
export async function renderToCanvas(design, maxSide = 3000) {
  if (document.fonts) {
    await Promise.all(
      design.lines.map((l) => document.fonts.load(fontString({ ...l, px: 40 }), l.text).catch(() => {}))
    )
  }
  const L = layoutSign(design)
  const k = maxSide / Math.max(L.W, L.H)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(L.W * k)
  canvas.height = Math.round(L.H * k)
  const ctx = canvas.getContext('2d')
  ctx.scale(k, k)

  ctx.fillStyle = L.colors.bg
  ctx.beginPath()
  ctx.roundRect(0, 0, L.W, L.H, L.radiusPx)
  ctx.fill()

  if (L.borderPx > 0) {
    const b = L.borderPx
    ctx.strokeStyle = L.colors.accent
    ctx.lineWidth = b
    ctx.beginPath()
    ctx.roundRect(b / 2, b / 2, L.W - b, L.H - b, Math.max(0, L.radiusPx - b / 2))
    ctx.stroke()
  }

  const align = { start: 'left', middle: 'center', end: 'right' }
  ctx.textBaseline = 'middle'
  for (const it of L.items) {
    ctx.textAlign = align[it.anchor]
    ctx.shadowBlur = 0
    if (it.type === 'icon') {
      ctx.font = `${it.px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
      ctx.fillText(it.text, it.x, it.y)
      continue
    }
    ctx.font = fontString(it)
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${it.spacing}px`
    ctx.fillStyle = it.color
    if (L.mode === 'neon') {
      ctx.shadowColor = it.color
      ctx.shadowBlur = it.px * 0.35
      ctx.fillText(it.text, it.x, it.y)
      ctx.shadowBlur = 0
    }
    ctx.fillText(it.text, it.x, it.y)
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'
  }

  for (const [dx, dy] of L.dots) {
    ctx.shadowColor = L.colors.accent
    ctx.shadowBlur = L.dotR * 3
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(dx, dy, L.dotR, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadPng(design, filename = 'letrero.png', maxSide = 3000) {
  const canvas = await renderToCanvas(design, maxSide)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  downloadBlob(blob, filename)
}
