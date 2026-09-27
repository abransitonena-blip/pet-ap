import { useId } from 'react'
import { SEQ_CHANNELS, boardById, boardOutline, ledColorById, mountHoles } from '../lib/ledSign'

// Espacio extra alrededor de la placa para dibujar el montaje (mm)
export function previewBox(design, withMount = true) {
  const W = design.widthCm * 10
  const H = design.heightCm * 10
  if (!withMount) return { x: 0, y: 0, w: W, h: H }
  if (design.mount === 'colgante') {
    const t = Math.max(50, H * 0.28)
    return { x: 0, y: -t, w: W, h: H + t }
  }
  if (design.mount === 'base') {
    const b = Math.max(40, Math.min(90, H * 0.18))
    return { x: -W * 0.05, y: 0, w: W * 1.1, h: H + b }
  }
  return { x: 0, y: 0, w: W, h: H }
}

// Vista del letrero de puntos LED en mm reales.
// `night`: LED encendidos con brillo · `animate`: parpadeo / secuencial en vivo
export default function LedPreview({ design, night = false, animate = false, withMount = false, className = '', svgProps = {} }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const W = design.widthCm * 10
  const H = design.heightCm * 10
  const board = boardById(design.board)
  const r = design.ledMm / 2
  const colors = design.lines.map((l) => ledColorById(l.color).hex)
  const seq = animate && design.animation === 'secuencial'
  const blink = animate && design.animation === 'parpadeo'
  const glass = design.board === 'transparente'
  const outline = boardOutline(design)
  const box = previewBox(design, withMount)
  const holes = withMount ? mountHoles(design) : []
  const accent = colors[0] || '#ff4fb0'

  const groups = seq ? [0, 1, 2] : [0]
  const dotsOf = (g) => (seq ? design.dots.filter((d) => d[3] % SEQ_CHANNELS === g) : design.dots)

  const css = `
    .b-${uid}{animation:bl-${uid} 1.2s steps(1) infinite}
    @keyframes bl-${uid}{50%{opacity:.12}}
    .s-${uid}{animation:sq-${uid} 1.98s steps(1) infinite;opacity:.12}
    @keyframes sq-${uid}{0%{opacity:1}33.3%{opacity:.12}}
  `

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`sign-svg ${className}`}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      role="img"
      aria-label={design.lines.map((l) => l.text).join(' ')}
      {...svgProps}
    >
      <defs>
        <filter id={`g-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={design.ledMm * 0.9} />
        </filter>
        <radialGradient id={`lens-${uid}`} cx="35%" cy="35%" r="65%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        {(seq || blink) && <style>{css}</style>}
      </defs>
      {withMount && design.mount === 'colgante' && (
        <g stroke="#6b6b70" strokeWidth={Math.max(1.2, W * 0.003)} fill="none">
          <path d={`M${holes[0][0]} ${holes[0][1]} L${W / 2} ${box.y + 14} L${holes[1][0]} ${holes[1][1]}`} />
          <circle cx={W / 2} cy={box.y + 8} r={6} />
        </g>
      )}
      {withMount && design.mount === 'base' && (
        <g>
          <rect x={W * 0.08} y={H - 6} width={W * 0.84} height={box.h - H + 6} rx={8} fill="#1d1d20" />
          <rect x={W * 0.1} y={H - 4} width={W * 0.8} height={3} rx={1.5} fill={night ? accent : '#3a3a3f'} opacity={night ? 0.9 : 1} />
          {night && <rect x={W * 0.1} y={H - 8} width={W * 0.8} height={10} rx={5} fill={accent} opacity="0.35" filter={`url(#g-${uid})`} />}
        </g>
      )}
      <path
        d={outline.d}
        fill={board.hex}
        fillOpacity={glass ? 0.28 : 1}
        stroke={glass ? '#ffffff88' : '#00000014'}
        strokeWidth={glass ? 2 : 1}
      />
      {holes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.2} fill="#00000033" stroke="#ffffff66" strokeWidth={0.8} />
      ))}
      {groups.map((g) => (
        <g
          key={g}
          className={seq ? `s-${uid}` : blink ? `b-${uid}` : undefined}
          style={seq ? { animationDelay: `${g * 0.66}s` } : undefined}
        >
          {night && (
            <g filter={`url(#g-${uid})`} opacity="0.95">
              {dotsOf(g).map((d, i) => (
                <circle key={i} cx={d[0]} cy={d[1]} r={r * 1.5} fill={colors[d[2]]} />
              ))}
            </g>
          )}
          {dotsOf(g).map((d, i) => (
            <circle
              key={i}
              cx={d[0]}
              cy={d[1]}
              r={r}
              fill={colors[d[2]]}
              fillOpacity={night ? 1 : 0.55}
              stroke={night ? 'none' : '#00000055'}
              strokeWidth={0.4}
            />
          ))}
          {dotsOf(g).map((d, i) => (
            <circle key={i} cx={d[0]} cy={d[1]} r={r} fill={`url(#lens-${uid})`} />
          ))}
        </g>
      ))}
    </svg>
  )
}
