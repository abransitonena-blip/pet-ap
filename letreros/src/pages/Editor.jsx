import { useEffect, useMemo, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SignPreview from '../components/SignPreview'
import { FONTS, ICONS, LED_MODES, PALETTES, SIZE_PRESETS, TEMPLATES, defaultDesign, newLine, normalizeDesign } from '../lib/design'
import { EXTRAS, MATERIALS, materialById, money, quote } from '../lib/pricing'
import { downloadPng } from '../lib/render'
import { api } from '../lib/api'

const DRAFT_KEY = 'letreros_draft_v2'
const MATERIAL_IDS = MATERIALS.map((m) => m.id)
const EXTRA_IDS = EXTRAS.map((e) => e.id)
const normalize = (d) => normalizeDesign(d, MATERIAL_IDS, EXTRA_IDS)

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return normalize(JSON.parse(raw))
  } catch {}
  return defaultDesign()
}

export default function Editor() {
  const [design, setDesign] = useState(loadDraft)
  const [quantity, setQuantity] = useState(1)
  const [night, setNight] = useState(true)
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
    <div className="page">
      <SiteHeader active="editor" />

      <div className="studio">
        <section className="studio-stage">
          <div className={`wall ${night ? 'night' : ''}`}>
            <div className="wall-tools">
              <div className="switch">
                <button className={!night ? 'active' : ''} onClick={() => setNight(false)}>☀ Día</button>
                <button className={night ? 'active' : ''} onClick={() => setNight(true)}>☾ Noche</button>
              </div>
            </div>
            <div
              className="wall-sign"
              style={{
                aspectRatio: `${design.widthCm} / ${design.heightCm}`,
                width: `min(100%, ${((design.widthCm / design.heightCm) * 50).toFixed(2)}vh)`
              }}
            >
              <span className="dim dim-w">{design.widthCm} cm</span>
              <span className="dim dim-h">{design.heightCm} cm</span>
              <SignPreview design={design} night={night} />
            </div>
          </div>

          <div className="styles-row">
            <span className="label">Estilos</span>
            <div className="styles-scroll">
              {TEMPLATES.map((t) => (
                <button key={t.name} className="style-card" onClick={() => setDesign(normalize(t.design))} title={t.name}>
                  <SignPreview design={t.design} />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="studio-panel">
          <Section n="01" title="Medida">
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
            <div className="size-inputs">
              <NumberField label="Ancho" value={design.widthCm} onChange={(v) => update({ widthCm: v })} />
              <button className="icon-btn" title="Girar" onClick={() => update({ widthCm: design.heightCm, heightCm: design.widthCm })}>⇄</button>
              <NumberField label="Alto" value={design.heightCm} onChange={(v) => update({ heightCm: v })} />
            </div>
          </Section>

          <Section n="02" title="Colores" hint="3 colores · tendencia 2026">
            <div className="palettes">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  className={`palette ${design.palette === p.id ? 'active' : ''}`}
                  onClick={() => update({ palette: p.id, colors: { ...p.colors } })}
                >
                  <span className="swatches">
                    <i style={{ background: p.colors.bg }} />
                    <i style={{ background: p.colors.text }} />
                    <i style={{ background: p.colors.accent }} />
                  </span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
            <div className="color-trio">
              {[['bg', 'Fondo'], ['text', 'Texto'], ['accent', 'Acento']].map(([k, label]) => (
                <label key={k}>
                  <input
                    type="color"
                    value={design.colors[k]}
                    onChange={(e) => update({ palette: 'custom', colors: { ...design.colors, [k]: e.target.value } })}
                  />
                  <span>{label}</span>
                  <code>{design.colors[k].toUpperCase()}</code>
                </label>
              ))}
            </div>
          </Section>

          <Section n="03" title="Texto">
            <TextEditor design={design} setDesign={setDesign} update={update} />
          </Section>

          <Section n="04" title="Iluminación LED" hint="El LED usa tu color de acento">
            <div className="led-modes">
              {LED_MODES.map((m) => (
                <button
                  key={m.id}
                  className={`led-mode ${design.led.mode === m.id ? 'active' : ''}`}
                  onClick={() => {
                    update({ led: { mode: m.id } })
                    if (m.id !== 'none') setNight(true)
                  }}
                >
                  <span className="led" style={{ '--led': m.id === 'none' ? '#c4c4c4' : design.colors.accent }} data-off={m.id === 'none' || undefined} />
                  <strong>{m.name}</strong>
                  <span>{m.note}</span>
                </button>
              ))}
            </div>
            <label className="range">
              <span>Borde</span>
              <input type="range" min="0" max="40" value={design.border.width} onChange={(e) => update({ border: { ...design.border, width: +e.target.value } })} />
              <output>{design.border.width}</output>
            </label>
            <label className="range">
              <span>Esquinas</span>
              <input type="range" min="0" max="200" value={design.border.radius} onChange={(e) => update({ border: { ...design.border, radius: +e.target.value } })} />
              <output>{design.border.radius}</output>
            </label>
          </Section>

          <Section n="05" title="Material">
            <div className="list">
              {MATERIALS.map((m) => (
                <button key={m.id} className={`list-item ${design.material === m.id ? 'active' : ''}`} onClick={() => update({ material: m.id })}>
                  <span className="radio" />
                  <span className="grow">{m.name} <em>{m.note}</em></span>
                  <span className="muted">{money(m.pricePerM2)}/m²</span>
                </button>
              ))}
            </div>
            <div className="list extras">
              {EXTRAS.map((ex) => {
                const on = design.extras.includes(ex.id)
                return (
                  <button
                    key={ex.id}
                    className={`list-item ${on ? 'active' : ''}`}
                    onClick={() => update({ extras: on ? design.extras.filter((e) => e !== ex.id) : [...design.extras, ex.id] })}
                  >
                    <span className="checkbox" />
                    <span className="grow">{ex.name}</span>
                    <span className="muted">+{money(ex.price)}/{ex.per === 'm2' ? 'm²' : ex.per}</span>
                  </button>
                )
              })}
            </div>
          </Section>

          <div className="checkout">
            <div className="checkout-lines">
              {q.lines.map((l, i) => (
                <div key={i}><span>{l.label}</span><span>{money(l.amount)}</span></div>
              ))}
              {q.discount > 0 && (
                <div className="discount"><span>Descuento {Math.round(q.discountRate * 100)}%</span><span>−{money(q.discount)}</span></div>
              )}
            </div>
            <div className="checkout-bar">
              <div className="qty">
                <button onClick={() => setQuantity((n) => Math.max(1, n - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((n) => Math.min(500, n + 1))}>+</button>
              </div>
              <div className="grow price">
                <strong>{money(q.total)}</strong>
                <span className="muted small">{quantity > 1 ? `${money(q.unitPrice)} c/u` : 'IVA incluido'}</span>
              </div>
              <button className="btn primary" onClick={() => setOrdering(true)}>Pedir</button>
            </div>
            <button className="link-btn" onClick={exportPng} disabled={exporting}>
              {exporting ? 'Generando…' : 'Descargar vista previa (PNG)'}
            </button>
          </div>
        </aside>
      </div>

      {ordering && <OrderModal design={design} quantity={quantity} total={q.total} onClose={() => setOrdering(false)} />}
    </div>
  )
}

function Section({ n, title, hint, children }) {
  return (
    <section className="section">
      <header>
        <span className="section-n">{n}</span>
        <h3>{title}</h3>
        {hint && <span className="section-hint">{hint}</span>}
      </header>
      {children}
    </section>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input type="number" min="10" max="1000" value={value} onChange={(e) => onChange(Math.max(10, Math.min(1000, Number(e.target.value) || 10)))} />
      <em>cm</em>
    </label>
  )
}

function TextEditor({ design, setDesign, update }) {
  const setLine = (i, patch) =>
    setDesign((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))
  const remove = (i) => setDesign((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))

  return (
    <>
      {design.lines.map((line, i) => (
        <div className="text-line" key={i}>
          <div className="row">
            <input className="input grow" value={line.text} maxLength={80} placeholder="Escribe aquí…" onChange={(e) => setLine(i, { text: e.target.value })} />
            <button className="icon-btn" onClick={() => remove(i)} title="Quitar línea">✕</button>
          </div>
          <div className="row">
            <select className="input grow" value={line.font} onChange={(e) => setLine(i, { font: e.target.value })}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <div className="tone">
              <button className={line.tone === 'text' ? 'active' : ''} onClick={() => setLine(i, { tone: 'text' })} title="Color de texto">
                <i style={{ background: design.colors.text }} />
              </button>
              <button className={line.tone === 'accent' ? 'active' : ''} onClick={() => setLine(i, { tone: 'accent' })} title="Color de acento">
                <i style={{ background: design.colors.accent }} />
              </button>
            </div>
            <button className={`toggle ${line.bold ? 'on' : ''}`} onClick={() => setLine(i, { bold: !line.bold })}><b>B</b></button>
            <button className={`toggle ${line.italic ? 'on' : ''}`} onClick={() => setLine(i, { italic: !line.italic })}><i>I</i></button>
          </div>
          <label className="range">
            <span>Tamaño</span>
            <input type="range" min="4" max="80" value={line.size} onChange={(e) => setLine(i, { size: +e.target.value })} />
            <output>{line.size}</output>
          </label>
          <label className="range">
            <span>Espacio</span>
            <input type="range" min="-5" max="40" value={line.letterSpacing} onChange={(e) => setLine(i, { letterSpacing: +e.target.value })} />
            <output>{line.letterSpacing}</output>
          </label>
        </div>
      ))}
      <div className="row between">
        {design.lines.length < 6 ? (
          <button className="link-btn" onClick={() => setDesign((d) => ({ ...d, lines: [...d.lines, newLine()] }))}>+ Agregar línea</button>
        ) : <span />}
        <div className="switch small">
          {[['left', '⟸'], ['center', '≡'], ['right', '⟹']].map(([v, label]) => (
            <button key={v} className={design.align === v ? 'active' : ''} onClick={() => update({ align: v })} title={v}>{label}</button>
          ))}
        </div>
      </div>
      <div className="icons">
        {ICONS.map((ic) => (
          <button key={ic || 'none'} className={design.icon === ic ? 'active' : ''} onClick={() => update({ icon: ic })}>{ic || '∅'}</button>
        ))}
      </div>
      {design.icon && (
        <label className="range">
          <span>Ícono</span>
          <input type="range" min="5" max="60" value={design.iconSize} onChange={(e) => update({ iconSize: +e.target.value })} />
          <output>{design.iconSize}</output>
        </label>
      )}
    </>
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
            <span className="led big" style={{ '--led': '#22c55e' }} />
            <h2>Pedido recibido</h2>
            <p className="muted">Tu folio</p>
            <div className="folio">{result.folio}</div>
            <p className="muted small">Guárdalo para consultar el avance. Te contactaremos para confirmar pago y detalles.</p>
            <a className="btn primary" href={`#/seguimiento/${result.folio}`}>Ver mi pedido</a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>Confirmar pedido</h2>
            <div className="modal-preview">
              <div className="modal-sign"><SignPreview design={design} night /></div>
              <div>
                <strong>{design.widthCm} × {design.heightCm} cm</strong>
                <span className="muted">{materialById(design.material).name}</span>
                <span className="muted">{LED_MODES.find((m) => m.id === design.led.mode).name} · {quantity} pz</span>
                <strong>{money(total)}</strong>
              </div>
            </div>
            <label className="field"><span>Nombre *</span><input className="input" required value={form.name} onChange={set('name')} /></label>
            <div className="row">
              <label className="field grow"><span>WhatsApp</span><input className="input" type="tel" value={form.phone} onChange={set('phone')} /></label>
              <label className="field grow"><span>Correo</span><input className="input" type="email" value={form.email} onChange={set('email')} /></label>
            </div>
            <label className="field"><span>Notas</span><textarea className="input" rows="2" value={form.notes} onChange={set('notes')} placeholder="Dirección, fecha de entrega…" /></label>
            {error && <p className="error">{error}</p>}
            <button className="btn primary block" disabled={sending}>{sending ? 'Enviando…' : 'Enviar pedido'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
