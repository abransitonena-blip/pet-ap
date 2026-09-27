import { useState } from 'react'
import { ICONS, ICON_CATEGORIES, iconById } from '../lib/icons'

// Dibujo de un ícono del catálogo (trazo)
export function IconGlyph({ id, size = 20, color = 'currentColor', strokeWidth = 2 }) {
  const icon = iconById(id)
  if (!icon) return null
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  )
}

// Selector de ícono por categorías
export default function IconPicker({ value, onChange, onClose }) {
  const [cat, setCat] = useState(iconById(value)?.cat || ICON_CATEGORIES[0])
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const list = ICONS.filter((i) => (term ? i.name.toLowerCase().includes(term) || i.id.includes(term) : i.cat === cat))
  return (
    <div className="icon-picker">
      <div className="row">
        <input className="input grow" placeholder="Buscar ícono: taco, perro, flecha…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <button className="icon-btn" onClick={onClose} title="Cerrar">✕</button>
      </div>
      {!term && (
        <div className="chips small">
          {ICON_CATEGORIES.map((c) => (
            <button key={c} className={cat === c ? 'active' : ''} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      )}
      <div className="icon-grid-picker">
        <button className={!value ? 'active' : ''} onClick={() => onChange('')} title="Sin ícono">
          <span className="none">∅</span>
          <em>Ninguno</em>
        </button>
        {list.map((i) => (
          <button key={i.id} className={value === i.id ? 'active' : ''} onClick={() => onChange(i.id)} title={i.name}>
            <IconGlyph id={i.id} size={24} strokeWidth={1.6} />
            <em>{i.name}</em>
          </button>
        ))}
      </div>
    </div>
  )
}
