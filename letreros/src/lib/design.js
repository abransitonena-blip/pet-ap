// Modelo del diseño de un letrero. Se usa en el navegador y en el servidor,
// así que aquí no puede haber APIs del DOM.
//
// Todo letrero se pinta con 3 colores: fondo, texto y acento.
// El acento también es el color del borde y de la iluminación LED.

export const FONTS = [
  // Bloque: letras gruesas, ideales para contorno y relleno
  { id: 'Anton', label: 'Anton', group: 'Bloque' },
  { id: 'Bebas Neue', label: 'Bebas Neue', group: 'Bloque' },
  { id: 'Oswald', label: 'Oswald', group: 'Bloque', q: 'Oswald:wght@400;700' },
  { id: 'Alfa Slab One', label: 'Alfa Slab', group: 'Bloque' },
  { id: 'Black Ops One', label: 'Black Ops', group: 'Bloque' },
  { id: 'Russo One', label: 'Russo One', group: 'Bloque' },
  { id: 'Rubik Mono One', label: 'Rubik Mono', group: 'Bloque' },
  { id: 'Bungee', label: 'Bungee', group: 'Bloque' },
  { id: 'Lilita One', label: 'Lilita One', group: 'Bloque' },
  // Moderna / redonda
  { id: 'Montserrat', label: 'Montserrat', group: 'Moderna', q: 'Montserrat:ital,wght@0,400;0,800;1,400;1,800' },
  { id: 'Poppins', label: 'Poppins', group: 'Moderna', q: 'Poppins:wght@400;800' },
  { id: 'Inter', label: 'Inter', group: 'Moderna', q: 'Inter:wght@400;600;700;800' },
  { id: 'Fredoka', label: 'Fredoka', group: 'Moderna', q: 'Fredoka:wght@400;700' },
  { id: 'Baloo 2', label: 'Baloo', group: 'Moderna', q: 'Baloo+2:wght@400;800' },
  { id: 'Righteous', label: 'Righteous', group: 'Moderna' },
  // Display / neón
  { id: 'Audiowide', label: 'Audiowide', group: 'Display' },
  { id: 'Orbitron', label: 'Orbitron', group: 'Display', q: 'Orbitron:wght@400;800' },
  { id: 'Monoton', label: 'Monoton', group: 'Display' },
  { id: 'Shrikhand', label: 'Shrikhand', group: 'Display' },
  { id: 'Permanent Marker', label: 'Marker', group: 'Display' },
  // Script: cursivas, lucen con trazo
  { id: 'Pacifico', label: 'Pacifico', group: 'Script' },
  { id: 'Lobster', label: 'Lobster', group: 'Script' },
  { id: 'Dancing Script', label: 'Dancing Script', group: 'Script', q: 'Dancing+Script:wght@400;700' },
  { id: 'Kaushan Script', label: 'Kaushan', group: 'Script' },
  { id: 'Yellowtail', label: 'Yellowtail', group: 'Script' },
  { id: 'Satisfy', label: 'Satisfy', group: 'Script' },
  { id: 'Great Vibes', label: 'Great Vibes', group: 'Script' },
  { id: 'Sacramento', label: 'Sacramento', group: 'Script' },
  { id: 'Caveat', label: 'Caveat', group: 'Script', q: 'Caveat:wght@400;700' },
  // Clásica
  { id: 'Playfair Display', label: 'Playfair', group: 'Clásica', q: 'Playfair+Display:ital,wght@0,400;0,800;1,400;1,800' }
]

export const FONT_GROUPS = ['Bloque', 'Moderna', 'Display', 'Script', 'Clásica']

// Una sola URL de Google Fonts para la página y los archivos exportados
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?' +
  FONTS.map((f) => `family=${f.q || f.id.replace(/ /g, '+')}`).join('&') +
  '&display=swap'

// Paletas de 3 colores en tendencia
export const PALETTES = [
  { id: 'mocha', name: 'Mocha', colors: { bg: '#3e2c23', text: '#f3e9dc', accent: '#c8a27a' } },
  { id: 'salvia', name: 'Salvia', colors: { bg: '#e3e8dc', text: '#2f3e2e', accent: '#7d8f55' } },
  { id: 'terracota', name: 'Terracota', colors: { bg: '#f4ece1', text: '#3b2a20', accent: '#c65d3b' } },
  { id: 'noche', name: 'Noche eléctrica', colors: { bg: '#0b1026', text: '#e8ecff', accent: '#4cc9f0' } },
  { id: 'lavanda', name: 'Lavanda digital', colors: { bg: '#efeaf8', text: '#2d2a4a', accent: '#8b74f0' } },
  { id: 'oro', name: 'Negro y oro', colors: { bg: '#111111', text: '#ffffff', accent: '#d4af37' } },
  { id: 'rosa', name: 'Rosa neón', colors: { bg: '#140a16', text: '#ffe3f6', accent: '#ff4fd8' } },
  { id: 'mantequilla', name: 'Mantequilla', colors: { bg: '#fff4c9', text: '#1f2937', accent: '#e8890c' } }
]

export const LED_MODES = [
  { id: 'none', name: 'Sin luz', note: 'Impresión normal' },
  { id: 'neon', name: 'Neón LED', note: 'Las letras brillan' },
  { id: 'backlit', name: 'Retroiluminado', note: 'Halo de luz detrás' },
  { id: 'perimeter', name: 'Tira LED', note: 'Focos en el contorno' }
]

export const ICONS = ['', '⭐', '☕', '🍕', '🌮', '🍔', '🍦', '💈', '✂️', '💅', '🐶', '🔧', '🚗', '🏠', '💡', '🎉', '❤️', '🌿', '🔥', '⚡', '🛒', '📍', '✅', '✨']

export const SIZE_PRESETS = [
  { label: '40 × 30', widthCm: 40, heightCm: 30 },
  { label: '60 × 40', widthCm: 60, heightCm: 40 },
  { label: '90 × 60', widthCm: 90, heightCm: 60 },
  { label: '120 × 60', widthCm: 120, heightCm: 60 },
  { label: '200 × 100', widthCm: 200, heightCm: 100 },
  { label: '300 × 90', widthCm: 300, heightCm: 90 },
  { label: '50 × 50', widthCm: 50, heightCm: 50 },
  { label: '60 × 90', widthCm: 60, heightCm: 90 }
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
    size: 14,
    tone: 'text',
    bold: false,
    italic: false,
    letterSpacing: 0,
    ...overrides
  }
}

export function defaultDesign() {
  return {
    widthCm: 120,
    heightCm: 60,
    material: 'acrilico',
    extras: [],
    align: 'center',
    palette: 'noche',
    colors: { ...PALETTES[3].colors },
    border: { width: 6, radius: 30 },
    led: { mode: 'neon' },
    icon: '',
    iconSize: 20,
    lines: [
      newLine({ text: 'Mi Negocio', font: 'Pacifico', size: 34, tone: 'accent' }),
      newLine({ text: 'ABIERTO', font: 'Montserrat', size: 10, tone: 'text', bold: true, letterSpacing: 30 })
    ]
  }
}

export const lineColor = (design, line) => (line.tone === 'accent' ? design.colors.accent : design.colors.text)

// Limpia/limita cualquier diseño recibido (formulario, localStorage o API).
export function normalizeDesign(input, materialIds, extraIds) {
  const d = input && typeof input === 'object' ? input : {}
  const def = defaultDesign()
  const colors = d.colors || {}
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
    palette: oneOf(d.palette, [...PALETTES.map((p) => p.id), 'custom'], 'custom'),
    colors: {
      bg: color(colors.bg, def.colors.bg),
      text: color(colors.text, def.colors.text),
      accent: color(colors.accent, def.colors.accent)
    },
    border: {
      width: Math.round(clamp(border.width, 0, 60, 0)),
      radius: Math.round(clamp(border.radius, 0, 200, 0))
    },
    led: { mode: oneOf(d.led?.mode, LED_MODES.map((m) => m.id), 'none') },
    icon: str(d.icon, 16),
    iconSize: Math.round(clamp(d.iconSize, 5, 60, 20)),
    lines: lines.map((l) => ({
      text: str(l?.text, 80),
      font: oneOf(l?.font, fontIds, 'Montserrat'),
      size: Math.round(clamp(l?.size, 4, 80, 14)),
      tone: oneOf(l?.tone, ['text', 'accent'], 'text'),
      bold: Boolean(l?.bold),
      italic: Boolean(l?.italic),
      letterSpacing: Math.round(clamp(l?.letterSpacing, -5, 40, 0))
    }))
  }
}

const pal = (id) => ({ palette: id, colors: { ...PALETTES.find((p) => p.id === id).colors } })

// Estilos de inicio rápido
export const TEMPLATES = [
  {
    name: 'Neón',
    design: {
      widthCm: 100, heightCm: 50, material: 'acrilico', extras: ['instalacion'], align: 'center',
      ...pal('rosa'), border: { width: 0, radius: 20 }, led: { mode: 'neon' }, icon: '', iconSize: 20,
      lines: [
        newLine({ text: 'Open', font: 'Pacifico', size: 36, tone: 'accent' }),
        newLine({ text: '24 HORAS', font: 'Monoton', size: 11, tone: 'text', letterSpacing: 4 })
      ]
    }
  },
  {
    name: 'Cafetería',
    design: {
      widthCm: 90, heightCm: 60, material: 'mdf', extras: [], align: 'center',
      ...pal('mocha'), border: { width: 8, radius: 40 }, led: { mode: 'backlit' }, icon: '☕', iconSize: 20,
      lines: [
        newLine({ text: 'Café Aroma', font: 'Pacifico', size: 22, tone: 'text' }),
        newLine({ text: 'ESPRESSO · PAN · POSTRES', font: 'Montserrat', size: 7, tone: 'accent', letterSpacing: 20, bold: true })
      ]
    }
  },
  {
    name: 'Barbería',
    design: {
      widthCm: 60, heightCm: 90, material: 'acrilico', extras: [], align: 'center',
      ...pal('oro'), border: { width: 8, radius: 12 }, led: { mode: 'perimeter' }, icon: '💈', iconSize: 16,
      lines: [
        newLine({ text: 'BARBER', font: 'Bebas Neue', size: 20, tone: 'accent', letterSpacing: 8 }),
        newLine({ text: 'SHOP', font: 'Bebas Neue', size: 20, tone: 'text', letterSpacing: 8 }),
        newLine({ text: 'Est. 2026', font: 'Playfair Display', size: 6, tone: 'text', italic: true })
      ]
    }
  },
  {
    name: 'Minimal',
    design: {
      widthCm: 120, heightCm: 40, material: 'pvc', extras: [], align: 'left',
      ...pal('salvia'), border: { width: 0, radius: 0 }, led: { mode: 'none' }, icon: '🌿', iconSize: 22,
      lines: [
        newLine({ text: 'Estudio Verde', font: 'Playfair Display', size: 26, tone: 'text', bold: true }),
        newLine({ text: 'Plantas & diseño de interiores', font: 'Inter', size: 10, tone: 'accent' })
      ]
    }
  },
  {
    name: 'Taquería',
    design: {
      widthCm: 200, heightCm: 80, material: 'lona', extras: ['ojillos'], align: 'center',
      ...pal('terracota'), border: { width: 12, radius: 0 }, led: { mode: 'none' }, icon: '🌮', iconSize: 22,
      lines: [
        newLine({ text: 'TACOS EL GÜERO', font: 'Anton', size: 30, tone: 'accent' }),
        newLine({ text: 'Pastor · Suadero · Bistec', font: 'Lobster', size: 13, tone: 'text' })
      ]
    }
  },
  {
    name: 'Estudio',
    design: {
      widthCm: 90, heightCm: 60, material: 'acrilico', extras: [], align: 'center',
      ...pal('lavanda'), border: { width: 0, radius: 60 }, led: { mode: 'backlit' }, icon: '✨', iconSize: 14,
      lines: [
        newLine({ text: 'nail studio', font: 'Righteous', size: 24, tone: 'text' }),
        newLine({ text: 'by Valeria', font: 'Pacifico', size: 12, tone: 'accent' })
      ]
    }
  }
]
