// Datos del cliente en un pedido. Módulo puro: lo usan el formulario y el servidor
// (las mismas reglas en los dos lados, para que un error se vea junto al campo y nunca tarde).
import { LEAD_SOURCES } from './business.js'

export const DELIVERY_OPTIONS = [
  { id: 'recoger', name: 'Recoger', note: 'En el taller' },
  { id: 'envio', name: 'Envío', note: 'Paquetería o local' },
  { id: 'instalacion', name: 'Instalación', note: 'Lo colocamos' }
]
export const deliveryName = (id) => DELIVERY_OPTIONS.find((d) => d.id === id)?.name || 'Recoger'
export const needsAddress = (delivery) => delivery === 'envio' || delivery === 'instalacion'

const text = (v, max) => String(v || '').trim().slice(0, max)

// WhatsApp: México a 10 dígitos (acepta +52 / 52 / 521 al inicio) o internacional con “+código de país”.
// Devuelve { phone } normalizado o { error }.
export function normalizePhone(value) {
  const raw = String(value || '').trim()
  let d = raw.replace(/\D/g, '')
  if (!d) return { error: 'Escribe tu WhatsApp' }
  const intl = raw.startsWith('+') && !d.startsWith('52')
  if (intl) return d.length >= 8 && d.length <= 15 ? { phone: `+${d}` } : { error: 'Número internacional inválido' }
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3)
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2)
  return d.length === 10 ? { phone: d } : { error: 'El WhatsApp debe tener 10 dígitos' }
}

export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
export const cpOk = (cp) => /^\d{5}$/.test(cp)

// Revisa campo por campo: { errors: { campo: mensaje } } para mostrarlos junto a cada campo
export function customerErrors(c = {}) {
  const errors = {}
  if (!text(c.name, 80)) errors.name = 'Escribe tu nombre o el de tu negocio'
  const ph = normalizePhone(c.phone)
  if (ph.error) errors.phone = ph.error
  const email = text(c.email, 120)
  if (email && !emailOk(email)) errors.email = 'El correo no es válido'
  if (needsAddress(c.delivery)) {
    if (!cpOk(text(c.cp, 5))) errors.cp = 'Código postal de 5 dígitos'
    if (text(c.address, 200).length < 8) errors.address = 'Calle, número y colonia'
  }
  return errors
}

// Limpia y valida los datos del cliente. Devuelve { customer } o { error }.
export function normalizeCustomer(input) {
  const c = input || {}
  const delivery = DELIVERY_OPTIONS.some((d) => d.id === c.delivery) ? c.delivery : 'recoger'
  const errors = customerErrors({ ...c, delivery })
  const first = Object.values(errors)[0]
  if (first) return { error: first, errors }
  const date = /^\d{4}-\d{2}-\d{2}$/.test(c.date || '') ? c.date : ''
  // ¿Cómo nos conoció? (marketing) y campaña de origen (?ref= / utm_source en el enlace)
  const source = LEAD_SOURCES.some((s) => s.id === c.source) ? c.source : ''
  const ref = text(c.ref, 40).replace(/[^\w.-]/g, '')
  return {
    customer: {
      name: text(c.name, 80),
      phone: normalizePhone(c.phone).phone,
      email: text(c.email, 120).toLowerCase(),
      notes: text(c.notes, 1000),
      delivery,
      cp: needsAddress(delivery) ? text(c.cp, 5) : '',
      address: needsAddress(delivery) ? text(c.address, 200) : '',
      date,
      source,
      ref
    }
  }
}

// Fecha local (México) en formato AAAA-MM-DD, no UTC
export const localDate = (d = new Date()) => d.toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' }).slice(0, 10)

// Suma días hábiles (lunes a sábado) a una fecha AAAA-MM-DD
export function addBusinessDays(date, days) {
  const d = new Date(`${date}T12:00:00`)
  let n = 0
  while (n < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) n++
  }
  return d.toISOString().slice(0, 10)
}
