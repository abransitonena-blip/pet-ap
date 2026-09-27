// Catálogo imprimible (Imprimir → Guardar como PDF) con los modelos, su medida y precio vigente
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import LedPreview from '../components/LedPreview'
import { LED_MODELS } from './ledModels'
import { defaultLedDesign, finishById, normalizeLedDesign } from './ledSign'
import { computeLedDots } from './ledText'
import { computeTotals } from './prices'
import { money, quote } from './pricing'

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export async function printCatalog({ prices, business, onProgress }) {
  const win = window.open('', '_blank')
  if (!win) throw new Error('Permite las ventanas emergentes para imprimir el catálogo')
  win.document.write('<p style="font-family:sans-serif;padding:40px">Preparando catálogo…</p>')
  const cards = []
  for (const [i, m] of LED_MODELS.entries()) {
    onProgress?.(`${i + 1}/${LED_MODELS.length}`)
    const base = normalizeLedDesign({ ...defaultLedDesign(), ...m.d, dots: [] })
    const res = await computeLedDots(base)
    const design = normalizeLedDesign({ ...base, dots: res.dots, widthCm: res.widthCm, heightCm: res.heightCm })
    const total = computeTotals(quote({ ...design, quantity: 1 }, prices), {}, business).total
    let svg = renderToStaticMarkup(createElement(LedPreview, { design, night: true, withMount: true }))
    // Cada tarjeta se renderiza aparte y React repite los ids: los hacemos únicos por tarjeta
    const ids = [...new Set([...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))].sort((x, y) => y.length - x.length)
    for (const id of ids) svg = svg.split(`"${id}"`).join(`"${id}-k${i}"`).split(`#${id})`).join(`#${id}-k${i})`)
    const finish = finishById(design.finish)
    cards.push(`
      <article>
        <div class="art">${svg}</div>
        <h3>${esc(m.name)}</h3>
        <p>${design.widthCm} × ${design.heightCm} cm · ${design.dots.length} LED${finish.id !== 'liso' ? ` · ${esc(finish.name)}` : ''}${design.frame.on ? ' · marco LED' : ''}</p>
        <strong>${money(total)}</strong>
      </article>`)
  }
  const url = `${window.location.origin}${window.location.pathname}#/`
  const contact = [business.whatsapp && `WhatsApp ${esc(business.whatsapp)}`, business.instagram && `@${esc(business.instagram)}`, business.city && esc(business.city)]
    .filter(Boolean)
    .join(' · ')
  win.document.open()
  win.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Catálogo ${esc(business.name)}</title>
  <style>
    @page { size: letter; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; color: #111; margin: 0; }
    header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #ff4fb0; padding-bottom: 10px; margin-bottom: 14px; }
    header h1 { margin: 0; font-size: 26px; letter-spacing: -.02em; }
    header p { margin: 4px 0 0; color: #555; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    article { break-inside: avoid; border: 1px solid #e5e5e5; border-radius: 12px; padding: 10px; }
    .art { background: radial-gradient(ellipse at 50% 40%, #f7d3e2, #e9b8cd); border-radius: 8px; height: 120px; display: grid; place-items: center; padding: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .art svg { max-width: 100%; max-height: 104px; }
    h3 { margin: 8px 0 2px; font-size: 14px; }
    article p { margin: 0; font-size: 11px; color: #666; }
    article strong { display: block; margin-top: 4px; font-size: 16px; }
    footer { margin-top: 14px; padding: 12px 14px; border-radius: 12px; background: #111; color: #fff; display: flex; justify-content: space-between; gap: 12px; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    footer b { color: #ff8fcf; }
  </style></head><body>
    <header>
      <div><h1>${esc(business.name)}</h1><p>Letreros LED de puntos hechos a la medida · con tu nombre, logo y colores</p></div>
      <p>${contact}</p>
    </header>
    <div class="grid">${cards.join('')}</div>
    <footer>
      <span>Diseña el tuyo y ve el precio al instante: <b>${esc(url)}</b></span>
      <span>${business.warrantyMonths ? `Garantía ${business.warrantyMonths} meses · ` : ''}Listo en ${business.deliveryDays} días · Precios ${business.ivaIncluded ? 'con IVA' : 'más IVA'}</span>
    </footer>
    <script>setTimeout(() => print(), 400)</script>
  </body></html>`)
  win.document.close()
}
