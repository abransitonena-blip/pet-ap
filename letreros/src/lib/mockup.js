// Imagen del letrero sobre la pared (o la foto del local) para mandar por WhatsApp o redes.
// Dibuja en un canvas: fondo + letrero (el mismo SVG de la vista previa) en la posición que se ve en pantalla.

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo generar la imagen'))
    img.src = src
  })

const cssUrl = (bg) => /url\("?(.*?)"?\)$/.exec(bg || '')?.[1]

export async function downloadMockup({ wall, signSvg, night, glow, halo, background, photo, caption, filename = 'mi-letrero.png' }) {
  const W = 1600
  const wr = wall.getBoundingClientRect()
  const H = Math.round((W * wr.height) / wr.width)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fondo: foto del local, pared con textura o color
  ctx.fillStyle = background.color || '#efeeea'
  ctx.fillRect(0, 0, W, H)
  const tex = photo || cssUrl(background.image)
  if (tex) {
    const img = await loadImage(tex)
    if (photo) {
      const s = Math.max(W / img.width, H / img.height)
      ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s)
    } else {
      const tile = parseFloat(background.size) || 300
      const scale = (tile / img.width) * (W / wr.width)
      const pattern = ctx.createPattern(img, 'repeat')
      pattern.setTransform(new DOMMatrix().scale(scale))
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, W, H)
    }
  }
  // Luz ambiente: viñeta suave; de noche, penumbra
  const vignette = ctx.createRadialGradient(W / 2, H * 0.4, H * 0.1, W / 2, H / 2, W * 0.75)
  vignette.addColorStop(0, night ? 'rgba(20,10,18,0.25)' : 'rgba(255,255,255,0.12)')
  vignette.addColorStop(1, night ? 'rgba(10,5,10,0.72)' : 'rgba(0,0,0,0.22)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)

  // Letrero en la misma posición y tamaño que en pantalla
  const sr = signSvg.getBoundingClientRect()
  const k = W / wr.width
  const x = (sr.left - wr.left) * k
  const y = (sr.top - wr.top) * k
  const w = sr.width * k
  const h = sr.height * k
  // De noche la luz del letrero ilumina la pared
  if (night && glow) {
    const cx = x + w / 2
    const cy = y + h / 2
    const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.2, cx, cy, Math.max(w, h) * 0.95)
    g.addColorStop(0, glow + '88')
    g.addColorStop(0.5, glow + '2a')
    g.addColorStop(1, glow + '00')
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }
  // Halo trasero: luz de la tira LED alrededor de la placa
  if (night && halo) {
    ctx.save()
    ctx.filter = 'blur(26px)'
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.85
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.roundRect(x - w * 0.04, y - h * 0.06, w * 1.08, h * 1.12, Math.min(w, h) * 0.12)
    ctx.fill()
    ctx.restore()
  }
  const clone = signSvg.cloneNode(true)
  clone.setAttribute('width', Math.round(w * 2))
  clone.setAttribute('height', Math.round(h * 2))
  clone.querySelectorAll('style').forEach((s) => s.remove()) // sin animación: todo encendido
  // Las fotos de textura se incrustan (un SVG convertido a imagen no puede cargar archivos externos)
  for (const im of clone.querySelectorAll('image')) {
    const href = im.getAttribute('href')
    if (!href || href.startsWith('data:')) continue
    try {
      const blob = await (await fetch(href)).blob()
      im.setAttribute('href', await new Promise((ok) => {
        const r = new FileReader()
        r.onload = () => ok(r.result)
        r.readAsDataURL(blob)
      }))
    } catch {
      /* sin textura: se queda el color base */
    }
  }
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    ctx.save()
    ctx.shadowColor = night ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 40
    ctx.shadowOffsetY = 22
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
  } finally {
    URL.revokeObjectURL(url)
  }

  // Marca de agua discreta
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'bottom'
  const text = caption
  const tw = ctx.measureText(text).width
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.roundRect(W - tw - 56, H - 62, tw + 32, 40, 20)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.fillText(text, W - tw - 40, H - 32)

  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = filename
  a.click()
}
