import { useId } from 'react'
import { SEQ_CHANNELS, boardById, ledColorById } from '../lib/ledSign'

// Vista del letrero de puntos LED en mm reales.
// `night`: LED encendidos con brillo · `animate`: parpadeo / secuencial en vivo
export default function LedPreview({ design, night = false, animate = false, className = '', svgProps = {} }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const W = design.widthCm * 10
  const H = design.heightCm * 10
  const board = boardById(design.board)
  const r = design.ledMm / 2
  const colors = design.lines.map((l) => ledColorById(l.color).hex)
  const seq = animate && design.animation === 'secuencial'
  const blink = animate && design.animation === 'parpadeo'
  const glass = design.board === 'transparente'

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
      viewBox={`0 0 ${W} ${H}`}
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
      <rect
        width={W}
        height={H}
        rx={design.cornerMm}
        fill={board.hex}
        fillOpacity={glass ? 0.28 : 1}
        stroke={glass ? '#ffffff55' : 'none'}
        strokeWidth={glass ? 2 : 0}
      />
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
