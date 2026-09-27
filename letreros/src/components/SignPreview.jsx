import { useEffect, useId, useMemo, useState } from 'react'
import { layoutSign, nightOverlay } from '../lib/render'

// Re-renderiza cuando terminan de cargar las fuentes web (cambian las medidas del texto)
function useFontsVersion() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!document.fonts) return
    const bump = () => setVersion((v) => v + 1)
    document.fonts.ready.then(bump)
    document.fonts.addEventListener('loadingdone', bump)
    return () => document.fonts.removeEventListener('loadingdone', bump)
  }, [])
  return version
}

// `night`: simula el letrero de noche (solo brilla lo que tiene LED).
// `svgProps`: atributos extra para anidar el SVG (x, y, width, height) en el diagrama.
export default function SignPreview({ design, night = false, className = '', svgProps = {} }) {
  const fontsVersion = useFontsVersion()
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const L = useMemo(() => layoutSign(design), [design, fontsVersion])
  const b = L.borderPx
  const overlay = night ? nightOverlay(L.mode) : 0
  const glow = L.mode === 'neon'
  const halo = L.mode === 'backlit' && night

  const panelOverlay = overlay > 0 && L.mode !== 'none' && (
    <rect width={L.W} height={L.H} rx={L.radiusPx} fill="#000" opacity={overlay} />
  )

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`sign-svg ${className}`}
      viewBox={`0 0 ${L.W} ${L.H}`}
      role="img"
      aria-label={design.lines.map((l) => l.text).join(' ')}
      style={halo ? { filter: `drop-shadow(0 0 18px ${L.colors.accent}) drop-shadow(0 0 40px ${L.colors.accent})`, overflow: 'visible' } : undefined}
      {...svgProps}
    >
      <defs>
        <filter id={`glow-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={night ? 14 : 8} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`dot-${uid}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation={L.dotR * (night ? 1.6 : 0.9)} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={L.W} height={L.H} rx={L.radiusPx} fill={L.colors.bg} />
      {b > 0 && (
        <rect
          x={b / 2} y={b / 2} width={L.W - b} height={L.H - b}
          rx={Math.max(0, L.radiusPx - b / 2)}
          fill="none" stroke={L.colors.accent} strokeWidth={b}
        />
      )}
      {panelOverlay}
      {L.items.map((it, i) =>
        it.type === 'icon' ? (
          <text key={i} x={it.x} y={it.y} fontSize={it.px} textAnchor={it.anchor} dominantBaseline="central">
            {it.text}
          </text>
        ) : (
          <text
            key={i}
            x={it.x}
            y={it.y}
            fill={it.color}
            fontFamily={`"${it.font}"`}
            fontSize={it.px}
            fontWeight={it.bold ? 800 : 400}
            fontStyle={it.italic ? 'italic' : 'normal'}
            letterSpacing={it.spacing}
            textAnchor={it.anchor}
            dominantBaseline="central"
            filter={glow ? `url(#glow-${uid})` : undefined}
            style={{ whiteSpace: 'pre' }}
          >
            {it.text}
          </text>
        )
      )}
      {L.dots.length > 0 && (
        <g filter={`url(#dot-${uid})`}>
          {L.dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={L.dotR} fill={night ? '#fff' : L.colors.accent} stroke={L.colors.accent} strokeWidth={L.dotR * 0.5} />
          ))}
        </g>
      )}
      {overlay > 0 && L.mode === 'none' && <rect width={L.W} height={L.H} rx={L.radiusPx} fill="#000" opacity={overlay} />}
    </svg>
  )
}
