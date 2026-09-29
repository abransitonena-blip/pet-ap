import { matrixGlyph } from '../lib/ledText'
import { brandParts } from '../lib/brand'
import { usePublicSettings } from '../lib/settings'

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

// Logotipo: el nombre de la marca y al final el monograma AP en puntos de luz
export function Brand({ sub = '', size = 20 }) {
  const { business } = usePublicSettings()
  const { word, ap, full } = brandParts(business?.name)
  return (
    <span className="brand" aria-label={full}>
      <span className="brand-word">
        <b>{word}</b>
        {ap && <ApLogo size={size} />}
      </span>
      {sub && <em className="brand-sub">{sub}</em>}
    </span>
  )
}
