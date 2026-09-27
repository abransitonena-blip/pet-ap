import { useEffect, useId, useMemo, useState } from 'react'
import { gradientVector, layoutSign } from '../lib/render'

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

export default function SignPreview({ design, className = '', title }) {
  const fontsVersion = useFontsVersion()
  const uid = useId().replace(/:/g, '')
  const L = useMemo(() => layoutSign(design), [design, fontsVersion])
  const bg = L.background
  const g = gradientVector(bg.angle)
  const b = L.borderPx

  return (
    <svg
      className={`sign-svg ${className}`}
      viewBox={`0 0 ${L.W} ${L.H}`}
      role="img"
      aria-label={title || design.lines.map((l) => l.text).join(' ')}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
          <stop offset="0" stopColor={bg.color1} />
          <stop offset="1" stopColor={bg.type === 'gradient' ? bg.color2 : bg.color1} />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={L.W} height={L.H} rx={L.radiusPx} fill={`url(#bg-${uid})`} />
      {b > 0 && (
        <rect
          x={b / 2}
          y={b / 2}
          width={L.W - b}
          height={L.H - b}
          rx={Math.max(0, L.radiusPx - b / 2)}
          fill="none"
          stroke={L.border.color}
          strokeWidth={b}
        />
      )}
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
            filter={L.glow ? `url(#glow-${uid})` : undefined}
            style={{ whiteSpace: 'pre' }}
          >
            {it.text}
          </text>
        )
      )}
    </svg>
  )
}
