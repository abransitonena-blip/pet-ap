import { useEffect, useRef, useState } from 'react'
import { usePublicSettings } from '../lib/settings'

// Botón oficial “Continuar con Google” (Google Identity Services).
// Solo aparece si el negocio configuró GOOGLE_CLIENT_ID. onCredential recibe el token firmado.
let loader = null
const loadGsi = () =>
  (loader ||= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve(window.google)
    s.onerror = () => {
      loader = null
      reject(new Error('No se pudo cargar Google'))
    }
    document.head.appendChild(s)
  }))

export default function GoogleButton({ onCredential, text = 'continue_with', clientId: forced }) {
  const settings = usePublicSettings()
  const clientId = forced || settings.googleClientId
  const ref = useRef(null)
  const cb = useRef(onCredential)
  cb.current = onCredential
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clientId || !ref.current) return
    let alive = true
    loadGsi()
      .then((google) => {
        if (!alive || !ref.current) return
        google.accounts.id.initialize({ client_id: clientId, callback: (r) => cb.current(r.credential), ux_mode: 'popup' })
        google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', text, locale: 'es', width: Math.min(360, ref.current.offsetWidth || 320) })
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [clientId, text])

  if (!clientId) return null
  return (
    <div className="google-btn-wrap">
      <div ref={ref} className="google-btn" />
      {error && <p className="muted small">{error}</p>}
    </div>
  )
}
