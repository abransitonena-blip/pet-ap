// Origen de la visita para marketing: ?ref=campaña (o utm_source) y ?cupon=CODIGO en el enlace.
// Se guarda el primer origen 30 días (atribución “primer contacto”).
const KEY = 'ap_campaign'
const DAYS = 30

export function captureCampaign(search = typeof location !== 'undefined' ? location.search + location.hash.replace(/^[^?]*/, '') : '') {
  try {
    const q = new URLSearchParams(search.replace(/^[^?]*\?/, ''))
    const ref = (q.get('ref') || q.get('utm_source') || '').replace(/[^\w.-]/g, '').slice(0, 40)
    const coupon = (q.get('cupon') || q.get('coupon') || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20)
    const prev = readCampaign()
    if (!ref && !coupon) return prev
    const next = { ref: prev.ref || ref, coupon: coupon || prev.coupon, at: prev.at || Date.now() }
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    return {}
  }
}

export function readCampaign() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || '{}')
    return c.at && Date.now() - c.at < DAYS * 86400000 ? c : {}
  } catch {
    return {}
  }
}
