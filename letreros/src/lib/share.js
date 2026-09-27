// Compartir / guardar un diseño LED en el enlace (#/?d=…). Los puntos no viajan:
// se recalculan al abrirlo, así el enlace es corto.

const encode = (obj) => {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const decode = (str) => {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
}

export function shareUrl(design) {
  const { dots, ...rest } = design
  return `${window.location.origin}${window.location.pathname}#/?d=${encode(rest)}`
}

// Lee un diseño compartido del enlace y lo quita de la barra de direcciones
export function readSharedDesign() {
  const m = window.location.hash.match(/[?&]d=([A-Za-z0-9_-]+)/)
  if (!m) return null
  try {
    const design = decode(m[1])
    history.replaceState(null, '', `${window.location.pathname}#/`)
    return { ...design, dots: [] }
  } catch {
    return null
  }
}
