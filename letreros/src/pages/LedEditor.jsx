import { useEffect, useMemo, useRef, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import LedPreview from '../components/LedPreview'
import FontSelect from '../components/FontSelect'
import {
  ANIMATIONS, BOARDS, BOARD_MATERIALS, DOT_STYLES, LED_COLORS, LED_SIZES, MAX_DOTS, POWER,
  boardMaterialById, defaultLedDesign, ledColorById, newLedLine, normalizeLedDesign, planPower
} from '../lib/ledSign'
import { computeLedDots } from '../lib/ledText'
import { money, quote } from '../lib/pricing'
import { api } from '../lib/api'

const DRAFT_KEY = 'letreros_led_draft'

// Plantillas de inicio (sin puntos: se calculan al cargar)
const LED_TEMPLATES = [
  { name: 'Abierto', d: { style: 'contorno', pitchMm: 12, lines: [newLedLine({ text: 'ABIERTO', font: 'Anton', heightMm: 120, color: 'rojo' })] } },
  { name: 'Open', d: { style: 'trazo', pitchMm: 10, board: 'transparente', lines: [newLedLine({ text: 'Open', font: 'Pacifico', heightMm: 140, color: 'rosa' })] } },
  { name: 'Matriz', d: { style: 'matriz', animation: 'secuencial', lines: [newLedLine({ text: 'CAFE', font: 'Anton', heightMm: 120, color: 'ambar' })] } },
  {
    name: 'Tacos', d: {
      style: 'contorno', pitchMm: 12, lines: [
        newLedLine({ text: 'TACOS', font: 'Alfa Slab One', heightMm: 130, color: 'ambar' }),
        newLedLine({ text: 'al pastor', font: 'Kaushan Script', heightMm: 70, color: 'verde' })
      ]
    }
  },
  { name: 'Bienvenidos', d: { style: 'trazo', pitchMm: 10, board: 'madera', lines: [newLedLine({ text: 'Bienvenidos', font: 'Great Vibes', heightMm: 110, color: 'calido' })] } },
  { name: 'Barber', d: { style: 'relleno', pitchMm: 11, board: 'humo', animation: 'parpadeo', lines: [newLedLine({ text: 'BARBER', font: 'Bebas Neue', heightMm: 150, color: 'azul' })] } }
]

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return normalizeLedDesign(JSON.parse(raw))
  } catch {}
  return defaultLedDesign()
}

// Recalcula los puntos cuando cambia algo que afecta la forma (con pausa para no trabar al escribir)
function useLedDots(design, setDesign) {
  const [busy, setBusy] = useState(false)
  const shapeKey = JSON.stringify([design.lines, design.style, design.pitchMm, design.ledMm, design.marginMm])
  const run = useRef(0)
  useEffect(() => {
    const id = ++run.current
    setBusy(true)
    const t = setTimeout(async () => {
      try {
        const res = await computeLedDots(design)
        if (id !== run.current) return
        setDesign((d) => ({ ...d, dots: res.dots.slice(0, MAX_DOTS), widthCm: res.widthCm, heightCm: res.heightCm }))
      } finally {
        if (id === run.current) setBusy(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [shapeKey])
  return busy
}

export default function LedEditor() {
  const [design, setDesign] = useState(loadDraft)
  const [quantity, setQuantity] = useState(1)
  const [night, setNight] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const busy = useLedDots(design, setDesign)

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(design))
    } catch {}
  }, [design])

  const update = (patch) => setDesign((d) => ({ ...d, ...patch }))
  const setLine = (i, patch) => setDesign((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))
  const plan = useMemo(() => planPower(design), [design])
  const q = useMemo(() => quote({ ...design, quantity }), [design, quantity])
  const tooMany = design.dots.length >= MAX_DOTS

  return (
    <div className="page">
      <SiteHeader active="led" />

      <div className="studio">
        <section className="studio-stage">
          <div className={`wall ${night ? 'night' : ''}`}>
            <div className="wall-tools">
              <div className="switch">
                <button className={!night ? 'active' : ''} onClick={() => setNight(false)}>☀ Apagado</button>
                <button className={night ? 'active' : ''} onClick={() => setNight(true)}>☾ Encendido</button>
              </div>
            </div>
            {busy && <span className="calc"><span className="led blink" style={{ '--led': '#22c55e' }} /> Calculando puntos…</span>}
            <div
              className="wall-sign"
              style={{
                aspectRatio: `${design.widthCm} / ${design.heightCm}`,
                width: `min(100%, ${((design.widthCm / design.heightCm) * 50).toFixed(2)}vh)`
              }}
            >
              <span className="dim dim-w">{design.widthCm} cm</span>
              <span className="dim dim-h">{design.heightCm} cm</span>
              <LedPreview design={design} night={night} animate={night} />
            </div>
          </div>

          <div className="led-stats">
            <div><strong>{design.dots.length}</strong><span>LED</span></div>
            <div><strong>{design.widthCm}×{design.heightCm}</strong><span>cm</span></div>
            <div><strong>{plan.strings.length}</strong><span>cadenas</span></div>
            <div><strong>{plan.watts}</strong><span>W</span></div>
            <div><strong>{design.power === '127v' ? `${plan.boardsB || plan.boardsA} placa${(plan.boardsB || plan.boardsA) > 1 ? 's' : ''}` : `${plan.supplyA} A`}</strong><span>{design.power === '127v' ? (plan.boardsA ? 'A secuencial' : 'B fuente') : 'eliminador'}</span></div>
          </div>

          <div className="styles-row">
            <span className="label">Estilos</span>
            <div className="styles-scroll">
              {LED_TEMPLATES.map((t) => (
                <button key={t.name} className="style-card text" onClick={() => setDesign(normalizeLedDesign({ ...defaultLedDesign(), ...t.d, dots: [] }))}>
                  <span style={{ fontFamily: `"${t.d.lines[0].font}"`, color: ledColorById(t.d.lines[0].color).hex }}>{t.d.lines[0].text}</span>
                  <em>{t.name}</em>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="studio-panel">
          <Section n="01" title="Texto" hint="Hasta 4 líneas">
            {design.lines.map((line, i) => (
              <div className="text-line" key={i}>
                <div className="row">
                  <input className="input grow led-text" value={line.text} maxLength={40} placeholder="Escribe aquí…" onChange={(e) => setLine(i, { text: e.target.value })} style={{ fontFamily: `"${line.font}"` }} />
                  {design.lines.length > 1 && <button className="icon-btn" onClick={() => setDesign((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))} title="Quitar línea">✕</button>}
                </div>
                <div className="row">
                  {design.style === 'matriz' ? <span className="muted small grow">Fuente de puntos 5×7</span> : <FontSelect value={line.font} onChange={(font) => setLine(i, { font })} />}
                  {design.style !== 'matriz' && <button className={`toggle ${line.bold ? 'on' : ''}`} onClick={() => setLine(i, { bold: !line.bold })}><b>B</b></button>}
                </div>
                <div className="led-colors">
                  {LED_COLORS.map((c) => (
                    <button key={c.id} className={line.color === c.id ? 'active' : ''} onClick={() => setLine(i, { color: c.id })} title={c.name}>
                      <span className="led" style={{ '--led': c.hex }} />
                    </button>
                  ))}
                  <span className="muted small">{ledColorById(line.color).name}</span>
                </div>
                <label className="range">
                  <span>Altura</span>
                  <input type="range" min="30" max="400" step="5" value={line.heightMm} onChange={(e) => setLine(i, { heightMm: +e.target.value })} />
                  <output>{line.heightMm / 10}</output>
                </label>
              </div>
            ))}
            {design.lines.length < 4 && (
              <button className="link-btn" onClick={() => setDesign((d) => ({ ...d, lines: [...d.lines, newLedLine({ text: 'Texto', heightMm: 70, font: d.lines[0].font, color: d.lines[0].color })] }))}>
                + Agregar línea
              </button>
            )}
          </Section>

          <Section n="02" title="Puntos" hint={`LED de ${design.ledMm} mm`}>
            <div className="led-modes">
              {DOT_STYLES.map((s) => (
                <button key={s.id} className={`led-mode ${design.style === s.id ? 'active' : ''}`} onClick={() => update({ style: s.id })}>
                  <DotIcon style={s.id} />
                  <strong>{s.name}</strong>
                  <span>{s.note}</span>
                </button>
              ))}
            </div>
            {design.style !== 'matriz' && (
              <label className="range">
                <span>Separación</span>
                <input type="range" min="6" max="30" step="0.5" value={design.pitchMm} onChange={(e) => update({ pitchMm: +e.target.value })} />
                <output>{design.pitchMm}</output>
              </label>
            )}
            <div className="row between">
              <span className="muted small">Tamaño del LED</span>
              <div className="switch small">
                {LED_SIZES.map((s) => (
                  <button key={s} className={design.ledMm === s ? 'active' : ''} onClick={() => update({ ledMm: s })}>{s} mm</button>
                ))}
              </div>
            </div>
            {tooMany && <p className="error">Demasiados LED ({MAX_DOTS} máx.). Aumenta la separación o reduce la altura.</p>}
          </Section>

          <Section n="03" title="Placa">
            <div className="board-colors">
              {BOARDS.map((b) => (
                <button key={b.id} className={design.board === b.id ? 'active' : ''} onClick={() => update({ board: b.id })}>
                  <i style={{ background: b.hex, opacity: b.id === 'transparente' ? 0.5 : 1 }} />
                  <span>{b.name}</span>
                </button>
              ))}
            </div>
            <div className="chips">
              {BOARD_MATERIALS.map((m) => (
                <button key={m.id} className={design.material === m.id ? 'active' : ''} onClick={() => update({ material: m.id })}>{m.name}</button>
              ))}
            </div>
            <label className="range">
              <span>Margen</span>
              <input type="range" min="10" max="150" step="5" value={design.marginMm} onChange={(e) => update({ marginMm: +e.target.value })} />
              <output>{design.marginMm / 10}</output>
            </label>
            <label className="range">
              <span>Esquinas</span>
              <input type="range" min="0" max="100" value={design.cornerMm} onChange={(e) => update({ cornerMm: +e.target.value })} />
              <output>{design.cornerMm}</output>
            </label>
          </Section>

          <Section n="04" title="Encendido y fuente">
            <div className="switch full">
              {ANIMATIONS.map((a) => (
                <button key={a.id} className={design.animation === a.id ? 'active' : ''} onClick={() => { update({ animation: a.id }); setNight(true) }}>{a.name}</button>
              ))}
            </div>
            <p className="muted small">{ANIMATIONS.find((a) => a.id === design.animation).note}</p>
            <div className="led-modes">
              {POWER.map((p) => (
                <button key={p.id} className={`led-mode ${design.power === p.id ? 'active' : ''}`} onClick={() => update({ power: p.id })}>
                  <span className="led" style={{ '--led': p.id === '127v' ? '#f59e0b' : '#22c55e' }} />
                  <strong>{p.name}</strong>
                  <span>{p.note}</span>
                </button>
              ))}
            </div>
            <label className="check-row">
              <input type="checkbox" checked={design.extras.includes('instalacion')} onChange={(e) => update({ extras: e.target.checked ? ['instalacion'] : [] })} />
              <span>Instalación (+$450)</span>
            </label>
          </Section>

          <div className="checkout">
            <div className="checkout-lines">
              {q.lines.map((l, i) => (
                <div key={i}><span>{l.label}</span><span>{money(l.amount)}</span></div>
              ))}
              {q.discount > 0 && <div className="discount"><span>Descuento {Math.round(q.discountRate * 100)}%</span><span>−{money(q.discount)}</span></div>}
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
              <button className="btn primary" onClick={() => setOrdering(true)} disabled={busy || !design.dots.length || tooMany}>Pedir</button>
            </div>
          </div>
        </aside>
      </div>

      {ordering && <LedOrderModal design={design} quantity={quantity} total={q.total} onClose={() => setOrdering(false)} />}
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

function DotIcon({ style }) {
  const pts = {
    trazo: [[2, 12], [5, 8], [8, 4], [11, 8], [14, 12]],
    contorno: [[3, 3], [8, 3], [13, 3], [13, 8], [13, 13], [8, 13], [3, 13], [3, 8]],
    relleno: [[3, 4], [8, 4], [13, 4], [5.5, 8], [10.5, 8], [3, 12], [8, 12], [13, 12]],
    matriz: [[3, 3], [3, 8], [3, 13], [8, 3], [13, 3], [13, 8], [13, 13], [8, 8]]
  }[style]
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" className="dot-icon">
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" />)}
    </svg>
  )
}

function LedOrderModal({ design, quantity, total, onClose }) {
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
              <div className="modal-sign"><LedPreview design={design} night /></div>
              <div>
                <strong>{design.widthCm} × {design.heightCm} cm</strong>
                <span className="muted">{design.dots.length} LED · {boardMaterialById(design.material).name}</span>
                <span className="muted">{POWER.find((p) => p.id === design.power).name} · {quantity} pz</span>
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
