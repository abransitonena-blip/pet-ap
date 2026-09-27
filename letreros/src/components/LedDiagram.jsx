import LedPreview from './LedPreview'
import { ANIMATIONS, BOARDS, DOT_STYLES, MOUNTS, POWER, SHAPES, boardMaterialById, boardOutline, finishById, ledColorById, mountHoles, planPower } from '../lib/ledSign'

// Diagrama de conexión del letrero LED (A4 horizontal): recorrido de cada cadena
// en serie, tabla de salidas (capacitor / resistencia), lista de materiales y advertencias.
const PAGE_W = 1400
const PAGE_H = 990
const INK = '#111'
const MUTED = '#6b7280'
const LINE = '#d1d5db'
const FONT = 'Inter, Helvetica, Arial, sans-serif'
const ROUTE = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5']

export default function LedDiagram({ order }) {
  const d = order.design
  const plan = planPower(d)
  const is127 = d.power === '127v'

  const areaX = 60, areaY = 140, areaW = 820, areaH = 520
  const scale = Math.min(areaW / (d.widthCm * 10), areaH / (d.heightCm * 10))
  const sw = d.widthCm * 10 * scale
  const sh = d.heightCm * 10 * scale
  const sx = areaX + (areaW - sw) / 2
  const sy = areaY + (areaH - sh) / 2
  const P = (p) => [sx + p[0] * scale, sy + p[1] * scale]

  const rows = plan.strings.slice(0, 16)
  const tableX = 910
  const bomY = 700

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className="tech-diagram" fontFamily={FONT}>
      <rect width={PAGE_W} height={PAGE_H} fill="#fff" />
      <rect x="30" y="30" width={PAGE_W - 60} height={PAGE_H - 60} fill="none" stroke={INK} strokeWidth="2" />
      <text x="60" y="80" fontSize="26" fontWeight="800" fill={INK}>DIAGRAMA DE CONEXIÓN · LED</text>
      <text x="60" y="108" fontSize="14" fill={MUTED}>
        {d.dots.length} LED {d.ledMm} mm · {DOT_STYLES.find((s) => s.id === d.style)?.name} · {ANIMATIONS.find((a) => a.id === d.animation)?.name} · {POWER.find((p) => p.id === d.power)?.name}
      </text>
      <text x={PAGE_W - 60} y="80" fontSize="26" fontWeight="800" fill={INK} textAnchor="end">{order.folio}</text>
      <text x={PAGE_W - 60} y="108" fontSize="14" fill={MUTED} textAnchor="end">
        Placa {d.widthCm} × {d.heightCm} cm · {SHAPES.find((x) => x.id === d.shape)?.name.toLowerCase()} · {boardMaterialById(d.material).name} {finishById(d.finish).id === 'liso' ? BOARDS.find((b) => b.id === d.board)?.name.toLowerCase() : `vinil ${finishById(d.finish).name.toLowerCase()}`}{d.frame?.on ? ` · marco LED ${d.frame.double ? 'doble' : 'sencillo'}` : ''} · {MOUNTS.find((x) => x.id === d.mount)?.name.toLowerCase()}
      </text>
      <line x1="30" y1="124" x2={PAGE_W - 30} y2="124" stroke={INK} strokeWidth="1.5" />

      {/* Placa con el recorrido de cada cadena */}
      <g opacity="0.35">
        <LedPreview design={d} night={false} relief={false} svgProps={{ x: sx, y: sy, width: sw, height: sh, className: undefined }} />
      </g>
      <path d={boardOutline(d).d} transform={`translate(${sx} ${sy}) scale(${scale})`} fill="none" stroke={INK} strokeWidth={1 / scale} />
      {mountHoles(d).map(([x, y], i) => (
        <circle key={i} cx={sx + x * scale} cy={sy + y * scale} r="3.5" fill="none" stroke="#2563eb" strokeWidth="1.2" />
      ))}
      {plan.strings.map((s, k) => {
        const idx = d.dots.map((_, i) => i).filter((i) => plan.dotString[i] === s.id)
        const color = ROUTE[k % ROUTE.length]
        const pts = idx.map((i) => P(d.dots[i]))
        const [fx, fy] = pts[0]
        const [lx, ly] = pts[pts.length - 1]
        return (
          <g key={s.id}>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
            {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={Math.max(1.6, (d.ledMm / 2) * scale)} fill={color} />)}
            <text x={fx} y={fy - 6} fontSize="11" fontWeight="700" fill={color} textAnchor="middle">S{s.id}+</text>
            <text x={lx} y={ly + 14} fontSize="11" fontWeight="700" fill={color} textAnchor="middle">S{s.id}−</text>
          </g>
        )
      })}

      {/* Tabla de salidas */}
      <text x={tableX} y="150" fontSize="13" fontWeight="700" fill={MUTED} letterSpacing="1.5">CADENAS EN SERIE ({plan.strings.length})</text>
      {['#', 'Color', 'LED', 'Volts', is127 ? 'Capacitor' : 'Resistencia', 'mA', 'Salida'].map((h, i) => (
        <text key={h} x={tableX + [0, 36, 128, 170, 220, 300, 345][i]} y="176" fontSize="12" fontWeight="700" fill={INK}>{h}</text>
      ))}
      <line x1={tableX} x2={PAGE_W - 60} y1="184" y2="184" stroke={LINE} />
      {rows.map((s, i) => {
        const y = 204 + i * 26
        return (
          <g key={s.id} fontSize="12.5" fill={INK}>
            <rect x={tableX} y={y - 11} width="24" height="15" rx="3" fill={ROUTE[i % ROUTE.length]} />
            <text x={tableX + 5} y={y} fill="#fff" fontWeight="700" fontSize="10.5">S{s.id}</text>
            <circle cx={tableX + 44} cy={y - 4} r="5" fill={ledColorById(s.color).hex} stroke="#0003" />
            <text x={tableX + 54} y={y}>{ledColorById(s.color).name}</text>
            <text x={tableX + 128} y={y}>{s.count}</text>
            <text x={tableX + 170} y={y}>{s.volts} V</text>
            <text x={tableX + 220} y={y} fontWeight="700">{is127 ? `${s.cap} 400V` : `${s.resistor} Ω`}</text>
            <text x={tableX + 300} y={y}>{s.mA}</text>
            <text x={tableX + 345} y={y}>{s.output}</text>
          </g>
        )
      })}
      {plan.strings.length > rows.length && (
        <text x={tableX} y={204 + rows.length * 26} fontSize="12" fill={MUTED}>… y {plan.strings.length - rows.length} cadenas más (ver CSV de puntos)</text>
      )}
      <text x={tableX} y="646" fontSize="12" fill={MUTED}>
        {is127 ? 'I = 240 × C(µF) × (180 V − Vtira) · tira ≤ 100 V' : 'R = (12 V − Vtira) / 15 mA · valores E12'}
      </text>
      <text x={tableX} y="664" fontSize="12" fill={MUTED}>
        Total ≈ {plan.totalMa} mA · {plan.watts} W{is127 ? '' : ` · eliminador 12 V ${plan.supplyA} A`}
      </text>

      {/* Materiales */}
      <line x1="30" y1={bomY - 20} x2={PAGE_W - 30} y2={bomY - 20} stroke={LINE} />
      <text x="60" y={bomY + 6} fontSize="13" fontWeight="700" fill={MUTED} letterSpacing="1.5">MATERIALES</text>
      {plan.bom.slice(0, 10).map((b, i) => (
        <text key={i} x={60 + (i % 2) * 420} y={bomY + 34 + Math.floor(i / 2) * 24} fontSize="13.5" fill={INK}>
          <tspan fontWeight="700">{b.qty} ×</tspan> {b.item}
        </text>
      ))}

      <text x="60" y={PAGE_H - 88} fontSize="12.5" fontWeight="700" fill={INK}>Conexión:</text>
      <text x="130" y={PAGE_H - 88} fontSize="12.5" fill={INK}>
        cada cadena va del ánodo del primer LED (S+) al cátodo del último (S−); sigue la línea de color en el orden de los puntos numerados.
      </text>
      {is127 ? (
        <>
          <text x="60" y={PAGE_H - 64} fontSize="12.5" fontWeight="700" fill="#b91c1c">PELIGRO 127 V:</text>
          <text x="170" y={PAGE_H - 64} fontSize="12.5" fill="#b91c1c">
            fuente capacitiva no aislada. Placa, cables y LED quedan a voltaje de red. Desenchufa y espera 10 s antes de tocar.
          </text>
          <text x="60" y={PAGE_H - 44} fontSize="12.5" fill="#b91c1c">
            Monta todo dentro de caja cerrada, sin metal accesible. Sin electrolítico a la salida. R 1 MΩ entre L y N para descargar.
          </text>
        </>
      ) : (
        <text x="60" y={PAGE_H - 64} fontSize="12.5" fill={MUTED}>
          12 V: todas las cadenas en paralelo al eliminador (+ al ánodo del primer LED, − después de la resistencia del último).
        </text>
      )}
    </svg>
  )
}
