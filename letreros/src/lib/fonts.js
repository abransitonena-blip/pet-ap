// Carga la hoja de Google Fonts una sola vez y expone una promesa para esperar
// a que las @font-face existan (si no, document.fonts.load resuelve sin fuente
// y los puntos LED se calcularían con la fuente de respaldo).
import { GOOGLE_FONTS_URL } from './design'

let ready = null

export function fontsCssReady() {
  if (ready) return ready
  ready = new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve()
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = GOOGLE_FONTS_URL
    link.onload = () => resolve()
    link.onerror = () => resolve()
    document.head.appendChild(link)
    setTimeout(resolve, 8000) // sin red: seguimos con la fuente de respaldo
  })
  return ready
}
