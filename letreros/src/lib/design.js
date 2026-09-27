// Modelo del diseño de un letrero. Se usa en el navegador y en el servidor,
// así que aquí no puede haber APIs del DOM.

export const FONTS = [
  { id: 'Anton', label: 'Anton' },
  { id: 'Bebas Neue', label: 'Bebas Neue' },
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Playfair Display', label: 'Playfair' },
  { id: 'Righteous', label: 'Righteous' },
  { id: 'Pacifico', label: 'Pacifico' },
  { id: 'Lobster', label: 'Lobster' },
  { id: 'Permanent Marker', label: 'Marker' },
  { id: 'Monoton', label: 'Monoton' }
]

export const ICONS = ['', '⭐', '☕', '🍕', '🌮', '🍔', '🍦', '💈', '✂️', '💅', '🐶', '🔧', '🚗', '🏠', '📱', '💡', '🎉', '❤️', '🌿', '🔥', '⚡', '🛒', '📍', '✅']

export const SIZE_PRESETS = [
  { label: '60 × 40', widthCm: 60, heightCm: 40 },
  { label: '90 × 60', widthCm: 90, heightCm: 60 },
  { label: '120 × 60', widthCm: 120, heightCm: 60 },
  { label: '200 × 100', widthCm: 200, heightCm: 100 },
  { label: '300 × 90', widthCm: 300, heightCm: 90 },
  { label: '50 × 50', widthCm: 50, heightCm: 50 }
]

const clamp = (n, min, max, fallback) => {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.min(max, Math.max(min, v))
}

const isColor = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)
const color = (c, fallback) => (isColor(c) ? c.toLowerCase() : fallback)
const str = (s, max, fallback = '') => (typeof s === 'string' ? s.slice(0, max) : fallback)
const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback)

export function newLine(overrides = {}) {
  return {
    text: 'Tu texto',
    font: 'Montserrat',
    size: 18,
    color: '#ffffff',
    bold: true,
    italic: false,
    letterSpacing: 0,
    ...overrides
  }
}

export function defaultDesign() {
  return {
    widthCm: 120,
    heightCm: 60,
    material: 'lona',
    extras: ['ojillos'],
    align: 'center',
    background: { type: 'gradient', color1: '#1e1b4b', color2: '#7c3aed', angle: 135 },
    border: { width: 12, color: '#fbbf24', radius: 24 },
    glow: false,
    icon: '⭐',
    iconSize: 22,
    lines: [
      newLine({ text: 'MI NEGOCIO', font: 'Anton', size: 34, color: '#ffffff' }),
      newLine({ text: 'Abierto todos los días', font: 'Montserrat', size: 12, color: '#fde68a', bold: false })
    ]
  }
}

// Limpia/limita cualquier diseño recibido (formulario, localStorage o API).
export function normalizeDesign(input, materialIds, extraIds) {
  const d = input && typeof input === 'object' ? input : {}
  const def = defaultDesign()
  const bg = d.background || {}
  const border = d.border || {}
  const lines = Array.isArray(d.lines) ? d.lines.slice(0, 6) : def.lines
  const fontIds = FONTS.map((f) => f.id)

  return {
    widthCm: Math.round(clamp(d.widthCm, 10, 1000, def.widthCm)),
    heightCm: Math.round(clamp(d.heightCm, 10, 1000, def.heightCm)),
    material: materialIds ? oneOf(d.material, materialIds, def.material) : str(d.material, 40, def.material),
    extras: Array.isArray(d.extras)
      ? [...new Set(d.extras.filter((e) => (extraIds ? extraIds.includes(e) : typeof e === 'string')))]
      : [],
    align: oneOf(d.align, ['left', 'center', 'right'], 'center'),
    background: {
      type: oneOf(bg.type, ['solid', 'gradient'], 'solid'),
      color1: color(bg.color1, '#111827'),
      color2: color(bg.color2, '#374151'),
      angle: Math.round(clamp(bg.angle, 0, 360, 135))
    },
    border: {
      width: Math.round(clamp(border.width, 0, 60, 0)),
      color: color(border.color, '#ffffff'),
      radius: Math.round(clamp(border.radius, 0, 200, 0))
    },
    glow: Boolean(d.glow),
    icon: str(d.icon, 16),
    iconSize: Math.round(clamp(d.iconSize, 5, 60, 20)),
    lines: lines.map((l) => ({
      text: str(l?.text, 80),
      font: oneOf(l?.font, fontIds, 'Montserrat'),
      size: Math.round(clamp(l?.size, 4, 80, 18)),
      color: color(l?.color, '#ffffff'),
      bold: Boolean(l?.bold),
      italic: Boolean(l?.italic),
      letterSpacing: Math.round(clamp(l?.letterSpacing, -5, 40, 0))
    }))
  }
}

// Plantillas de inicio rápido
export const TEMPLATES = [
  {
    name: 'Cafetería',
    design: {
      widthCm: 90, heightCm: 60, material: 'pvc', extras: [], align: 'center',
      background: { type: 'solid', color1: '#3b2418', color2: '#3b2418', angle: 0 },
      border: { width: 10, color: '#e7c9a0', radius: 40 },
      glow: false, icon: '☕', iconSize: 22,
      lines: [
        newLine({ text: 'Café Aroma', font: 'Pacifico', size: 22, color: '#f5e6d3', bold: false }),
        newLine({ text: 'ESPRESSO · PAN · POSTRES', font: 'Montserrat', size: 7, color: '#e7c9a0', letterSpacing: 6 })
      ]
    }
  },
  {
    name: 'Neón',
    design: {
      widthCm: 100, heightCm: 50, material: 'neon', extras: ['instalacion'], align: 'center',
      background: { type: 'solid', color1: '#0a0a12', color2: '#0a0a12', angle: 0 },
      border: { width: 0, color: '#ffffff', radius: 20 },
      glow: true, icon: '', iconSize: 20,
      lines: [
        newLine({ text: 'Open', font: 'Pacifico', size: 36, color: '#ff4fd8', bold: false }),
        newLine({ text: '24 HORAS', font: 'Monoton', size: 12, color: '#38bdf8', bold: false, letterSpacing: 4 })
      ]
    }
  },
  {
    name: 'Taquería',
    design: {
      widthCm: 200, heightCm: 80, material: 'lona', extras: ['ojillos'], align: 'center',
      background: { type: 'gradient', color1: '#dc2626', color2: '#f59e0b', angle: 90 },
      border: { width: 14, color: '#16a34a', radius: 0 },
      glow: false, icon: '🌮', iconSize: 24,
      lines: [
        newLine({ text: 'TACOS EL GÜERO', font: 'Anton', size: 30, color: '#ffffff' }),
        newLine({ text: 'Pastor · Suadero · Bistec', font: 'Lobster', size: 13, color: '#fef3c7', bold: false })
      ]
    }
  },
  {
    name: 'Barbería',
    design: {
      widthCm: 60, heightCm: 90, material: 'acrilico', extras: [], align: 'center',
      background: { type: 'gradient', color1: '#0f172a', color2: '#1e293b', angle: 180 },
      border: { width: 8, color: '#c9a227', radius: 12 },
      glow: false, icon: '💈', iconSize: 18,
      lines: [
        newLine({ text: 'BARBER', font: 'Bebas Neue', size: 20, color: '#c9a227', letterSpacing: 8, bold: false }),
        newLine({ text: 'SHOP', font: 'Bebas Neue', size: 20, color: '#ffffff', letterSpacing: 8, bold: false }),
        newLine({ text: 'Est. 2024', font: 'Playfair Display', size: 6, color: '#94a3b8', italic: true, bold: false })
      ]
    }
  },
  {
    name: 'Se vende',
    design: {
      widthCm: 60, heightCm: 40, material: 'coroplast', extras: [], align: 'center',
      background: { type: 'solid', color1: '#facc15', color2: '#facc15', angle: 0 },
      border: { width: 16, color: '#111111', radius: 0 },
      glow: false, icon: '', iconSize: 20,
      lines: [
        newLine({ text: 'SE VENDE', font: 'Anton', size: 30, color: '#111111' }),
        newLine({ text: '55 1234 5678', font: 'Montserrat', size: 14, color: '#111111' })
      ]
    }
  },
  {
    name: 'Minimal',
    design: {
      widthCm: 120, heightCm: 40, material: 'vinil', extras: [], align: 'left',
      background: { type: 'solid', color1: '#ffffff', color2: '#ffffff', angle: 0 },
      border: { width: 0, color: '#000000', radius: 0 },
      glow: false, icon: '🌿', iconSize: 24,
      lines: [
        newLine({ text: 'Estudio Verde', font: 'Playfair Display', size: 26, color: '#14532d' }),
        newLine({ text: 'Plantas & diseño de interiores', font: 'Inter', size: 10, color: '#4b5563', bold: false })
      ]
    }
  }
]
