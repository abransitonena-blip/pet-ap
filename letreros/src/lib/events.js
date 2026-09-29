// Eventos del embudo: solo el nombre y el tipo de dispositivo (sin datos personales ni textos del diseño)
const sent = new Set()
export function track(name, { once = false } = {}) {
  if (once) {
    if (sent.has(name)) return
    sent.add(name)
  }
  const device = typeof window !== 'undefined' && window.innerWidth < 800 ? 'movil' : 'escritorio'
  try {
    fetch('/api/public/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, device }), keepalive: true }).catch(() => {})
  } catch {
    /* sin red: no pasa nada */
  }
}
