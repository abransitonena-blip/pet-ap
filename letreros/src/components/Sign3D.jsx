import { useRef, useState } from 'react'
import LedPreview, { mix, previewBox } from './LedPreview'
import { boardBase, boardOutline, dotColorId, ledColorById } from '../lib/ledSign'

const REST = { x: 3, y: -12 }

// Letrero en 3D: la placa tiene grosor (capas del contorno hacia atrás), sombra en la pared
// y gira con el mouse / dedo. De noche proyecta su luz sobre la pared.
export default function Sign3D({ design, night, animate, enabled = true, brightness = 1, dusk = false }) {
  const [rot, setRot] = useState(REST)
  const [live, setLive] = useState(false)
  const ref = useRef(null)
  const box = previewBox(design, true)
  const outline = boardOutline(design)
  const glass = design.board === 'transparente' && (design.finish || 'liso') === 'liso'
  const edge = glass ? '#e3eef2' : mix(boardBase(design), '#000000', 0.32)
  const accent = ledColorById(design.dots[0] ? dotColorId(design, design.dots[0]) : design.lines[0]?.color).hex
  // Grosor visual: acrílico delgado, PVC / MDF más gruesos (exagerado para que se aprecie)
  const layers = enabled ? (design.material === 'acrilico' ? 6 : 9) : 0
  const step = 1.3
  const viewBox = `${box.x} ${box.y} ${box.w} ${box.h}`

  const move = (e) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    setLive(true)
    setRot({ x: Math.max(-14, Math.min(14, -ny * 22)), y: Math.max(-28, Math.min(28, nx * 44)) })
  }
  const leave = () => {
    setLive(false)
    setRot(REST)
  }

  const transform = enabled ? `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` : 'none'
  return (
    <div className={`sign3d ${enabled ? 'on' : ''}`} ref={ref} onPointerMove={move} onPointerLeave={leave} onPointerUp={leave}>
      {night && !dusk && <div className="wall-spill" style={{ opacity: 0.35 + 0.4 * brightness, background: `radial-gradient(closest-side, ${accent}99, ${accent}33 55%, transparent)` }} />}
      <div className={`rig ${live ? 'live' : ''}`} style={{ transform }}>
        {enabled && (
          <svg className="layer shadow-layer" viewBox={viewBox} style={{ transform: `translateZ(${-(layers + 10) * step}px) translate(2.5%, 4%)` }}>
            <path d={outline.d} fill="#000" />
          </svg>
        )}
        {Array.from({ length: layers }, (_, i) => (
          <svg key={i} className="layer" viewBox={viewBox} style={{ transform: `translateZ(${-(i + 1) * step}px)` }}>
            <path d={outline.d} fill={edge} fillOpacity={glass ? 0.5 : 1} />
          </svg>
        ))}
        <div className="layer face">
          <LedPreview design={design} night={night} animate={animate} brightness={brightness} dusk={dusk} withMount />
        </div>
      </div>
    </div>
  )
}
