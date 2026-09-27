// Archivos descargables: SVG vectorial del letrero y diagrama técnico (SVG / impresión PDF)
import { createElement } from 'react'
import DesignPreview from '../components/DesignPreview'
import TechDiagram from '../components/TechDiagram'
import LedDiagram from '../components/LedDiagram'
import { GOOGLE_FONTS_URL } from './design'
import { downloadBlob, downloadPng } from './render'
import { dxf, gcode, pointsCsv, sheetsHtml } from './production'

const FONTS_CSS = `@import url('${GOOGLE_FONTS_URL.replace(/&/g, '&amp;')}');`

async function toMarkup(element) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svg = renderToStaticMarkup(element)
  // Incrusta las fuentes para que el archivo se vea igual fuera de la web
  const withFonts = svg.replace(/^<svg([^>]*)>/, `<svg$1><style>${FONTS_CSS}</style>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${withFonts}`
}

export async function signSvgMarkup(design) {
  return toMarkup(
    createElement(DesignPreview, {
      design,
      night: design.kind === 'led' ? false : undefined,
      svgProps: { width: `${design.widthCm}cm`, height: `${design.heightCm}cm`, className: undefined }
    })
  )
}

export async function diagramSvgMarkup(order) {
  return toMarkup(createElement(order.design.kind === 'led' ? LedDiagram : TechDiagram, { order }))
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

// ---------- Producción: hojas 1:1, DXF, G-code, CSV ----------
const FONTS_HREF = GOOGLE_FONTS_URL

async function rawSignMarkup(design) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  return renderToStaticMarkup(createElement(DesignPreview, { design, night: false, svgProps: { className: undefined } }))
}

// Abre las hojas a tamaño real en una ventana nueva (con barra para elegir plantilla/color e imprimir)
export async function printSheets(order, paperId) {
  const win = window.open('', '_blank')
  if (!win) return alert('Permite las ventanas emergentes para ver las hojas.')
  const html = sheetsHtml(order, paperId, await rawSignMarkup(order.design)).replace(
    '<head>',
    `<head><link rel="stylesheet" href="${FONTS_HREF}">`
  )
  win.document.write(html)
  win.document.close()
}

const textBlob = (text, type = 'text/plain') => new Blob([text], { type })

export function downloadDxf(order) {
  downloadBlob(textBlob(dxf(order.design), 'application/dxf'), `${order.folio}.dxf`)
}

export function downloadGcode(order) {
  downloadBlob(textBlob(gcode(order)), `${order.folio}.gcode`)
}

export function downloadPointsCsv(order) {
  downloadBlob(textBlob(pointsCsv(order.design), 'text/csv'), `${order.folio}-puntos.csv`)
}

// PNG de cualquier letrero (el LED se rasteriza desde su SVG encendido)
export async function downloadDesignPng(design, filename, maxSide = 6000) {
  if (design.kind !== 'led') return downloadPng(design, filename, maxSide)
  const { renderToStaticMarkup } = await import('react-dom/server')
  const markup = renderToStaticMarkup(createElement(DesignPreview, { design, night: true, svgProps: { className: undefined } }))
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const k = maxSide / Math.max(design.widthCm, design.heightCm)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(design.widthCm * k)
    canvas.height = Math.round(design.heightCm * k)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    downloadBlob(blob, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}
