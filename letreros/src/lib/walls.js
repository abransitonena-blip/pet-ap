// Paredes con textura para la vista previa: SVG en data-URI que se repite (sin descargar imágenes).
import { SCENES } from './ledSign'

const url = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' '))}")`
const noise = (id, freq, seed, alpha, color = '0 0 0', oct = 3) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 ${color.split(' ')[0]} 0 0 0 0 ${color.split(' ')[1]} 0 0 0 0 ${color.split(' ')[2]} ${alpha} 0 0 0 ${-alpha / 2}"/>
  </filter>`

function brick(fill, mortar, shade) {
  const bw = 120, bh = 58, g = 6
  const rows = [0, 1, 2, 3].map((r) => {
    const off = r % 2 ? -bw / 2 : 0
    return [0, 1, 2].map((c) => {
      const x = off + c * (bw + g)
      const tone = ((r * 7 + c * 3) % 5) / 5
      return `<rect x="${x}" y="${r * (bh + g)}" width="${bw}" height="${bh}" rx="2" fill="${fill}" opacity="${0.82 + tone * 0.18}"/>`
    }).join('')
  }).join('')
  const W = 2 * (bw + g), H = 4 * (bh + g)
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${noise('n', 0.35, 4, 1.1, shade)}${noise('m', 0.02, 8, 0.9, shade)}</defs>
    <rect width="${W}" height="${H}" fill="${mortar}"/>${rows}
    <rect width="${W}" height="${H}" filter="url(#n)" opacity=".5"/><rect width="${W}" height="${H}" filter="url(#m)" opacity=".35"/></svg>`)
}

function planks() {
  const tones = ['#b58458', '#a8774d', '#bf8f63', '#9f6f46']
  const pw = 90
  const W = pw * 4, H = 900
  const boards = tones.map((t, i) => `<rect x="${i * pw}" y="0" width="${pw - 3}" height="${H}" fill="${t}"/>`).join('')
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="g" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09 0.0035" numOctaves="4" seed="3" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 .3 0 0 0 0 .17 0 0 0 0 .08 2.2 0 0 0 -.95"/></filter></defs>
    <rect width="${W}" height="${H}" fill="#5a3a22"/>${boards}
    <rect width="${W}" height="${H}" filter="url(#g)"/></svg>`)
}

function tiles() {
  const tw = 100, th = 50, g = 3
  const W = 2 * tw, H = 2 * th
  const t = (x, y) => `<rect x="${x + g / 2}" y="${y + g / 2}" width="${tw - g}" height="${th - g}" rx="3" fill="url(#t)"/>`
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f1f1ef"/><stop offset="1" stop-color="#e2e2df"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="#cfccc6"/>
    ${t(0, 0)}${t(tw, 0)}${t(-tw / 2, th)}${t(tw / 2, th)}${t((3 * tw) / 2, th)}</svg>`)
}

function marble() {
  const W = 700, H = 700
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="v" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="5" seed="12" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 .45 0 0 0 0 .44 0 0 0 0 .46 1 0 0 0 0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0 0 0 .1 .6 .1 0 0 0"/></feComponentTransfer></filter></defs>
    <rect width="${W}" height="${H}" fill="#ece9e4"/><rect width="${W}" height="${H}" filter="url(#v)"/></svg>`)
}

function concrete() {
  const W = 400, H = 400
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>${noise('a', 0.9, 2, 1.4, '.25 .25 .24', 2)}${noise('b', 0.012, 6, 0.8, '.3 .3 .29', 4)}</defs>
    <rect width="${W}" height="${H}" fill="#aaa69f"/><rect width="${W}" height="${H}" filter="url(#b)"/><rect width="${W}" height="${H}" filter="url(#a)" opacity=".6"/></svg>`)
}

// Terrazo: chispas de color con semilla fija (siempre igual)
function terrazo() {
  const W = 360, H = 360
  const colors = ['#e59aa9', '#9aa98e', '#d9b68a', '#8f8a86', '#f3c9a8', '#c95f5f']
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  let chips = ''
  for (let i = 0; i < 70; i++) {
    const x = rnd() * W, y = rnd() * H, r = 2 + rnd() * 7
    const pts = [0, 1, 2, 3, 4].map((k) => {
      const a = (k / 5) * Math.PI * 2 + rnd()
      const rr = r * (0.6 + rnd() * 0.6)
      return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`
    }).join(' ')
    chips += `<polygon points="${pts}" fill="${colors[i % colors.length]}"/>`
  }
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#efe6df"/>${chips}</svg>`)
}

// Muro verde: hojas en capas con tonos de verde
function greenWall() {
  const W = 300, H = 300
  const greens = ['#2f5a2c', '#3f7337', '#4e8a43', '#5f9c4f', '#77b060', '#3a6a34']
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  let leaves = ''
  for (let i = 0; i < 140; i++) {
    const x = rnd() * W, y = rnd() * H, s = 10 + rnd() * 16, a = rnd() * 360
    leaves += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)}) scale(${(s / 20).toFixed(2)})" d="M0 0 C6 -8 16 -8 22 0 C16 8 6 8 0 0Z" fill="${greens[i % greens.length]}"/>`
  }
  return url(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#24421f"/>${leaves}</svg>`)
}

const BUILDERS = {
  concreto: () => ({ image: concrete(), size: '400px' }),
  ladrillo: () => ({ image: brick('#b0593d', '#c9b8a6', '.25 .1 .06'), size: '252px' }),
  ladrillob: () => ({ image: brick('#f2efea', '#d8d3cb', '.3 .29 .27'), size: '252px' }),
  madera: () => ({ image: planks(), size: '360px' }),
  azulejo: () => ({ image: tiles(), size: '120px' }),
  marmol: () => ({ image: marble(), size: '700px' }),
  terrazo: () => ({ image: terrazo(), size: '360px' }),
  verde: () => ({ image: greenWall(), size: '300px' })
}
const cache = {}

// Estilo CSS de la pared: textura (si tiene) o color liso
export function wallStyle(id) {
  const scene = SCENES.find((x) => x.id === id) || SCENES[0]
  if (!scene.tex || !BUILDERS[id]) return { '--scene': scene.hex }
  cache[id] = cache[id] || BUILDERS[id]()
  return { '--scene': scene.hex, backgroundImage: cache[id].image, backgroundSize: cache[id].size }
}
