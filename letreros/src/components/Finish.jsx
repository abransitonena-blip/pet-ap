import { useId } from 'react'
import { finishById } from '../lib/ledSign'

// Texturas procedurales en SVG (medidas en mm reales: la veta tiene el tamaño de una tabla de verdad).
// Se dibujan encima del color base y se recortan con el contorno de la placa.

const WOOD = {
  pino: { grain: [0.55, 0.36, 0.2], figure: [0.5, 0.31, 0.16], knots: 0.28 },
  roble: { grain: [0.38, 0.23, 0.11], figure: [0.33, 0.2, 0.1], knots: 0.35 },
  nogal: { grain: [0.17, 0.1, 0.05], figure: [0.12, 0.07, 0.035], knots: 0.25 }
}
const METAL = {
  espejo: ['#f7f9fb', '#c4cad2', '#ffffff', '#8f97a2', '#e6e9ee'],
  oro: ['#fbecb9', '#c79d45', '#fff6d6', '#9c7127', '#ead08a'],
  rosaoro: ['#f9dcd5', '#c98d83', '#fff0ec', '#a3665d', '#efc3b9'],
  aluminio: ['#e3e6ea', '#b8bec6', '#eef0f3', '#a9afb8', '#d8dce1'],
  cobre: ['#f4c7a3', '#b8693d', '#ffe2cc', '#8a4524', '#e3a07a']
}

// Relieve con luz real: el ruido es un mapa de alturas; la luz viene de arriba a la izquierda
// (sombras en los surcos y brillo en las crestas, como el barniz o el metal cepillado)
const RELIEF = {
  pino: { freq: '0.0026 0.14', oct: 4, seed: 7, scale: 1.4, shade: 0.35, spec: 0.35, exp: 22 },
  roble: { freq: '0.0026 0.14', oct: 4, seed: 7, scale: 1.8, shade: 0.4, spec: 0.3, exp: 20 },
  nogal: { freq: '0.0026 0.14', oct: 4, seed: 7, scale: 1.6, shade: 0.45, spec: 0.4, exp: 26 },
  concreto: { freq: '0.18', oct: 3, seed: 9, scale: 0.9, shade: 0.28, spec: 0.06, exp: 6 },
  pizarra: { freq: '0.006 0.035', oct: 5, seed: 17, scale: 4, shade: 0.55, spec: 0.25, exp: 12 },
  aluminio: { freq: '0.0007 0.9', oct: 2, seed: 2, scale: 0.6, shade: 0.15, spec: 0.7, exp: 8 },
  terrazo: { freq: '0.9', oct: 1, seed: 3, scale: 0.4, shade: 0.12, spec: 0.2, exp: 30 }
}

function Relief({ id, W, H, r }) {
  return (
    <>
      <filter id={`${id}-r`} filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency={r.freq} numOctaves={r.oct} seed={r.seed} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="height" />
        <feDiffuseLighting in="height" surfaceScale={r.scale} diffuseConstant="1" lightingColor="#fff" result="diffuse">
          <feDistantLight azimuth="225" elevation="48" />
        </feDiffuseLighting>
        <feColorMatrix in="diffuse" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-r.shade * 1.6} 0 0 0 ${r.shade * 1.25}`} result="shadow" />
        <feSpecularLighting in="height" surfaceScale={r.scale} specularConstant={r.spec} specularExponent={r.exp} lightingColor="#fff" result="spec">
          <feDistantLight azimuth="225" elevation="48" />
        </feSpecularLighting>
        <feColorMatrix in="spec" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="shine" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="shine" />
        </feMerge>
      </filter>
      <rect x="0" y="0" width={W} height={H} filter={`url(#${id}-r)`} />
    </>
  )
}

// Pizarra: capas de piedra oscura con vetas
function Slate({ id, W, H }) {
  return (
    <>
      <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.05" numOctaves="5" seed="17" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.53  0 0 0 0 0.56  1.4 0 0 0 -0.55" result="light" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.09  0 0 0 0 0.1  -1.4 0 0 0 0.7" result="dark" />
        <feMerge><feMergeNode in="dark" /><feMergeNode in="light" /></feMerge>
      </filter>
      <rect x="0" y="0" width={W} height={H} filter={`url(#${id})`} opacity="0.75" />
    </>
  )
}

// Fibra de carbono: tejido sarga 2×2 de 6 mm
function Carbon({ id }) {
  const t = 6
  return (
    <>
      <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1b1c1f" /><stop offset="0.5" stopColor="#4a4d55" /><stop offset="1" stopColor="#1b1c1f" />
      </linearGradient>
      <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#141518" /><stop offset="0.5" stopColor="#34363c" /><stop offset="1" stopColor="#141518" />
      </linearGradient>
      <pattern id={`${id}-p`} width={t * 2} height={t * 2} patternUnits="userSpaceOnUse">
        <rect width={t} height={t} fill={`url(#${id}-a)`} />
        <rect x={t} width={t} height={t} fill={`url(#${id}-b)`} />
        <rect y={t} width={t} height={t} fill={`url(#${id}-b)`} />
        <rect x={t} y={t} width={t} height={t} fill={`url(#${id}-a)`} />
      </pattern>
      <rect width="100%" height="100%" x="0" y="0" fill={`url(#${id}-p)`} />
    </>
  )
}

// Terrazo: chispas de piedra de colores (semilla fija, siempre igual)
function Terrazzo({ W, H }) {
  const colors = ['#e59aa9', '#9aa98e', '#d9b68a', '#8f8a86', '#f3c9a8', '#c95f5f', '#ffffff']
  let seed = 7
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  const n = Math.min(900, Math.round((W * H) / 900))
  const chips = []
  for (let i = 0; i < n; i++) {
    const x = rnd() * W, y = rnd() * H, r = 1.5 + rnd() * 5
    const pts = [0, 1, 2, 3, 4].map((k) => {
      const a = (k / 5) * Math.PI * 2 + rnd()
      const rr = r * (0.6 + rnd() * 0.6)
      return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`
    })
    chips.push(<polygon key={i} points={pts.join(' ')} fill={colors[i % colors.length]} />)
  }
  return <g>{chips}</g>
}
function Wood({ id, W, H, kind }) {
  const w = WOOD[kind]
  return (
    <>
      <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} colorInterpolationFilters="sRGB">
        {/* Veta fina: ruido estirado a lo largo de la tabla */}
        <feTurbulence type="fractalNoise" baseFrequency="0.0026 0.14" numOctaves="4" seed="7" result="n1" />
        <feColorMatrix in="n1" type="matrix" values={`0 0 0 0 ${w.grain[0]}  0 0 0 0 ${w.grain[1]}  0 0 0 0 ${w.grain[2]}  2.4 0 0 0 -0.98`} result="grain" />
        {/* Figura / anillos: ondulaciones grandes */}
        <feTurbulence type="turbulence" baseFrequency="0.0011 0.022" numOctaves="3" seed="3" result="n2" />
        <feColorMatrix in="n2" type="matrix" values={`0 0 0 0 ${w.figure[0]}  0 0 0 0 ${w.figure[1]}  0 0 0 0 ${w.figure[2]}  1.5 0 0 0 -0.32`} result="fig" />
        {/* Nudos y manchas suaves */}
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="21" result="n3" />
        <feColorMatrix in="n3" type="matrix" values={`0 0 0 0 ${w.figure[0]}  0 0 0 0 ${w.figure[1]}  0 0 0 0 ${w.figure[2]}  0 0 ${3 * w.knots} 0 ${-1.55 * w.knots}`} result="knots" />
        {/* Poro fino: líneas delgadas y largas como en la madera real */}
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.7" numOctaves="2" seed="13" result="n4" />
        <feColorMatrix in="n4" type="matrix" values={`0 0 0 0 ${w.grain[0]}  0 0 0 0 ${w.grain[1]}  0 0 0 0 ${w.grain[2]}  2 0 0 0 -1.05`} result="pores" />
        {/* Brillo claro entre vetas */}
        <feColorMatrix in="n1" type="matrix" values="0 0 0 0 1  0 0 0 0 0.93  0 0 0 0 0.82  -1.1 0 0 0 0.38" result="light" />
        <feMerge>
          <feMergeNode in="light" />
          <feMergeNode in="fig" />
          <feMergeNode in="knots" />
          <feMergeNode in="grain" />
          <feMergeNode in="pores" />
        </feMerge>
      </filter>
      <rect x="0" y="0" width={W} height={H} filter={`url(#${id})`} opacity="0.9" />
    </>
  )
}

function Marble({ id, W, H }) {
  return (
    <>
      <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.0042" numOctaves="5" seed="11" result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.42  0 0 0 0 0.44  1 0 0 0 0" result="c" />
        <feComponentTransfer in="c" result="veins">
          <feFuncA type="table" tableValues="0 0 0 0 0.08 0.62 0.08 0 0 0" />
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="4" result="m" />
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 0.62  0 0 0 0 0.6  0 0 0 0 0.58  1 0 0 0 0" result="c2" />
        <feComponentTransfer in="c2" result="veins2">
          <feFuncA type="table" tableValues="0 0 0 0 0 0.3 0 0 0 0" />
        </feComponentTransfer>
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 0.75  0 0 0 0 0.72  0 0 0 0 0.7  0.35 0 0 0 -0.1" result="cloud" />
        <feMerge>
          <feMergeNode in="cloud" />
          <feMergeNode in="veins2" />
          <feMergeNode in="veins" />
        </feMerge>
      </filter>
      <rect x="0" y="0" width={W} height={H} filter={`url(#${id})`} />
    </>
  )
}

function Concrete({ id, W, H }) {
  return (
    <>
      <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="fine" />
        <feColorMatrix in="fine" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.29  0 0 0 0 0.28  1.2 0 0 0 -0.62" result="speck" />
        <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="4" seed="9" result="big" />
        <feColorMatrix in="big" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.34  0 0 0 0 0.33  0.9 0 0 0 -0.3" result="blotch" />
        <feColorMatrix in="big" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.98  -0.9 0 0 0 0.52" result="light" />
        <feMerge>
          <feMergeNode in="light" />
          <feMergeNode in="blotch" />
          <feMergeNode in="speck" />
        </feMerge>
      </filter>
      <rect x="0" y="0" width={W} height={H} filter={`url(#${id})`} />
    </>
  )
}

function Metal({ id, W, H, kind }) {
  const c = METAL[kind]
  const brushed = kind === 'aluminio'
  return (
    <>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c[0]} />
        <stop offset="0.28" stopColor={c[1]} />
        <stop offset="0.46" stopColor={c[2]} />
        <stop offset="0.72" stopColor={c[3]} />
        <stop offset="1" stopColor={c[4]} />
      </linearGradient>
      <rect x="0" y="0" width={W} height={H} fill={`url(#${id}-g)`} />
      {brushed ? (
        <>
          <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.0007 0.9" numOctaves="2" seed="2" result="n" />
            <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 0.35" />
          </filter>
          <rect x="0" y="0" width={W} height={H} filter={`url(#${id})`} style={{ mixBlendMode: 'overlay' }} />
        </>
      ) : (
        // Reflejos del espejo: bandas diagonales suaves
        <g opacity="0.55">
          <polygon points={`${W * 0.12},0 ${W * 0.3},0 ${W * 0.12},${H} ${-W * 0.06},${H}`} fill="#ffffff" opacity="0.55" />
          <polygon points={`${W * 0.36},0 ${W * 0.4},0 ${W * 0.22},${H} ${W * 0.18},${H}`} fill="#ffffff" opacity="0.7" />
          <polygon points={`${W * 0.7},0 ${W * 0.86},0 ${W * 0.68},${H} ${W * 0.52},${H}`} fill="#ffffff" opacity="0.35" />
        </g>
      )}
    </>
  )
}

function Base({ finish, id, W, H }) {
  if (WOOD[finish]) return <Wood id={id} W={W} H={H} kind={finish} />
  if (finish === 'marmol') return <Marble id={id} W={W} H={H} />
  if (finish === 'concreto') return <Concrete id={id} W={W} H={H} />
  if (finish === 'pizarra') return <Slate id={id} W={W} H={H} />
  if (finish === 'carbono') return <Carbon id={id} />
  if (finish === 'terrazo') return <Terrazzo W={W} H={H} />
  if (METAL[finish]) return <Metal id={id} W={W} H={H} kind={finish} />
  return null
}

// Capa de textura (sin recorte): la usa LedPreview dentro de un clipPath con la forma de la placa.
// `relief` añade el relieve con luz (se apaga en miniaturas para que carguen rápido)
export function FinishLayer({ finish, id, W, H, relief = true }) {
  return (
    <>
      <Base finish={finish} id={id} W={W} H={H} />
      {relief && RELIEF[finish] && <Relief id={id} W={W} H={H} r={RELIEF[finish]} />}
      {/* Barniz / pulido: brillo amplio y suave */}
      {['marmol', 'carbono', 'nogal', 'terrazo'].includes(finish) && (
        <>
          <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.38" stopColor="#fff" stopOpacity={finish === 'carbono' ? 0.18 : 0.22} />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <rect x="0" y="0" width={W} height={H} fill={`url(#${id}-gl)`} />
        </>
      )}
    </>
  )
}

// Muestra para el selector de acabados
export function FinishSwatch({ finish, fallback }) {
  const id = 'fs' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const f = finishById(finish)
  return (
    <svg viewBox="0 0 240 150" className="finish-swatch" aria-hidden="true">
      <rect width="240" height="150" fill={f.base || fallback} />
      <FinishLayer finish={finish} id={id} W={240} H={150} />
      <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.25" />
        <stop offset="1" stopColor="#000" stopOpacity="0.08" />
      </linearGradient>
      <rect width="240" height="150" fill={`url(#${id}-s)`} />
    </svg>
  )
}
