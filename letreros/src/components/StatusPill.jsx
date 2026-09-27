import { statusById } from '../lib/status'

export default function StatusPill({ status }) {
  const s = statusById(status)
  return (
    <span className="pill" style={{ color: s.color, background: `${s.color}22`, borderColor: `${s.color}55` }}>
      {s.label}
    </span>
  )
}
