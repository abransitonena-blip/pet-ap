import { FONTS, FONT_GROUPS } from '../lib/design'

export default function FontSelect({ value, onChange, className = 'input grow' }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: `"${value}"` }}>
      {FONT_GROUPS.map((g) => (
        <optgroup key={g} label={g}>
          {FONTS.filter((f) => f.group === g).map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: `"${f.id}"` }}>{f.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
