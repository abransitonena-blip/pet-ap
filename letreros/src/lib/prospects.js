// Prospección: giros, estados y muestra personalizada para cada negocio visitado
import { LED_MODELS } from './ledModels.js'
import { defaultLedDesign, normalizeLedDesign } from './ledSign.js'

export const GIROS = [
  { id: 'taqueria', name: 'Taquería', model: 'Taquería' },
  { id: 'cafe', name: 'Cafetería', model: 'Café madera' },
  { id: 'barberia', name: 'Barbería / estética', model: 'Barber' },
  { id: 'abarrotes', name: 'Abarrotes / tienda', model: 'Abierto' },
  { id: 'restaurante', name: 'Restaurante / fonda', model: 'Pizza' },
  { id: 'bar', name: 'Bar', model: 'Bar' },
  { id: 'boutique', name: 'Boutique / ropa', model: 'Boutique' },
  { id: 'mascotas', name: 'Veterinaria / pet shop', model: 'Pet shop' },
  { id: 'consultorio', name: 'Consultorio / farmacia', model: 'Abierto' },
  { id: 'otro', name: 'Otro', model: 'Abierto' }
]
export const LEAD_STATES = [
  { id: 'por_visitar', name: 'Por visitar', color: '#9ca3af' },
  { id: 'visitado', name: 'Visitado', color: '#3b82f6' },
  { id: 'muestra', name: 'Muestra enviada', color: '#a855f7' },
  { id: 'cotizado', name: 'Cotizado', color: '#f59e0b' },
  { id: 'cliente', name: 'Cliente', color: '#22c55e' },
  { id: 'no', name: 'No interesado', color: '#ef4444' }
]
export const GIRO_IDS = GIROS.map((g) => g.id)
export const LEAD_STATE_IDS = LEAD_STATES.map((s) => s.id)
export const WEEKLY_GOAL = 20

// Diseño de muestra con el nombre del negocio sobre el modelo de su giro
export function sampleDesign(lead) {
  const giro = GIROS.find((g) => g.id === lead.giro) || GIROS[GIROS.length - 1]
  const model = LED_MODELS.find((m) => m.name === giro.model) || LED_MODELS[0]
  const name = (lead.name || 'TU NEGOCIO').slice(0, 24)
  const first = model.d.lines[0]
  const upper = first.text && first.text === first.text.toUpperCase()
  const lines = [{ ...first, text: upper ? name.toUpperCase() : name }]
  return normalizeLedDesign({ ...defaultLedDesign(), ...model.d, lines, dots: [] })
}
