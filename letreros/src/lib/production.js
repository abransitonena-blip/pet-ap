// Archivos de producción a escala real (mm):
//  - Hojas 1:1 para impresora (letrero dividido en hojas con marcas de registro y puntos LED)
//  - DXF (contorno + puntos) para software CAD / láser
//  - G-code GRBL (Arduino) para cortadora/grabadora láser casera
//  - CSV con las coordenadas de los puntos
import { holeMm, ledPointsMm, signGeometryMm } from './ledPoints'
import { planPower } from './ledSign'

export const PAPERS = [
  { id: 'carta', name: 'Carta', w: 215.9, h: 279.4 },
  { id: 'oficio', name: 'Oficio', w: 216, h: 340 },
  { id: 'a4', name: 'A4', w: 210, h: 297 },
  { id: 'tabloide', name: 'Tabloide', w: 279.4, h: 431.8 }
]
export const SHEET_MARGIN_MM = 10
export const SHEET_OVERLAP_MM = 10

const f = (n) => (Math.round(n * 100) / 100).toString()
const rowName = (r) => String.fromCharCode(65 + (r % 26)) + (r >= 26 ? Math.floor(r / 26) : '')

// Elige orientación (vertical/horizontal) con menos hojas
export function planTiles(design, paperId) {
  const paper = PAPERS.find((p) => p.id === paperId) || PAPERS[0]
  const { w: sw, h: sh } = signGeometryMm(design)
  const options = [
    { orientation: 'vertical', pageW: paper.w, pageH: paper.h },
    { orientation: 'horizontal', pageW: paper.h, pageH: paper.w }
  ].map((o) => {
    const pw = o.pageW - 2 * SHEET_MARGIN_MM
    const ph = o.pageH - 2 * SHEET_MARGIN_MM
    const stepX = pw - SHEET_OVERLAP_MM
    const stepY = ph - SHEET_OVERLAP_MM
    const cols = sw <= pw ? 1 : Math.ceil((sw - SHEET_OVERLAP_MM) / stepX)
    const rows = sh <= ph ? 1 : Math.ceil((sh - SHEET_OVERLAP_MM) / stepY)
    return { ...o, paper, pw, ph, stepX, stepY, cols, rows, count: cols * rows, sw, sh }
  })
  return options[1].count < options[0].count ? options[1] : options[0]
}

// Marcas de registro: están en coordenadas del letrero, así que la misma marca
// sale en las dos hojas que se enciman y sirve para alinearlas.
function registrationMarks(plan) {
  const xs = Array.from({ length: plan.cols - 1 }, (_, k) => (k + 1) * plan.stepX + SHEET_OVERLAP_MM / 2)
  const ys = Array.from({ length: plan.rows - 1 }, (_, k) => (k + 1) * plan.stepY + SHEET_OVERLAP_MM / 2)
  const colMid = Array.from({ length: plan.cols }, (_, c) => Math.min(plan.sw, c * plan.stepX + plan.pw / 2))
  const rowMid = Array.from({ length: plan.rows }, (_, r) => Math.min(plan.sh, r * plan.stepY + plan.ph / 2))
  const marks = []
  for (const x of xs) for (const y of [...rowMid, ...ys]) marks.push([x, y])
  for (const y of ys) for (const x of colMid) marks.push([x, y])
  return marks
}

function regMark([x, y]) {
  return `<g stroke="#e11d48" stroke-width="0.25" fill="none"><circle cx="${f(x)}" cy="${f(y)}" r="3"/><line x1="${f(x - 5)}" y1="${f(y)}" x2="${f(x + 5)}" y2="${f(y)}"/><line x1="${f(x)}" y1="${f(y - 5)}" x2="${f(x)}" y2="${f(y + 5)}"/></g>`
}

function ledMarks(points, hole) {
  const r = hole / 2
  return points
    .map(
      ([x, y], i) =>
        `<g><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#fff" fill-opacity="0.85" stroke="#000" stroke-width="0.3"/>` +
        `<line x1="${f(x - r - 1.5)}" y1="${f(y)}" x2="${f(x + r + 1.5)}" y2="${f(y)}" stroke="#000" stroke-width="0.2"/>` +
        `<line x1="${f(x)}" y1="${f(y - r - 1.5)}" x2="${f(x)}" y2="${f(y + r + 1.5)}" stroke="#000" stroke-width="0.2"/>` +
        `<text x="${f(x + r + 1)}" y="${f(y - r - 0.5)}" font-size="2.6" font-family="Arial" fill="#000">${i + 1}</text></g>`
    )
    .join('')
}

function cutOutline(g) {
  return `<rect x="0" y="0" width="${f(g.w)}" height="${f(g.h)}" rx="${f(g.radius)}" fill="none" stroke="#000" stroke-width="0.35" stroke-dasharray="3 1.5"/>`
}

const scaleBar = (mm) =>
  `<svg width="${mm + 16}mm" height="5mm" viewBox="0 0 ${mm + 16} 5"><line x1="0" y1="2" x2="${mm}" y2="2" stroke="#000" stroke-width="0.4"/>` +
  `<line x1="0" y1="0.5" x2="0" y2="3.5" stroke="#000" stroke-width="0.4"/><line x1="${mm}" y1="0.5" x2="${mm}" y2="3.5" stroke="#000" stroke-width="0.4"/>` +
  `<text x="${mm + 2}" y="3" font-size="3" font-family="Arial">${mm / 10} cm</text></svg>`

// Documento HTML listo para imprimir. `signMarkup` es el SVG del letrero (anidable).
export function sheetsHtml(order, paperId, signMarkup) {
  const d = order.design
  const plan = planTiles(d, paperId)
  const g = signGeometryMm(d)
  const points = ledPointsMm(d)
  const marks = registrationMarks(plan)
  const overlay = cutOutline(g) + ledMarks(points, holeMm(d)) + marks.map(regMark).join('')
  const nested = (w, h) =>
    signMarkup.replace(/^<svg/, `<svg class="art" x="0" y="0" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none"`)

  // Página 1: mapa de armado
  const mapW = plan.pageW - 2 * SHEET_MARGIN_MM
  const mapH = plan.pageH - 2 * SHEET_MARGIN_MM - 70
  const k = Math.min(mapW / g.w, mapH / g.h)
  const tiles = []
  for (let r = 0; r < plan.rows; r++) {
    for (let c = 0; c < plan.cols; c++) {
      tiles.push({ r, c, x: c * plan.stepX, y: r * plan.stepY, name: `${rowName(r)}${c + 1}` })
    }
  }
  const mapSvg =
    `<svg width="${f(g.w * k)}mm" height="${f(g.h * k)}mm" viewBox="0 0 ${f(g.w)} ${f(g.h)}" style="overflow:visible">` +
    nested(g.w, g.h) +
    cutOutline(g) +
    tiles
      .map((t) => {
        const w = Math.min(plan.pw, g.w - t.x)
        const h = Math.min(plan.ph, g.h - t.y)
        const fs = Math.min(w, h) / 4
        return `<rect x="${f(t.x)}" y="${f(t.y)}" width="${f(w)}" height="${f(h)}" fill="#2563eb" fill-opacity="0.06" stroke="#2563eb" stroke-width="${f(1 / k)}"/>` +
          `<text x="${f(t.x + w / 2)}" y="${f(t.y + h / 2)}" font-size="${f(fs)}" font-family="Arial" font-weight="700" fill="#2563eb" text-anchor="middle" dominant-baseline="central" stroke="#fff" stroke-width="${f(fs / 12)}" paint-order="stroke">${t.name}</text>`
      })
      .join('') +
    `</svg>`

  const pageStyle = `width:${plan.pageW}mm;height:${plan.pageH}mm`
  const header = `${order.folio} · ${d.widthCm}×${d.heightCm} cm · ${plan.paper.name} ${plan.orientation}`
  const pages = [
    `<section class="sheet" style="${pageStyle}"><div class="inner">
      <h1>Hojas de impresión · ${order.folio}</h1>
      <p><b>${plan.count} hojas</b> ${plan.paper.name} (${plan.orientation}) · ${plan.cols} columnas × ${plan.rows} filas · letrero ${d.widthCm} × ${d.heightCm} cm a <b>escala 1:1</b></p>
      <p>Imprime al <b>100 % / tamaño real</b> (sin "ajustar a la página"). Mide la barra: debe medir exactamente 10 cm. ${scaleBar(100)}</p>
      <p>Encima las hojas ${SHEET_OVERLAP_MM} mm usando las marcas rojas ⊕. Línea punteada = corte. ${points.length ? `Círculos numerados = <b>${points.length} puntos LED</b> (barreno Ø ${holeMm(d)} mm).` : ''}</p>
      <div class="map">${mapSvg}</div>
    </div></section>`,
    ...tiles.map(
      (t, i) => `<section class="sheet" style="${pageStyle}">
      <svg class="tile" style="left:${SHEET_MARGIN_MM}mm;top:${SHEET_MARGIN_MM}mm" width="${f(plan.pw)}mm" height="${f(plan.ph)}mm" viewBox="${f(t.x)} ${f(t.y)} ${f(plan.pw)} ${f(plan.ph)}">
        ${nested(g.w, g.h)}${overlay}
        <line x1="${f(t.x + plan.stepX)}" y1="${f(t.y)}" x2="${f(t.x + plan.stepX)}" y2="${f(t.y + plan.ph)}" stroke="#2563eb" stroke-width="0.2" stroke-dasharray="1 1"/>
        <line x1="${f(t.x)}" y1="${f(t.y + plan.stepY)}" x2="${f(t.x + plan.pw)}" y2="${f(t.y + plan.stepY)}" stroke="#2563eb" stroke-width="0.2" stroke-dasharray="1 1"/>
      </svg>
      <div class="label"><b>Hoja ${t.name}</b> · fila ${rowName(t.r)}, columna ${t.c + 1} · ${i + 1} de ${plan.count} · ${header} ${scaleBar(50)}</div>
    </section>`
    )
  ]

  return `<!doctype html><html><head><meta charset="utf-8"><title>${order.folio} · Hojas ${plan.paper.name}</title>
<style>
@page { size: ${plan.pageW}mm ${plan.pageH}mm; margin: 0 }
* { box-sizing: border-box }
html, body { margin: 0; background: #888 }
body { font-family: Arial, Helvetica, sans-serif; color: #111 }
.sheet { position: relative; background: #fff; overflow: hidden; margin: 10mm auto; page-break-after: always; break-after: page }
.inner { padding: ${SHEET_MARGIN_MM}mm }
.inner h1 { font-size: 16pt; margin: 0 0 3mm }
.inner p { font-size: 9.5pt; margin: 0 0 2.5mm; line-height: 1.4 }
.inner p svg { vertical-align: middle }
.map { margin-top: 5mm; display: flex; justify-content: center }
.tile { position: absolute; overflow: hidden }
body.plantilla .tile .art { opacity: .16 }
.toolbar { position: sticky; top: 0; z-index: 5; display: flex; gap: 8px; align-items: center; justify-content: center; padding: 10px; background: #111; color: #fff; font-size: 13px }
.toolbar button { font: inherit; padding: 7px 14px; border-radius: 999px; border: 1px solid #555; background: none; color: #fff; cursor: pointer }
.toolbar button.on { background: #fff; color: #111 }
.toolbar .print { background: #22c55e; border-color: #22c55e; color: #04210f; font-weight: 700 }
.label { position: absolute; left: ${SHEET_MARGIN_MM}mm; right: ${SHEET_MARGIN_MM}mm; bottom: 1.5mm; font-size: 7.5pt; display: flex; gap: 3mm; align-items: center; white-space: nowrap; overflow: hidden }
@media print { html, body { background: #fff } .sheet { margin: 0 } .toolbar { display: none } }
</style></head><body class="plantilla">
<div class="toolbar">
  <span>${plan.count} hojas ${plan.paper.name} · imprime al 100 %</span>
  <button id="m-pl" class="on" onclick="document.body.classList.add('plantilla');this.classList.add('on');document.getElementById('m-co').classList.remove('on')">Plantilla (ahorra tinta)</button>
  <button id="m-co" onclick="document.body.classList.remove('plantilla');this.classList.add('on');document.getElementById('m-pl').classList.remove('on')">Color completo</button>
  <button class="print" onclick="window.print()">Imprimir</button>
</div>${pages.join('')}</body></html>`
}

// ---------- DXF (R12, mm) ----------
export function dxf(design) {
  const g = signGeometryMm(design)
  const r = g.radius
  const Y = (y) => g.h - y // DXF usa Y hacia arriba
  const out = ['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', '4', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES']
  const line = (x1, y1, x2, y2) => out.push('0', 'LINE', '8', 'CORTE', '10', f(x1), '20', f(y1), '11', f(x2), '21', f(y2))
  const arc = (cx, cy, a0, a1) => out.push('0', 'ARC', '8', 'CORTE', '10', f(cx), '20', f(cy), '40', f(r), '50', f(a0), '51', f(a1))
  line(r, 0, g.w - r, 0)
  line(g.w, r, g.w, g.h - r)
  line(g.w - r, g.h, r, g.h)
  line(0, g.h - r, 0, r)
  if (r > 0) {
    arc(g.w - r, r, 270, 360)
    arc(g.w - r, g.h - r, 0, 90)
    arc(r, g.h - r, 90, 180)
    arc(r, r, 180, 270)
  }
  for (const [x, y] of ledPointsMm(design)) {
    out.push('0', 'CIRCLE', '8', 'LED', '10', f(x), '20', f(Y(y)), '40', f(holeMm(design) / 2))
  }
  out.push('0', 'ENDSEC', '0', 'EOF')
  return out.join('\n') + '\n'
}

// ---------- G-code GRBL ----------
// Origen = esquina inferior izquierda del letrero. Primero marca los puntos LED, luego corta el contorno.
export function gcode(order, { power = 1000, markPower = 300, feed = 600, passes = 1 } = {}) {
  const d = order.design
  const g = signGeometryMm(d)
  const r = g.radius
  const Y = (y) => g.h - y
  const pts = ledPointsMm(d)
  const out = [
    `; LetreroLab ${order.folio} · ${d.widthCm}x${d.heightCm} cm · GRBL 1.1 (Arduino)`,
    `; Origen X0 Y0 = esquina inferior izquierda del letrero. Unidades mm.`,
    `; AJUSTA potencia (S) y velocidad (F) a tu laser y material antes de usar.`,
    `; Area de trabajo necesaria: ${f(g.w)} x ${f(g.h)} mm`,
    'G21 ; milimetros',
    'G90 ; coordenadas absolutas',
    '$32=1 ; modo laser GRBL',
    'M5',
    'G0 X0 Y0'
  ]
  if (pts.length) {
    out.push(`; --- ${pts.length} puntos LED (marcado) ---`)
    pts.forEach(([x, y], i) => {
      out.push(`G0 X${f(x)} Y${f(Y(y))} ; punto ${i + 1}`, `M3 S${markPower}`, 'G4 P0.3', 'M5')
    })
  }
  for (let p = 1; p <= passes; p++) {
    out.push(`; --- contorno de corte (pasada ${p}/${passes}) ---`, `G0 X${f(r)} Y0`, `M4 S${power}`, `G1 F${feed} X${f(g.w - r)} Y0`)
    if (r) out.push(`G3 X${f(g.w)} Y${f(r)} I0 J${f(r)}`)
    out.push(`G1 X${f(g.w)} Y${f(g.h - r)}`)
    if (r) out.push(`G3 X${f(g.w - r)} Y${f(g.h)} I${f(-r)} J0`)
    out.push(`G1 X${f(r)} Y${f(g.h)}`)
    if (r) out.push(`G3 X0 Y${f(g.h - r)} I0 J${f(-r)}`)
    out.push(`G1 X0 Y${f(r)}`)
    if (r) out.push(`G3 X${f(r)} Y0 I${f(r)} J0`)
    out.push('M5')
  }
  out.push('G0 X0 Y0', 'M2')
  return out.join('\n') + '\n'
}

// ---------- CSV de puntos ----------
export function pointsCsv(design) {
  const g = signGeometryMm(design)
  if (design.kind === 'led') {
    const plan = planPower(design)
    const rows = design.dots.map(([x, y, line], i) => {
      const s = plan.strings[plan.dotString[i] - 1]
      return `${i + 1},${f(x)},${f(g.h - y)},${f(y)},${line + 1},${design.lines[line]?.color || ''},S${s?.id ?? ''},${s?.output ?? ''}`
    })
    return ['punto,x_mm,y_mm_desde_abajo,y_mm_desde_arriba,linea,color,cadena,salida', ...rows].join('\n') + '\n'
  }
  const rows = ledPointsMm(design).map(([x, y], i) => `${i + 1},${f(x)},${f(g.h - y)},${f(y)}`)
  return ['punto,x_mm,y_mm_desde_abajo,y_mm_desde_arriba', ...rows].join('\n') + '\n'
}
