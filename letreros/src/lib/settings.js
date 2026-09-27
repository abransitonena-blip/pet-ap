// Precios y datos públicos del negocio, cargados una vez desde el servidor.
// Mientras llegan (o si no hay red) se usan los valores de fábrica.
import { useEffect, useState } from 'react'
import { api } from './api'
import { DEFAULT_BUSINESS, DEFAULT_PRICES } from './prices'

const FALLBACK = { prices: DEFAULT_PRICES, business: DEFAULT_BUSINESS }
let cache = null

export function loadPublicSettings() {
  cache = cache || api.publicSettings().catch(() => FALLBACK)
  return cache
}

export function usePublicSettings() {
  const [settings, setSettings] = useState(FALLBACK)
  useEffect(() => {
    let alive = true
    loadPublicSettings().then((s) => alive && setSettings(s))
    return () => {
      alive = false
    }
  }, [])
  return settings
}
