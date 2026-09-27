// Convierte el logo del cliente (PNG/JPG) en una máscara de 1 bit: lo oscuro o de color sobre fondo claro
// (o lo visible sobre fondo transparente) se vuelve LED.
import { LOGO_MAX, encodeMask } from './ledSign'

export async function imageToLogo(file, invert = false) {
  if (!file?.type?.startsWith('image/')) throw new Error('Elige una imagen (PNG o JPG)')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, (LOGO_MAX * 2) / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(4, Math.round(bitmap.width * scale))
  const h = Math.max(4, Math.round(bitmap.height * scale))
  const ctx = Object.assign(document.createElement('canvas'), { width: w, height: h }).getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  // Color de fondo: promedio de las 4 esquinas
  const corners = [0, w - 1, (h - 1) * w, h * w - 1]
  const bg = [0, 1, 2, 3].map((c) => corners.reduce((a, i) => a + data[i * 4 + c], 0) / 4)
  const transparentBg = bg[3] < 128
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3]
    let on
    if (transparentBg) on = a > 128
    else {
      const d = Math.hypot(data[i * 4] - bg[0], data[i * 4 + 1] - bg[1], data[i * 4 + 2] - bg[2])
      on = a > 128 && d > 70
    }
    ink[i] = on !== invert ? 1 : 0
  }

  // Recorta al contenido y reduce a máx. LOGO_MAX px
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ink[y * w + x]) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  if (x1 < 0) throw new Error('No encontramos el logo en la imagen: prueba con fondo blanco o transparente')
  const cw = x1 - x0 + 1
  const ch = y1 - y0 + 1
  const k = Math.min(1, LOGO_MAX / Math.max(cw, ch))
  const W = Math.max(4, Math.round(cw * k))
  const H = Math.max(4, Math.round(ch * k))
  const mask = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Muestreo por área: encendido si ≥ 40 % de los píxeles de origen lo están
      let on = 0, n = 0
      for (let sy = Math.floor(y / k); sy < Math.min(ch, Math.floor((y + 1) / k) || 1); sy++)
        for (let sx = Math.floor(x / k); sx < Math.min(cw, Math.floor((x + 1) / k) || 1); sx++) {
          on += ink[(y0 + sy) * w + x0 + sx]
          n++
        }
      mask[y * W + x] = n && on / n >= 0.4 ? 1 : 0
    }
  }
  return { w: W, h: H, rle: encodeMask(mask) }
}
