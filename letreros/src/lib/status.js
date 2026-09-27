// Flujo de producción de un pedido
export const STATUSES = [
  { id: 'nuevo', label: 'Nuevo', color: '#3b82f6' },
  { id: 'en_diseno', label: 'En diseño', color: '#a855f7' },
  { id: 'aprobado', label: 'Aprobado', color: '#14b8a6' },
  { id: 'imprimiendo', label: 'Imprimiendo', color: '#f59e0b' },
  { id: 'impreso', label: 'Impreso', color: '#22c55e' },
  { id: 'entregado', label: 'Entregado', color: '#64748b' },
  { id: 'cancelado', label: 'Cancelado', color: '#ef4444' }
]

export const STATUS_IDS = STATUSES.map((s) => s.id)
export const PRINTED_STATUSES = ['impreso', 'entregado']
export const statusById = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0]
