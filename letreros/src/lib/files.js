// Archivos descargables: SVG vectorial del letrero y diagrama técnico (SVG / impresión PDF)
import { createElement } from 'react'
import SignPreview from '../components/SignPreview'
import TechDiagram from '../components/TechDiagram'
import { downloadBlob } from './render'

const FONTS_CSS =
  "@import url('https://fonts.googleapis.com/css2?family=Anton&amp;family=Bebas+Neue&amp;family=Inter:wght@400;600;700;800&amp;family=Lobster&amp;family=Monoton&amp;family=Montserrat:ital,wght@0,400;0,800;1,400;1,800&amp;family=Pacifico&amp;family=Permanent+Marker&amp;family=Playfair+Display:ital,wght@0,400;0,800;1,400;1,800&amp;family=Righteous&amp;display=swap');"

async function toMarkup(element) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(element)
  // Incrusta las fuentes para que el archivo se vea igual fuera de la web
  const withFonts = svg.replace(/^<svg([^>]*)>/, `<svg$1><style>${FONTS_CSS}</style>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${withFonts}`
}

export async function signSvgMarkup(design) {
  return toMarkup(
    createElement(SignPreview, {
      design,
      svgProps: { width: `${design.widthCm}cm`, height: `${design.heightCm}cm`, className: undefined }
    })
  )
}

export async function diagramSvgMarkup(order) {
  return toMarkup(createElement(TechDiagram, { order }))
}

const svgBlob = (markup) => new Blob([markup], { type: 'image/svg+xml' })

export async function downloadSignSvg(design, filename) {
  downloadBlob(svgBlob(await signSvgMarkup(design)), filename)
}

export async function downloadDiagramSvg(order) {
  downloadBlob(svgBlob(await diagramSvgMarkup(order)), `${order.folio}-diagrama.svg`)
}

// Abre el diagrama en una ventana lista para "Imprimir → Guardar como PDF"
export async function printDiagram(order) {
  const win = window.open('', '_blank')
  if (!win) return alert('Permite las ventanas emergentes para imprimir el diagrama.')
  const markup = (await diagramSvgMarkup(order)).replace(/^<\?xml[^>]*>\n/, '')
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${order.folio} · Diagrama</title>
<style>@page{size:A4 landscape;margin:0}html,body{margin:0}body>svg{width:100vw;height:auto;display:block}</style>
</head><body>${markup}</body></html>`)
  win.document.close()
  win.document.fonts.ready.then(() => setTimeout(() => win.print(), 300))
}
