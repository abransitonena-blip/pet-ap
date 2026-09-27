import { useEffect, useMemo, useRef, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import LedPreview, { previewBox } from '../components/LedPreview'
import IconPicker, { IconGlyph } from '../components/IconPicker'
import FontSelect from '../components/FontSelect'
import {
  ANIMATIONS, BOARDS, BOARD_MATERIALS, MOUNTS, SCENES, SHAPES, DOT_STYLES, LED_COLORS, LED_SIZES, MAX_DOTS, POWER,
  boardMaterialById, defaultLedDesign, ledColorById, newLedLine, normalizeLedDesign, planPower
} from '../lib/ledSign'
import { computeLedDots } from '../lib/ledText'
import { money, quote } from '../lib/pricing'
import { api } from '../lib/api'
import { usePublicSettings } from '../lib/settings'

const DRAFT_KEY = 'letreros_led_draft'
const SCENE_KEY = 'ap_scene'

function loadScene() {
  try {
    const id = localStorage.getItem(SCENE_KEY)
    return SCENES.some((x) => x.id === id) ? id : 'rosa'
  } catch {
    return 'rosa'
  }
}

// Modelos de inicio (sin puntos: se calculan al cargar)
const L = newLedLine
const LED_TEMPLATES = [
  { name: 'Abierto', d: { style: 'contorno', pitchMm: 12, shape: 'pill', board: 'blanco', lines: [L({ text: 'ABIERTO', font: 'Anton', heightMm: 120, color: 'rojo', icon: 'estrella' })] } },
  { name: 'Taquería', d: { style: 'contorno', pitchMm: 12, board: 'arena', lines: [L({ text: 'TACOS', font: 'Alfa Slab One', heightMm: 130, color: 'ambar', icon: 'taco' }), L({ text: 'al pastor', font: 'Kaushan Script', heightMm: 70, color: 'verde' })] } },
  { name: 'Café', d: { style: 'trazo', pitchMm: 10, shape: 'arch', board: 'rosapalo', lines: [L({ text: 'Café', font: 'Pacifico', heightMm: 130, color: 'calido', icon: 'cafe', iconPos: 'right' })] } },
  { name: 'Pet shop', d: { style: 'trazo', pitchMm: 10, shape: 'circle', board: 'rosa', lines: [L({ text: '', icon: 'perro', heightMm: 150, color: 'blanco' }), L({ text: 'PET SHOP', font: 'Fredoka', heightMm: 60, color: 'blanco', bold: true })] } },
  { name: 'Baños', d: { style: 'trazo', pitchMm: 9, shape: 'round', board: 'blanco', lines: [L({ text: 'BAÑOS', font: 'Poppins', heightMm: 80, color: 'azul', bold: true, icon: 'wc' })] } },
  { name: 'Salida', d: { style: 'relleno', pitchMm: 10, shape: 'rect', board: 'salvia', lines: [L({ text: 'SALIDA', font: 'Archivo Black', heightMm: 90, color: 'verde', icon: 'derecha', iconPos: 'right' })] } },
  { name: 'Open', d: { style: 'trazo', pitchMm: 10, board: 'transparente', mount: 'colgante', lines: [L({ text: 'Open', font: 'Pacifico', heightMm: 140, color: 'rosa', icon: 'corazon', iconPos: 'right' })] } },
  { name: 'Pizza', d: { style: 'contorno', pitchMm: 12, shape: 'hex', board: 'arena', lines: [L({ text: 'PIZZA', font: 'Titan One', heightMm: 110, color: 'rojo', icon: 'pizza' })] } },
  { name: 'Barber', d: { style: 'relleno', pitchMm: 11, board: 'gris', animation: 'parpadeo', lines: [L({ text: 'BARBER', font: 'Bebas Neue', heightMm: 150, color: 'azul', icon: 'tijeras' })] } },
  { name: 'Matriz', d: { style: 'matriz', animation: 'secuencial', board: 'blanco', lines: [L({ text: 'CAFE', heightMm: 120, color: 'ambar' })] } },
  { name: 'Mesa', d: { style: 'trazo', pitchMm: 9, board: 'transparente', mount: 'base', lines: [L({ text: 'Bienvenidos', font: 'Great Vibes', heightMm: 100, color: 'calido', icon: 'brillos' })] } }
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
  const shapeKey = JSON.stringify([design.lines, design.style, design.pitchMm, design.ledMm, design.marginMm, design.shape])
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
  const [scene, setSceneState] = useState(loadScene)
  const [ordering, setOrdering] = useState(false)
  const [picker, setPicker] = useState(-1)
  const busy = useLedDots(design, setDesign)

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(design))
    } catch {}
  }, [design])

  const setScene = (id) => {
    setSceneState(id)
    try {
      localStorage.setItem(SCENE_KEY, id)
    } catch {}
  }
  const update = (patch) => setDesign((d) => ({ ...d, ...patch }))
  const setLine = (i, patch) => setDesign((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }))
  const plan = useMemo(() => planPower(design), [design])
  const { prices, business } = usePublicSettings()
  const q = useMemo(() => quote({ ...design, quantity }, prices), [design, quantity, prices])
  const tooMany = design.dots.length >= MAX_DOTS
  const box = previewBox(design)

  return (
    <div className="page">
      <SiteHeader active="led" />

      <div className="studio">
        <section className="studio-stage">
          <div className={`wall ${night ? 'night' : ''}`} data-scene={scene} style={{ '--scene': SCENES.find((x) => x.id === scene)?.hex }}>
            <div className="wall-tools">
              <div className="scenes" title="Fondo de la pared">
                {SCENES.map((x) => (
                  <button key={x.id} className={scene === x.id ? 'active' : ''} style={{ background: x.hex }} onClick={() => setScene(x.id)} title={x.name} />
                ))}
              </div>
              <div className="switch">
                <button className={!night ? 'active' : ''} onClick={() => setNight(false)}>☀ Apagado</button>
                <button className={night ? 'active' : ''} onClick={() => setNight(true)}>☾ Encendido</button>
              </div>
            </div>
            {busy && <span className="calc"><span className="led blink" style={{ '--led': '#22c55e' }} /> Calculando puntos…</span>}
            <div
              className="wall-sign"
              style={{
                aspectRatio: `${box.w} / ${box.h}`,
                width: `min(100%, ${((box.w / box.h) * 50).toFixed(2)}vh)`
              }}
            >
              <span className="dim dim-w">{design.widthCm} cm</span>
              <span className="dim dim-h">{design.heightCm} cm</span>
              <LedPreview design={design} night={night} animate={night} withMount />
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
            <span className="label">Modelos</span>
            <div className="styles-scroll">
              {LED_TEMPLATES.map((t) => {
                const first = t.d.lines.find((l) => l.text) || t.d.lines[0]
                const color = ledColorById(t.d.lines[0].color).hex
                return (
                  <button key={t.name} className="style-card text" onClick={() => setDesign(normalizeLedDesign({ ...defaultLedDesign(), ...t.d, dots: [] }))}>
                    <span className="model-line" style={{ color }}>
                      {t.d.lines[0].icon && <IconGlyph id={t.d.lines[0].icon} size={18} />}
                      <span style={{ fontFamily: `"${first.font}"` }}>{first.text}</span>
                    </span>
                    <em>{t.name}</em>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <aside className="studio-panel">
          <Section n="01" title="Texto" hint="Hasta 4 líneas">
            {design.lines.map((line, i) => (
              <div className="text-line" key={i}>
                <div className="row">
                  <input className="input grow led-text" value={line.text} maxLength={40} placeholder={line.icon ? 'Solo ícono (o escribe texto)' : 'Escribe aquí…'} onChange={(e) => setLine(i, { text: e.target.value })} style={{ fontFamily: `"${line.font}"` }} />
                  {design.lines.length > 1 && <button className="icon-btn" onClick={() => setDesign((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))} title="Quitar línea">✕</button>}
                </div>
                <div className="row">
                  {design.style === 'matriz' ? <span className="muted small grow">Fuente de puntos 5×7</span> : <FontSelect value={line.font} onChange={(font) => setLine(i, { font })} />}
                  {design.style !== 'matriz' && <button className={`toggle ${line.bold ? 'on' : ''}`} onClick={() => setLine(i, { bold: !line.bold })}><b>B</b></button>}
                </div>
                <div className="row">
                  <button className={`icon-chip ${line.icon ? 'on' : ''}`} onClick={() => setPicker(picker === i ? -1 : i)}>
                    {line.icon ? <IconGlyph id={line.icon} size={18} /> : <span className="plus">＋</span>}
                    <span>{line.icon ? 'Cambiar ícono' : 'Agregar ícono'}</span>
                  </button>
                  {line.icon && line.text.trim() && (
                    <div className="switch small">
                      <button className={line.iconPos === 'left' ? 'active' : ''} onClick={() => setLine(i, { iconPos: 'left' })}>Izq.</button>
                      <button className={line.iconPos === 'right' ? 'active' : ''} onClick={() => setLine(i, { iconPos: 'right' })}>Der.</button>
                    </div>
                  )}
                </div>
                {picker === i && (
                  <IconPicker value={line.icon} onChange={(icon) => { setLine(i, { icon }); setPicker(-1) }} onClose={() => setPicker(-1)} />
                )}
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

          <Section n="03" title="Placa" hint="Forma, color y montaje">
            <div className="shapes">
              {SHAPES.map((x) => (
                <button key={x.id} className={design.shape === x.id ? 'active' : ''} onClick={() => update({ shape: x.id })} title={x.name}>
                  <ShapeIcon shape={x.id} />
                  <span>{x.name}</span>
                </button>
              ))}
            </div>
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
            {design.shape === 'round' && (
              <label className="range">
                <span>Esquinas</span>
                <input type="range" min="0" max="100" value={design.cornerMm} onChange={(e) => update({ cornerMm: +e.target.value })} />
                <output>{design.cornerMm}</output>
              </label>
            )}
            <div className="mounts">
              {MOUNTS.map((m) => (
                <button key={m.id} className={`led-mode ${design.mount === m.id ? 'active' : ''}`} onClick={() => update({ mount: m.id })}>
                  <MountIcon mount={m.id} />
                  <strong>{m.name}</strong>
                  <span>{m.note}{prices.led.mounts?.[m.id] ? ` · +${money(prices.led.mounts[m.id])}` : ''}</span>
                </button>
              ))}
            </div>
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
              <span>Instalación (+{money(prices.led.installation)})</span>
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
                <span className="muted small">{quantity > 1 ? `${money(q.unitPrice)} c/u` : (business.ivaIncluded ? 'IVA incluido' : `más IVA ${business.ivaRate} %`)}</span>
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

function ShapeIcon({ shape }) {
  const d = {
    rect: 'M3 6h18v12H3z',
    round: 'M7 6h10a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z',
    pill: 'M9 6h6a6 6 0 0 1 0 12H9A6 6 0 0 1 9 6z',
    circle: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z',
    arch: 'M4 20V11a8 8 0 0 1 16 0v9z',
    hex: 'M7 5h10l5 7-5 7H7l-5-7z'
  }[shape]
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function MountIcon({ mount }) {
  const body = {
    pared: <><path d="M3 3v18" /><rect x="6" y="7" width="14" height="9" rx="1.5" /><circle cx="8.5" cy="9.5" r=".8" /><circle cx="17.5" cy="9.5" r=".8" /></>,
    colgante: <><path d="M12 2v2M12 4 6 10M12 4l6 6" /><rect x="4" y="10" width="16" height="9" rx="1.5" /></>,
    base: <><rect x="6" y="3" width="12" height="13" rx="1.5" /><path d="M3 20h18M5 20l1.5-4h11L19 20" /></>
  }[mount]
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {body}
    </svg>
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
            <div className="row center-row">
              <a className="btn primary" href={`#/presupuesto/${result.folio}/${result.token}`}>Ver mi presupuesto</a>
              <a className="btn ghost" href={`#/seguimiento/${result.folio}`}>Seguimiento</a>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2>Confirmar pedido</h2>
            <div className="modal-preview">
              <div className="modal-sign"><LedPreview design={design} night withMount /></div>
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
