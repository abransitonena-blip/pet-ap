import { matrixGlyph } from '../lib/ledText'

// Monograma "AP" hecho con puntos LED (fuente 5 × 7), en rosa de marca
const DOTS = []
;['A', 'P'].forEach((ch, k) =>
  matrixGlyph(ch).forEach((row, r) => {
    for (let c = 0; c < 5; c++) if (row & (1 << (4 - c))) DOTS.push([k * 6 + c, r])
  })
)

export default function ApLogo({ size = 22, lit = true }) {
  return (
    <svg className="ap-logo" viewBox="-0.6 -0.6 12.2 8.2" height={size} width={(size * 12.2) / 8.2} aria-label="AP">
      {DOTS.map(([x, y], i) => (
        <circle key={i} cx={x + 0.5} cy={y + 0.5} r="0.42" className={lit ? 'on' : ''} />
      ))}
    </svg>
  )
}

export function Brand({ sub = 'letreros' }) {
  return (
    <span className="brand">
      <ApLogo />
      <span className="brand-word">
        <b>AP</b>
        <em>{sub}</em>
      </span>
    </span>
  )
}
