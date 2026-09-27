// Datos del cliente en un pedido. Módulo puro: lo usan el formulario y el servidor.

export const DELIVERY_OPTIONS = [
  { id: 'recoger', name: 'Recoger', note: 'En el taller' },
  { id: 'envio', name: 'Envío', note: 'Paquetería o local' },
  { id: 'instalacion', name: 'Instalación', note: 'Lo colocamos' }
]
export const deliveryName = (id) => DELIVERY_OPTIONS.find((d) => d.id === id)?.name || 'Recoger'

const text = (v, max) => String(v || '').trim().slice(0, max)

// Limpia y valida los datos del cliente. Devuelve { customer } o { error }.
export function normalizeCustomer(input) {
  const c = input || {}
  const name = text(c.name, 80)
  const phone = text(c.phone, 30)
  const email = text(c.email, 120)
  const notes = text(c.notes, 1000)
  const delivery = DELIVERY_OPTIONS.some((d) => d.id === c.delivery) ? c.delivery : 'recoger'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(c.date || '') ? c.date : ''

  if (!name) return { error: 'El nombre es obligatorio' }
  if (!phone && !email) return { error: 'Deja un WhatsApp o correo de contacto' }
  if (phone && phone.replace(/\D/g, '').length < 10) return { error: 'El WhatsApp debe tener al menos 10 dígitos' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'El correo no es válido' }
  return { customer: { name, phone, email, notes, delivery, date } }
}
