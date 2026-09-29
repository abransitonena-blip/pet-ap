// Precios y datos públicos del negocio, cargados desde el servidor.
// Si la carga falla NO se ocultan: el editor avisa que el precio es estimado y permite reintentar.
// El precio definitivo siempre lo calcula el servidor al recibir la solicitud.
import { useEffect, useState } from 'react'
import { api } from './api'
import { DEFAULT_BUSINESS, DEFAULT_PRICES } from './prices'

const FALLBACK = { prices: DEFAULT_PRICES, business: DEFAULT_BUSINESS, textures: {}, ok: false, loading: true }
let cache = null
let current = FALLBACK
const listeners = new Set()
const publish = (s) => {
  current = s
  listeners.forEach((fn) => fn(s))
}

export function loadPublicSettings() {
  cache =
    cache ||
    api.publicSettings()
      .then((s) => {
        const out = { ...s, ok: true, loading: false }
        publish(out)
        return out
      })
      .catch(() => {
        cache = null // no se memoriza el fallo: el siguiente intento vuelve a pedirlo
        const out = { ...FALLBACK, ok: false, loading: false, error: 'No pudimos confirmar los precios vigentes' }
        publish(out)
        return out
      })
  return cache
}

export function usePublicSettings() {
  const [settings, setSettings] = useState(current)
  useEffect(() => {
    listeners.add(setSettings)
    loadPublicSettings()
    return () => listeners.delete(setSettings)
  }, [])
  return { ...settings, retry: refreshPublicSettings }
}

// Recarga después de cambiar precios o texturas desde el panel (o para reintentar)
export function refreshPublicSettings() {
  cache = null
  publish({ ...current, loading: true })
  return loadPublicSettings()
}
