import { useEffect, useMemo, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SignPreview from '../components/SignPreview'
import { FONTS, ICONS, SIZE_PRESETS, TEMPLATES, defaultDesign, newLine, normalizeDesign } from '../lib/design'
import { EXTRAS, MATERIALS, materialById, money, quote } from '../lib/pricing'
import { downloadPng } from '../lib/render'
import { api } from '../lib/api'

const DRAFT_KEY = 'letreros_draft'
const MATERIAL_IDS = MATERIALS.map((m) => m.id)
const EXTRA_IDS = EXTRAS.map((e) => e.id)

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return normalizeDesign(JSON.parse(raw), MATERIAL_IDS, EXTRA_IDS)
  } catch {}
  return defaultDesign()
}

const TABS = [
  { id: 'plantillas', label: 'Plantillas' },
  { id: 'texto', label: 'Texto' },
  { id: 'estilo', label: 'Fondo y borde' },
  { id: 'medida', label: 'Medida' }
]

export default function Editor() {
  const [design, setDesign] = useState(loadDraft)
  const [tab, setTab] = useState('texto')
  const [quantity, setQuantity] = useState(1)
  const [ordering, setOrdering] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(design))
    } catch {}
  }, [design])

  const q = useMemo(() => quote({ ...design, quantity }), [design, quantity])
  const update = (patch) => setDesign((d) => ({ ...d, ...patch }))

  const exportPng = async () => {
    setExporting(true)
    try {
      await downloadPng(design, 'mi-letrero.png')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page editor-page">
      <SiteHeader active="editor" />

      <div className="editor">
        <aside className="panel controls">
          <div className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="tab-body">
            {tab === 'plantillas' && <TemplatesTab onPick={(d) => setDesign(normalizeDesign(d, MATERIAL_IDS, EXTRA_IDS))} />}
            {tab === 'texto' && <TextTab design={design} setDesign={setDesign} update={update} />}
            {tab === 'estilo' && <StyleTab design={design} update={update} />}
            {tab === 'medida' && <SizeTab design={design} update={update} />}
          </div>
        </aside>

        <section className="stage">
          <div className="stage-wall">
            <div
              className="stage-sign"
              style={{
                aspectRatio: `${design.widthCm} / ${design.heightCm}`,
                width: `min(100%, ${((design.widthCm / design.heightCm) * 55).toFixed(2)}vh)`
              }}
            >
              <span className="dim dim-w">{design.widthCm} cm</span>
              <span className="dim dim-h">{design.heightCm} cm</span>
              <SignPreview design={design} />
            </div>
          </div>
          <div className="stage-actions">
            <span className="muted">
              {materialById(design.material).name} · {q.areaM2} m²
            </span>
            <div className="row">
              <button className="btn ghost" onClick={() => setDesign(defaultDesign())}>Reiniciar</button>
              <button className="btn ghost" onClick={exportPng} disabled={exporting}>
                {exporting ? 'Generando…' : 'Descargar PNG'}
              </button>
            </div>
          </div>
        </section>

        <aside className="panel summary">
          <h3>Tu cotización</h3>
          <ul className="quote-lines">
            {q.lines.map((l, i) => (
              <li key={i}>
                <span>{l.label}</span>
                <span>{money(l.amount)}</span>
              </li>
            ))}
            {q.discount > 0 && (
              <li className="discount">
                <span>Descuento por volumen ({Math.round(q.discountRate * 100)}%)</span>
                <span>−{money(q.discount)}</span>
              </li>
            )}
          </ul>
          <label className="field">
            <span>Cantidad</span>
            <div className="stepper">
              <button onClick={() => setQuantity((n) => Math.max(1, n - 1))}>−</button>
              <input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
              />
              <button onClick={() => setQuantity((n) => Math.min(500, n + 1))}>+</button>
            </div>
          </label>
          <p className="hint">5+ piezas: 5% · 10+: 8% · 20+: 12% · 50+: 20% de descuento</p>
          <div className="total">
            <span>Total</span>
            <strong>{money(q.total)}</strong>
          </div>
          <p className="muted small">{money(q.unitPrice)} por pieza · IVA incluido</p>
          <button className="btn primary block" onClick={() => setOrdering(true)}>
            Hacer pedido
          </button>
        </aside>
      </div>

      {ordering && <OrderModal design={design} quantity={quantity} total={q.total} onClose={() => setOrdering(false)} />}
    </div>
  )
}

function TemplatesTab({ onPick }) {
  return (
    <div className="template-grid">
      {TEMPLATES.map((t) => (
        <button key={t.name} className="template" onClick={() => onPick(t.design)}>
          <SignPreview design={t.design} />
          <span>{t.name}</span>
        </button>
      ))}
    </div>
  )
}

function TextTab({ design, setDesign, update }) {
  const setLine = (i, patch) =>
    setDesign((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))
  const move = (i, dir) =>
    setDesign((d) => {
      const lines = [...d.lines]
      const j = i + dir
      if (j < 0 || j >= lines.length) return d
      ;[lines[i], lines[j]] = [lines[j], lines[i]]
      return { ...d, lines }
    })
  const remove = (i) => setDesign((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))

  return (
    <>
      <div className="field">
        <span>Alineación</span>
        <div className="segmented">
          {[['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']].map(([v, label]) => (
            <button key={v} className={design.align === v ? 'active' : ''} onClick={() => update({ align: v })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {design.lines.map((line, i) => (
        <div className="line-card" key={i}>
          <div className="line-head">
            <strong>Línea {i + 1}</strong>
            <div className="row tight">
              <button className="icon-btn" onClick={() => move(i, -1)} title="Subir">↑</button>
              <button className="icon-btn" onClick={() => move(i, 1)} title="Bajar">↓</button>
              <button className="icon-btn danger" onClick={() => remove(i)} title="Eliminar">✕</button>
            </div>
          </div>
          <input
            className="input"
            value={line.text}
            maxLength={80}
            placeholder="Escribe aquí…"
            onChange={(e) => setLine(i, { text: e.target.value })}
          />
          <div className="row">
            <select className="input" value={line.font} onChange={(e) => setLine(i, { font: e.target.value })} style={{ fontFamily: line.font }}>
              {FONTS.map((f) => (
                <option key={f.id} value={f.id} style={{ fontFamily: f.id }}>{f.label}</option>
              ))}
            </select>
            <input type="color" value={line.color} onChange={(e) => setLine(i, { color: e.target.value })} />
            <button className={`toggle ${line.bold ? 'on' : ''}`} onClick={() => setLine(i, { bold: !line.bold })}><b>B</b></button>
            <button className={`toggle ${line.italic ? 'on' : ''}`} onClick={() => setLine(i, { italic: !line.italic })}><i>I</i></button>
          </div>
          <Range label="Tamaño" min={4} max={80} value={line.size} onChange={(v) => setLine(i, { size: v })} />
          <Range label="Espaciado" min={-5} max={40} value={line.letterSpacing} onChange={(v) => setLine(i, { letterSpacing: v })} />
        </div>
      ))}
      {design.lines.length < 6 && (
        <button className="btn ghost block" onClick={() => setDesign((d) => ({ ...d, lines: [...d.lines, newLine({ size: 12 })] }))}>
          + Agregar línea
        </button>
      )}

      <div className="field">
        <span>Ícono</span>
        <div className="icon-grid">
          {ICONS.map((ic) => (
            <button key={ic || 'none'} className={design.icon === ic ? 'active' : ''} onClick={() => update({ icon: ic })}>
              {ic || '∅'}
            </button>
          ))}
        </div>
      </div>
      {design.icon && <Range label="Tamaño del ícono" min={5} max={60} value={design.iconSize} onChange={(v) => update({ iconSize: v })} />}
    </>
  )
}

function StyleTab({ design, update }) {
  const bg = design.background
  const border = design.border
  const setBg = (patch) => update({ background: { ...bg, ...patch } })
  const setBorder = (patch) => update({ border: { ...border, ...patch } })

  return (
    <>
      <div className="field">
        <span>Fondo</span>
        <div className="segmented">
          <button className={bg.type === 'solid' ? 'active' : ''} onClick={() => setBg({ type: 'solid' })}>Sólido</button>
          <button className={bg.type === 'gradient' ? 'active' : ''} onClick={() => setBg({ type: 'gradient' })}>Degradado</button>
        </div>
      </div>
      <div className="row">
        <label className="color-field">
          <input type="color" value={bg.color1} onChange={(e) => setBg({ color1: e.target.value })} />
          <span>{bg.type === 'gradient' ? 'Color 1' : 'Color'}</span>
        </label>
        {bg.type === 'gradient' && (
          <label className="color-field">
            <input type="color" value={bg.color2} onChange={(e) => setBg({ color2: e.target.value })} />
            <span>Color 2</span>
          </label>
        )}
      </div>
      {bg.type === 'gradient' && <Range label="Ángulo" min={0} max={360} value={bg.angle} unit="°" onChange={(v) => setBg({ angle: v })} />}

      <hr />
      <div className="field">
        <span>Borde</span>
        <label className="color-field">
          <input type="color" value={border.color} onChange={(e) => setBorder({ color: e.target.value })} />
          <span>Color del borde</span>
        </label>
      </div>
      <Range label="Grosor" min={0} max={60} value={border.width} onChange={(v) => setBorder({ width: v })} />
      <Range label="Esquinas redondeadas" min={0} max={200} value={border.radius} onChange={(v) => setBorder({ radius: v })} />

      <hr />
      <label className="check">
        <input type="checkbox" checked={design.glow} onChange={(e) => update({ glow: e.target.checked })} />
        <span>Efecto neón (brillo en el texto)</span>
      </label>
    </>
  )
}

function SizeTab({ design, update }) {
  const toggleExtra = (id) =>
    update({ extras: design.extras.includes(id) ? design.extras.filter((e) => e !== id) : [...design.extras, id] })

  return (
    <>
      <div className="field">
        <span>Medidas rápidas (cm)</span>
        <div className="chips">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              className={design.widthCm === p.widthCm && design.heightCm === p.heightCm ? 'active' : ''}
              onClick={() => update({ widthCm: p.widthCm, heightCm: p.heightCm })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="row">
        <label className="field grow">
          <span>Ancho (cm)</span>
          <input className="input" type="number" min="10" max="1000" value={design.widthCm}
            onChange={(e) => update({ widthCm: Math.max(10, Math.min(1000, Number(e.target.value) || 10)) })} />
        </label>
        <button className="icon-btn swap" title="Girar" onClick={() => update({ widthCm: design.heightCm, heightCm: design.widthCm })}>⇄</button>
        <label className="field grow">
          <span>Alto (cm)</span>
          <input className="input" type="number" min="10" max="1000" value={design.heightCm}
            onChange={(e) => update({ heightCm: Math.max(10, Math.min(1000, Number(e.target.value) || 10)) })} />
        </label>
      </div>

      <div className="field">
        <span>Material</span>
        <div className="material-list">
          {MATERIALS.map((m) => (
            <button key={m.id} className={`material ${design.material === m.id ? 'active' : ''}`} onClick={() => update({ material: m.id })}>
              <strong>{m.name}</strong>
              <span>{m.note}</span>
              <em>{money(m.pricePerM2)}/m²</em>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span>Extras</span>
        {EXTRAS.map((ex) => (
          <label key={ex.id} className="check">
            <input type="checkbox" checked={design.extras.includes(ex.id)} onChange={() => toggleExtra(ex.id)} />
            <span>{ex.name}</span>
            <em className="muted">+{money(ex.price)}/{ex.per === 'm2' ? 'm²' : ex.per}</em>
          </label>
        ))}
      </div>
    </>
  )
}

function Range({ label, value, onChange, unit = '', ...props }) {
  return (
    <label className="range">
      <span>{label}</span>
      <input type="range" value={value} onChange={(e) => onChange(Number(e.target.value))} {...props} />
      <output>{value}{unit}</output>
    </label>
  )
}

function OrderModal({ design, quantity, total, onClose }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      setResult(await api.createOrder({ customer: form, design, quantity }))
    } catch (err) {
      setError(err.message || 'No se pudo enviar el pedido')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {result ? (
          <div className="success">
            <div className="success-icon">✓</div>
            <h2>¡Pedido recibido!</h2>
            <p>Tu folio es</p>
            <div className="folio">{result.folio}</div>
            <p className="muted">Guárdalo para consultar el estado de tu letrero. Te contactaremos para confirmar el pago y los detalles.</p>
            <a className="btn primary" href={`#/seguimiento/${result.folio}`}>Ver estado del pedido</a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>Confirma tu pedido</h2>
            <div className="modal-preview">
              <SignPreview design={design} />
              <div>
                <strong>{design.widthCm} × {design.heightCm} cm</strong>
                <span className="muted">{materialById(design.material).name}</span>
                <span className="muted">{quantity} pieza{quantity > 1 ? 's' : ''}</span>
                <strong className="accent">{money(total)}</strong>
              </div>
            </div>
            <label className="field"><span>Nombre *</span><input className="input" required value={form.name} onChange={set('name')} /></label>
            <div className="row">
              <label className="field grow"><span>Teléfono / WhatsApp</span><input className="input" type="tel" value={form.phone} onChange={set('phone')} /></label>
              <label className="field grow"><span>Correo</span><input className="input" type="email" value={form.email} onChange={set('email')} /></label>
            </div>
            <label className="field"><span>Notas (dirección, fecha de entrega, etc.)</span><textarea className="input" rows="3" value={form.notes} onChange={set('notes')} /></label>
            {error && <p className="error">{error}</p>}
            <button className="btn primary block" disabled={sending}>{sending ? 'Enviando…' : 'Enviar pedido'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
