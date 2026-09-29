import { useEffect, useMemo, useRef, useState } from 'react'
import LedPreview, { mix, previewBox } from './LedPreview'
import { boardBase, boardOutline, dotColorId, haloOn, ledColorById, mountHoles, planPower } from '../lib/ledSign'
import { BRAND } from '../lib/brand'

const REST = { x: 3, y: -12 }

// Letrero en 3D: la placa tiene grosor (capas del contorno), sombra en la pared y gira 360°
// arrastrando con el mouse / dedo (o con `spin` y `angle` desde fuera). Por detrás se ve el
// armado real: patas de los LED, cableado de cada cadena, la placa de la fuente y el cable.
export default function Sign3D({ design, night, animate, enabled = true, draggable = true, angle = null, spin = false, brightness = 1, dusk = false, onAngle }) {
  const [rot, setRot] = useState(REST)
  const [live, setLive] = useState(false)
  const ref = useRef(null)
  const drag = useRef(null)
  const box = previewBox(design, true)
  const outline = boardOutline(design)
  const glass = design.board === 'transparente' && (design.finish || 'liso') === 'liso'
  const edge = glass ? '#e3eef2' : mix(boardBase(design), '#000000', 0.32)
  const accent = ledColorById(design.dots[0] ? dotColorId(design, design.dots[0]) : design.lines[0]?.color).hex
  // Grosor visual: acrílico delgado, PVC / MDF más gruesos (exagerado para que se aprecie)
  const layers = enabled ? (design.material === 'acrilico' ? 6 : 9) : 0
  const step = 1.3
  const viewBox = `${box.x} ${box.y} ${box.w} ${box.h}`

  // Giro controlado desde fuera (control deslizante)
  useEffect(() => {
    if (angle !== null && !drag.current) setRot((r) => ({ ...r, y: angle }))
  }, [angle])
  // Vuelta automática de 360°
  useEffect(() => {
    if (!spin || !enabled) return
    let raf
    let last = performance.now()
    const tick = (t) => {
      const dy = ((t - last) / 1000) * 40
      last = t
      setRot((r) => ({ x: 6, y: r.y + dy }))
      raf = requestAnimationFrame(tick)
    }
    setLive(true)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setLive(false)
    }
  }, [spin, enabled])

  const down = (e) => {
    if (!enabled || !draggable) return
    drag.current = { x: e.clientX, y: e.clientY, from: rot }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setLive(true)
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const y = d.from.y + (e.clientX - d.x) * 0.6
    setRot({ x: Math.max(-45, Math.min(45, d.from.x - (e.clientY - d.y) * 0.4)), y })
    onAngle?.(((Math.round(y) % 360) + 360) % 360)
  }
  const up = () => {
    drag.current = null
    setLive(false)
  }

  const transform = enabled ? `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` : 'none'
  const facingBack = enabled && Math.cos((rot.y * Math.PI) / 180) < 0
  return (
    <div
      className={`sign3d ${enabled ? 'on' : ''} ${drag.current ? 'grabbing' : ''}`}
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={() => enabled && setRot(REST)}
    >
      {night && !dusk && !facingBack && <div className="wall-spill" style={{ opacity: 0.35 + 0.4 * brightness, background: `radial-gradient(closest-side, ${accent}99, ${accent}33 55%, transparent)` }} />}
      <div className={`rig ${live ? 'live' : ''}`} style={{ transform }}>
        {night && haloOn(design) && (
          // Halo trasero: la tira LED detrás de la placa ilumina la pared alrededor del contorno
          <svg className="layer halo-layer" viewBox={viewBox} style={{ transform: `${enabled ? `translateZ(${-(layers + 14) * step}px) ` : ''}scale(1.06)`, opacity: (dusk ? 0.55 : 0.95) * (0.45 + 0.55 * brightness) }}>
            <path d={outline.d} fill="none" stroke={ledColorById(design.halo.color).hex} strokeWidth={Math.max(30, design.heightCm * 1.6)} />
            <path d={outline.d} fill={ledColorById(design.halo.color).hex} opacity="0.55" />
          </svg>
        )}
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
        {enabled && <BackFace design={design} viewBox={viewBox} box={box} outline={outline} z={-(layers + 1) * step} />}
        <div className="layer face">
          <LedPreview design={design} night={night} animate={animate} brightness={brightness} dusk={dusk} withMount />
        </div>
      </div>
    </div>
  )
}

// Reverso de la placa, visto desde atrás (espejado): patas de LED, cableado, fuente y cable de corriente
function BackFace({ design, viewBox, box, outline, z }) {
  const W = design.widthCm * 10
  const H = design.heightCm * 10
  const plan = useMemo(() => planPower(design), [design])
  const r = design.ledMm / 2
  const back = design.material === 'mdf' ? '#b9936b' : design.material === 'pvc' ? '#f1f1ee' : '#e9eef0'
  const wires = useMemo(() => {
    const byString = new Map()
    design.dots.forEach((p, i) => {
      const s = plan.dotString[i]
      if (!byString.has(s)) byString.set(s, [])
      byString.get(s).push(p)
    })
    return [...byString.values()].map((pts) => pts.map((p) => `${W - p[0]},${p[1]}`).join(' '))
  }, [design.dots, plan, W])
  const bw = Math.min(W * 0.22, 90)
  const bh = Math.min(H * 0.22, 45)
  const bx = W / 2 - bw / 2
  const by = H - bh - Math.max(12, H * 0.08)
  return (
    <svg className="layer back-face" viewBox={viewBox} style={{ transform: `translateZ(${z}px) rotateY(180deg)` }}>
      <path d={outline.d} fill={back} transform={`translate(${W} 0) scale(-1 1)`} stroke="#0002" />
      {/* Cableado de cada cadena en serie (rojo = positivo) */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {wires.map((pts, i) => <polyline key={i} points={pts} stroke={i % 2 ? '#1f2937' : '#b91c1c'} strokeWidth={Math.max(0.8, r * 0.28)} opacity="0.85" />)}
      </g>
      {/* Patas soldadas de cada LED */}
      <g fill="#9ca3af">
        {design.dots.map((p, i) => (
          <g key={i}>
            <circle cx={W - p[0] - r * 0.45} cy={p[1]} r={r * 0.22} />
            <circle cx={W - p[0] + r * 0.45} cy={p[1]} r={r * 0.22} />
          </g>
        ))}
      </g>
      {/* Placa de la fuente y cable de corriente con clavija */}
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="#166534" stroke="#0b3d1f" />
      <text x={bx + bw / 2} y={by + bh / 2 + 3} textAnchor="middle" fontSize={Math.min(10, bh / 3)} fill="#d1fae5" fontFamily="monospace">
        {design.power === '12v' ? '12 V' : `PLACA B ×${Math.max(1, plan.boardsB || plan.boardsA)}`}
      </text>
      <path d={`M${bx + bw} ${by + bh / 2} C ${W * 0.85} ${by + bh / 2}, ${W * 0.9} ${H}, ${W * 0.92} ${box.y + box.h}`} stroke="#111" strokeWidth={Math.max(2, W * 0.004)} fill="none" />
      {/* Cinchos del cableado */}
      {[0.3, 0.55].map((t) => <rect key={t} x={bx + bw + (W * 0.85 - bx - bw) * t} y={by + bh / 2 - 3} width={3} height={6} fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.4" />)}
      {/* Etiqueta y barrenos de montaje */}
      <rect x={W * 0.06} y={H * 0.08} width={Math.min(W * 0.28, 110)} height={Math.min(H * 0.14, 28)} rx={2} fill="#fff" stroke="#0001" />
      <text x={W * 0.06 + 6} y={H * 0.08 + Math.min(H * 0.14, 28) * 0.62} fontSize={Math.min(9, H * 0.05)} fill="#111" fontFamily="sans-serif">
        {BRAND} · {design.widthCm}×{design.heightCm} · {design.power === '12v' ? '12 V' : '127 V'}
      </text>
      {mountHoles(design).map(([x, y], i) => <circle key={i} cx={W - x} cy={y} r={4} fill="#6b7280" />)}
    </svg>
  )
}
