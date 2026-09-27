// Reduce una foto del celular (varios MB) a JPEG de máx. 1600 px antes de subirla
export const photoUrl = (id) => `/api/photos/${id}`

export async function fileToJpeg(file, max = 1600, quality = 0.82) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Elige una imagen')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null)
  const source = bitmap || (await loadImage(file))
  const scale = Math.min(1, max / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(source.width * scale)
  canvas.height = Math.round(source.height * scale)
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height)
  bitmap?.close?.()
  return canvas.toDataURL('image/jpeg', quality)
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo leer la imagen'))
    img.src = URL.createObjectURL(file)
  })
}
