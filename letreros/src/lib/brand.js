// Marca: un nombre + el monograma "AP" al final. Se cambia en Panel → Negocio → Nombre.
// Opciones con .com y .mx libres (sep-2026): Destello AP, Lucero AP, Luciérnaga AP, Faro AP, Foco AP, Fulgor AP, Lumina AP.
export const BRAND = 'Destello AP'
export const TAGLINE = 'Letreros LED a la medida'
export const LEGACY_NAMES = ['AP letreros', 'AP Letreros']

// Separa la palabra del nombre y el "AP" final: "Destello AP" → { word: 'Destello', ap: true }
export function brandParts(name = BRAND) {
  const n = String(name || BRAND).trim()
  const m = /^(.*?)[\s·-]*AP$/i.exec(n)
  return m && m[1] ? { word: m[1].trim(), ap: true, full: n } : { word: n, ap: false, full: n }
}
