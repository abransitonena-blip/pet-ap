import { useEffect, useMemo, useRef, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import LedPreview, { previewBox } from '../components/LedPreview'
import IconPicker, { IconGlyph } from '../components/IconPicker'
import OrderModal from '../components/OrderModal'
import Sign3D from '../components/Sign3D'
import { DotIcon, MountIcon, ShapeIcon } from '../components/LedIcons'
import { LED_MODELS } from '../lib/ledModels'
import { readSharedDesign, shareUrl } from '../lib/share'
import FontSelect from '../components/FontSelect'
import {
  ANIMATIONS, BOARDS, BOARD_MATERIALS, MOUNTS, SCENES, SHAPES, DOT_STYLES, LED_COLORS, LED_SIZES, MAX_DOTS, POWER,
  boardById, boardMaterialById, defaultLedDesign, ledColorById, newLedLine, normalizeLedDesign, planPower
} from '../lib/ledSign'
import { computeLedDots } from '../lib/ledText'
import { money, quote } from '../lib/pricing'
import { usePublicSettings } from '../lib/settings'
import { api } from '../lib/api'

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

// Tamaños por ancho final: el cliente piensa en el letrero completo, no en milímetros de letra
const DARK_BOARDS = ['negro', 'humo', 'azulnoche', 'madera', 'gris']

const SIZES = [
  { id: 's', name: 'Chico', widthCm: 40 },
  { id: 'm', name: 'Mediano', widthCm: 60 },
  { id: 'l', name: 'Grande', widthCm: 90 },
  { id: 'xl', name: 'Extra', widthCm: 120 }
]

function loadDraft() {
  const shared = readSharedDesign()
  if (shared) return normalizeLedDesign(shared)
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
  const [copied, setCopied] = useState(false)
  const [view3d, setView3d] = useState(true)
  // Foto del local del cliente (solo en su navegador, no se sube)
  const [photo, setPhoto] = useState('')
  const [place, setPlace] = useState({ x: 0, y: 0, scale: 0.6 })
  const drag = useRef(null)
  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photo) URL.revokeObjectURL(photo)
    setPhoto(URL.createObjectURL(file))
    setPlace({ x: 0, y: 0, scale: 0.6 })
    e.target.value = ''
  }
  const startDrag = (e) => {
    if (!photo) return
    drag.current = { x: e.clientX, y: e.clientY, from: place }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const moveDrag = (e) => {
    const d = drag.current
    if (!d) return
    setPlace((p) => ({ ...p, x: d.from.x + e.clientX - d.x, y: d.from.y + e.clientY - d.y }))
  }
  const busy = useLedDots(design, setDesign)

  // Ajuste a un tamaño: escala las letras y corrige hasta quedar a ±6 % del ancho elegido
  const target = useRef(null)
  const scaleLines = (factor) =>
    setDesign((d) => ({
      ...d,
      lines: d.lines.map((l) => ({ ...l, heightMm: Math.min(1000, Math.max(30, Math.round((l.heightMm * factor) / 5) * 5)) }))
    }))
  const pickSize = (widthCm) => {
    target.current = { widthCm, tries: 0 }
    scaleLines(widthCm / design.widthCm)
  }
  useEffect(() => {
    const t = target.current
    if (!t || busy) return
    const ratio = t.widthCm / design.widthCm
    if (Math.abs(ratio - 1) < 0.06 || t.tries >= 3) {
      target.current = null
      return
    }
    t.tries++
    scaleLines(ratio)
  }, [design.widthCm, busy])
  const activeSize = SIZES.find((x) => Math.abs(design.widthCm - x.widthCm) / x.widthCm < 0.12)

  // Abrir un enlace compartido con la página ya cargada
  useEffect(() => {
    const onHash = () => {
      const shared = readSharedDesign()
      if (shared) setDesign(normalizeLedDesign(shared))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const share = async () => {
    const url = shareUrl(design)
    try {
      if (navigator.share) await navigator.share({ title: 'Mi letrero AP', url })
      else await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

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
          <div
            className={`wall ${night ? 'night' : ''} ${photo ? 'photo' : ''}`}
            data-scene={photo ? undefined : scene}
            style={photo ? { backgroundImage: `url(${photo})` } : { '--scene': SCENES.find((x) => x.id === scene)?.hex }}
          >
            <div className="wall-tools">
              <label className={`tool-btn ${photo ? 'on' : ''}`} title="Sube una foto de tu local y coloca el letrero">
                <input type="file" accept="image/*" onChange={onPhoto} />
                {photo ? 'Cambiar foto' : 'Pruébalo en tu local'}
              </label>
              {photo && <button className="tool-btn" onClick={() => { URL.revokeObjectURL(photo); setPhoto('') }}>Quitar foto</button>}
              {!photo && <button className={`tool-btn ${view3d ? 'on' : ''}`} onClick={() => setView3d((v) => !v)}>3D</button>}
              {!photo && <div className="scenes" title="Fondo de la pared">
                {SCENES.map((x) => (
                  <button key={x.id} className={scene === x.id ? 'active' : ''} style={{ background: x.hex }} onClick={() => setScene(x.id)} title={x.name} />
                ))}
              </div>}
              <div className="switch">
                <button className={!night ? 'active' : ''} onClick={() => setNight(false)}>☀ Apagado</button>
                <button className={night ? 'active' : ''} onClick={() => setNight(true)}>☾ Encendido</button>
              </div>
            </div>
            {photo && (
              <label className="photo-scale">
                Tamaño
                <input type="range" min="0.15" max="1.4" step="0.01" value={place.scale} onChange={(e) => setPlace((p) => ({ ...p, scale: +e.target.value }))} />
                <span className="muted">Arrastra el letrero</span>
              </label>
            )}
            {busy && <span className="calc"><span className="led blink" style={{ '--led': '#22c55e' }} /> Calculando puntos…</span>}
            <div
              className="wall-sign"
              style={{
                aspectRatio: `${box.w} / ${box.h}`,
                width: `min(100%, ${((box.w / box.h) * 50).toFixed(2)}vh)`,
                ...(photo ? { transform: `translate(${place.x}px, ${place.y}px) scale(${place.scale})` } : {})
              }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={() => (drag.current = null)}
            >
              {!photo && <span className="dim dim-w">{design.widthCm} cm</span>}
              {!photo && <span className="dim dim-h">{design.heightCm} cm</span>}
              <Sign3D design={design} night={night} animate={night} enabled={view3d && !photo} />
            </div>
          </div>

          <div className="led-stats">
            <div><strong>{design.widthCm}×{design.heightCm}</strong><span>cm</span></div>
            <div><strong>{design.dots.length}</strong><span>LED</span></div>
            <div><strong>{plan.watts} W</strong><span>consumo</span></div>
            <div><strong>{business.deliveryDays} días</strong><span>entrega</span></div>
            <div className="stat-action">
              <button className="btn ghost sm" onClick={share}>{copied ? '¡Enlace copiado!' : 'Compartir diseño'}</button>
            </div>
          </div>

          <div className="styles-row">
            <span className="label">Ideas</span>
            <div className="styles-scroll">
              {LED_MODELS.map((t) => {
                const first = t.d.lines.find((l) => l.text) || t.d.lines[0]
                const color = ledColorById(t.d.lines[0].color).hex
                return (
                  <button
                    key={t.name}
                    className={`style-card text ${DARK_BOARDS.includes(t.d.board) ? 'dark' : ''}`}
                    style={{ background: boardById(t.d.board || 'blanco').hex }}
                    onClick={() => setDesign(normalizeLedDesign({ ...defaultLedDesign(), ...t.d, dots: [] }))}
                  >
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
          <MadeByAp onPick={(d) => { setDesign(normalizeLedDesign(d)); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        </section>

        <aside className="studio-panel">
          <Section n="01" title="¿Qué dice tu letrero?" hint="Hasta 4 líneas">
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

          <Section n="02" title="Tamaño" hint={`${design.widthCm} × ${design.heightCm} cm`}>
            <div className="sizes">
              {SIZES.map((x) => (
                <button key={x.id} className={activeSize?.id === x.id ? 'active' : ''} onClick={() => pickSize(x.widthCm)} disabled={busy}>
                  <strong>{x.name}</strong>
                  <span>≈ {x.widthCm} cm</span>
                </button>
              ))}
            </div>
            <p className="muted small">¿Otra medida? Mueve la altura de cada línea en el paso 1.</p>
          </Section>

          <Section n="03" title="Base" hint="Forma, color y montaje">
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

          <Section n="04" title="Efecto de luz">
            <div className="switch full">
              {ANIMATIONS.map((a) => (
                <button key={a.id} className={design.animation === a.id ? 'active' : ''} onClick={() => { update({ animation: a.id }); setNight(true) }}>{a.name}</button>
              ))}
            </div>
            <p className="muted small">{ANIMATIONS.find((a) => a.id === design.animation).note}</p>
            <label className="check-row">
              <input type="checkbox" checked={design.extras.includes('instalacion')} onChange={(e) => update({ extras: e.target.checked ? ['instalacion'] : [] })} />
              <span>Instalación (+{money(prices.led.installation)})</span>
            </label>
          </Section>

          <details className="advanced">
            <summary>
              <span>Opciones avanzadas</span>
              <em>Puntos, LED, alimentación y márgenes · si no sabes, lo ajustamos por ti</em>
            </summary>
          <Section n="·" title="Puntos" hint={`LED de ${design.ledMm} mm`}>
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

            <Section n="·" title="Alimentación y placa">
            <div className="led-modes">
              {POWER.map((p) => (
                <button key={p.id} className={`led-mode ${design.power === p.id ? 'active' : ''}`} onClick={() => update({ power: p.id })}>
                  <span className="led" style={{ '--led': p.id === '127v' ? '#f59e0b' : '#22c55e' }} />
                  <strong>{p.name}</strong>
                  <span>{p.note}</span>
                </button>
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
            </Section>
          </details>

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
              <button className="btn primary" onClick={() => setOrdering(true)} disabled={busy || !design.dots.length || tooMany}>Pedir mi letrero</button>
            </div>
          </div>
        </aside>
      </div>

      {ordering && (
        <OrderModal
          design={design}
          quantity={quantity}
          total={q.total}
          preview={<LedPreview design={design} night withMount />}
          summary={[`Letrero LED ${design.widthCm} × ${design.heightCm} cm`, `${design.dots.length} LED · ${boardMaterialById(design.material).name}`]}
          onClose={() => setOrdering(false)}
        />
      )}
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

// Trabajos reales que el negocio marcó para mostrar (solo el diseño, nunca datos del cliente)
function MadeByAp({ onPick }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    api.gallery().then((list) => setItems(list.filter((x) => x.design?.kind === 'led'))).catch(() => {})
  }, [])
  if (!items.length) return null
  return (
    <section className="made-by">
      <div className="made-by-head">
        <h2>Hecho por AP</h2>
        <span className="muted small">Letreros que ya entregamos · toca uno para usarlo de base</span>
      </div>
      <div className="made-by-strip">
        {items.map((it) => (
          <article key={it.id} className="made-by-item">
            <div className="thumb-night"><LedPreview design={it.design} night /></div>
            <footer>
              <span className="muted">{it.design.widthCm}×{it.design.heightCm} cm · {it.design.dots.length} LED</span>
              <button className="btn ghost sm" onClick={() => onPick(it.design)}>Lo quiero así</button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}
