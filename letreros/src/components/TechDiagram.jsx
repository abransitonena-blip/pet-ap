import SignPreview from './SignPreview'
import { FONTS, LED_MODES } from '../lib/design'
import { extraById, ledSpec, materialById } from '../lib/pricing'
import { BRAND } from '../lib/brand'

// Plano de producción en SVG (A4 horizontal): letrero con cotas, colores,
// tipografías, iluminación LED y datos del pedido.
const PAGE_W = 1400
const PAGE_H = 990
const MM_PER_UNIT = 297 / PAGE_W
const INK = '#111111'
const MUTED = '#6b7280'
const LINE = '#d1d5db'
const FONT = 'Inter, Helvetica, Arial, sans-serif'

function Dimension({ x1, y1, x2, y2, label, vertical }) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  return (
    <g stroke={INK} strokeWidth="1.2" fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} markerStart="url(#arrow)" markerEnd="url(#arrow)" />
      <g transform={vertical ? `rotate(-90 ${mx} ${my})` : undefined}>
        <rect x={mx - 42} y={my - 12} width="84" height="24" fill="#fff" stroke="none" />
        <text x={mx} y={my} fill={INK} stroke="none" fontFamily={FONT} fontSize="15" fontWeight="700" textAnchor="middle" dominantBaseline="central">
          {label}
        </text>
      </g>
    </g>
  )
}

export default function TechDiagram({ order }) {
  const d = order.design
  const q = order.quote
  const led = ledSpec(d)
  const ledMode = LED_MODES.find((m) => m.id === d.led.mode)

  // Área de dibujo
  const areaX = 70, areaY = 150, areaW = 800, areaH = 560
  const scale = Math.min((areaW - 120) / d.widthCm, (areaH - 120) / d.heightCm)
  const sw = d.widthCm * scale
  const sh = d.heightCm * scale
  const sx = areaX + (areaW - sw) / 2
  const sy = areaY + (areaH - sh) / 2 + 10
  const ratio = Math.round((d.widthCm * 10) / (sw * MM_PER_UNIT))

  const fonts = [...new Set(d.lines.filter((l) => l.text.trim()).map((l) => l.font))]
  const rows = [
    ['Folio', order.folio],
    ['Cliente', order.customer?.name || '—'],
    ['Fecha', new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Cantidad', `${q.quantity} pieza${q.quantity > 1 ? 's' : ''}`],
    ['Medida', `${d.widthCm} × ${d.heightCm} cm`],
    ['Área', `${q.areaM2} m² c/u · ${Math.round(q.areaM2 * q.quantity * 100) / 100} m² total`],
    ['Material', materialById(d.material).name],
    ['Borde', d.border.width ? `${d.border.width} u · radio ${d.border.radius}` : 'Sin borde'],
    ['Extras', d.extras.map((e) => extraById(e)?.name).filter(Boolean).join(', ') || '—'],
    ['Iluminación', ledMode.name],
    ...(led
      ? [
          ['LED', led.label],
          ['Cantidad LED', led.quantity],
          ['Consumo', `${led.watts} W por pieza`],
          ['Fuente', `12 V · ${led.supplyWatts} W`]
        ]
      : []),
    ['Tipografías', fonts.map((f) => FONTS.find((x) => x.id === f)?.label || f).join(', ') || '—']
  ]
  const swatches = [
    ['Fondo', d.colors.bg],
    ['Texto', d.colors.text],
    ['Acento / LED', d.colors.accent]
  ]
  const tableX = 910, tableY = 150, rowH = 34

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className="tech-diagram" fontFamily={FONT}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0 1 L9 5 L0 9 z" fill={INK} />
        </marker>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 0 20" fill="none" stroke="#eef0f3" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width={PAGE_W} height={PAGE_H} fill="#fff" />
      <rect x="30" y="30" width={PAGE_W - 60} height={PAGE_H - 60} fill="none" stroke={INK} strokeWidth="2" />

      <text x="60" y="82" fontSize="26" fontWeight="800" fill={INK}>PLANO DE PRODUCCIÓN</text>
      <text x="60" y="110" fontSize="14" fill={MUTED}>{BRAND} · Diagrama técnico del letrero</text>
      <text x={PAGE_W - 60} y="82" fontSize="26" fontWeight="800" fill={INK} textAnchor="end">{order.folio}</text>
      <text x={PAGE_W - 60} y="110" fontSize="14" fill={MUTED} textAnchor="end">Escala aprox. 1:{ratio} en A4 horizontal</text>
      <line x1="30" y1="130" x2={PAGE_W - 30} y2="130" stroke={INK} strokeWidth="1.5" />

      {/* Área de dibujo */}
      <rect x={areaX} y={areaY} width={areaW} height={areaH} fill="url(#grid)" stroke={LINE} />
      <line x1={sx} y1={sy - 12} x2={sx} y2={sy - 58} stroke={MUTED} strokeWidth="1" strokeDasharray="4 3" />
      <line x1={sx + sw} y1={sy - 12} x2={sx + sw} y2={sy - 58} stroke={MUTED} strokeWidth="1" strokeDasharray="4 3" />
      <line x1={sx + sw + 12} y1={sy} x2={sx + sw + 58} y2={sy} stroke={MUTED} strokeWidth="1" strokeDasharray="4 3" />
      <line x1={sx + sw + 12} y1={sy + sh} x2={sx + sw + 58} y2={sy + sh} stroke={MUTED} strokeWidth="1" strokeDasharray="4 3" />
      <Dimension x1={sx} y1={sy - 45} x2={sx + sw} y2={sy - 45} label={`${d.widthCm} cm`} />
      <Dimension x1={sx + sw + 45} y1={sy} x2={sx + sw + 45} y2={sy + sh} label={`${d.heightCm} cm`} vertical />
      <SignPreview design={d} svgProps={{ x: sx, y: sy, width: sw, height: sh, className: undefined }} />
      <rect x={sx} y={sy} width={sw} height={sh} rx={(Math.min(d.border.radius, 250) * Math.min(sw, sh)) / 500} fill="none" stroke={INK} strokeWidth="1" />

      {/* Colores */}
      <text x={areaX} y="760" fontSize="13" fontWeight="700" fill={MUTED} letterSpacing="1.5">COLORES (3)</text>
      {swatches.map(([label, hex], i) => (
        <g key={label} transform={`translate(${areaX + i * 270} 778)`}>
          <rect width="56" height="56" rx="8" fill={hex} stroke={LINE} />
          <text x="72" y="22" fontSize="15" fontWeight="700" fill={INK}>{label}</text>
          <text x="72" y="44" fontSize="15" fill={MUTED}>{hex.toUpperCase()}</text>
        </g>
      ))}

      {/* Textos */}
      <text x={areaX} y="872" fontSize="13" fontWeight="700" fill={MUTED} letterSpacing="1.5">TEXTOS</text>
      {d.lines.filter((l) => l.text.trim()).slice(0, 4).map((l, i) => (
        <text key={i} x={areaX + (i % 2) * 420} y={898 + Math.floor(i / 2) * 24} fontSize="14" fill={INK}>
          “{l.text.length > 28 ? l.text.slice(0, 27) + '…' : l.text}” · {l.font}{l.bold ? ' Bold' : ''} · {l.tone === 'accent' ? 'acento' : 'texto'}
        </text>
      ))}

      {/* Cuadro de datos */}
      <rect x={tableX} y={tableY} width={PAGE_W - 60 - tableX} height={rows.length * rowH + 20} fill="#fafafa" stroke={LINE} />
      {rows.map(([k, v], i) => (
        <g key={k}>
          <text x={tableX + 18} y={tableY + 34 + i * rowH} fontSize="13" fill={MUTED}>{k}</text>
          <text x={tableX + 140} y={tableY + 34 + i * rowH} fontSize="14" fontWeight="600" fill={INK}>
            {String(v).length > 34 ? String(v).slice(0, 33) + '…' : v}
          </text>
          {i < rows.length - 1 && (
            <line x1={tableX + 18} x2={PAGE_W - 78} y1={tableY + 46 + i * rowH} y2={tableY + 46 + i * rowH} stroke="#eceef1" />
          )}
        </g>
      ))}
      <text x={tableX} y={PAGE_H - 60} fontSize="12" fill={MUTED}>Revisar medidas y colores antes de producir.</text>
      <text x={tableX} y={PAGE_H - 42} fontSize="12" fill={MUTED}>Colores en HEX (pantalla); ajustar a perfil de impresión.</text>
    </svg>
  )
}
