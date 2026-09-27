import { statusById } from '../lib/status'

// Indicador tipo LED: parpadea mientras el pedido está en proceso
export default function StatusPill({ status }) {
  const s = statusById(status)
  return (
    <span className="status">
      <span className={`led ${s.id === 'imprimiendo' ? 'blink' : ''}`} style={{ '--led': s.color }} />
      {s.label}
    </span>
  )
}
