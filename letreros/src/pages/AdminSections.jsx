import { useEffect, useMemo, useState } from 'react'
import DesignPreview from '../components/DesignPreview'
import { api } from '../lib/api'
import { money, MATERIALS, EXTRAS } from '../lib/pricing'
import { BOARD_MATERIALS, FINISHES, LED_COLORS, MOUNTS, SHAPES } from '../lib/ledSign'
import { DEFAULT_PRICES, PERMISSIONS, ROLES, computeTotals } from '../lib/prices'

const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
export const quoteLink = (o) => `${window.location.origin}${window.location.pathname}#/presupuesto/${o.folio}/${o.publicToken}`
export const waTo = (phone, text) => {
  const d = (phone || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}

export const QUOTE_STATES = [
  { id: 'pendiente', label: 'Sin enviar', color: '#94a3b8' },
  { id: 'enviada', label: 'Enviado', color: '#3b82f6' },
  { id: 'aceptada', label: 'Aceptado', color: '#22c55e' },
  { id: 'rechazada', label: 'Rechazado', color: '#ef4444' }
]
export const quoteStateById = (id) => QUOTE_STATES.find((s) => s.id === id) || QUOTE_STATES[0]

export function QuotePill({ state }) {
  const s = quoteStateById(state)
  return (
    <span className="status">
      <span className="led sm" style={{ '--led': s.color }} />
      {s.label}
    </span>
  )
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    prompt('Copia el enlace:', text)
    return false
  }
}

// ---------- Presupuestos ----------
export function Quotes({ orders, onOpen, onUpdate }) {
  const [filter, setFilter] = useState('todos')
  const list = orders.filter((o) => filter === 'todos' || o.quoteState === filter)
  const sum = (st) => orders.filter((o) => o.quoteState === st).reduce((a, o) => a + (o.totals?.total || 0), 0)
  const accepted = orders.filter((o) => o.quoteState === 'aceptada').length
  const decided = orders.filter((o) => ['aceptada', 'rechazada'].includes(o.quoteState)).length
  return (
    <>
      <div className="kpis">
        <div className="kpi"><span>Por enviar</span><strong>{orders.filter((o) => o.quoteState === 'pendiente').length}</strong></div>
        <div className="kpi"><span>Enviados · en espera</span><strong>{money(sum('enviada'))}</strong></div>
        <div className="kpi"><span>Aceptados</span><strong>{money(sum('aceptada'))}</strong></div>
        <div className="kpi"><span>Tasa de cierre</span><strong>{decided ? Math.round((accepted / decided) * 100) : 0} %</strong></div>
      </div>
      <div className="toolbar">
        <div className="chips">
          <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos {orders.length}</button>
          {QUOTE_STATES.map((s) => (
            <button key={s.id} className={filter === s.id ? 'active' : ''} onClick={() => setFilter(s.id)}>
              <span className="led sm" style={{ '--led': s.color }} /> {s.label} {orders.filter((o) => o.quoteState === s.id).length}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr><th>Diseño</th><th>Folio</th><th>Cliente</th><th>Total</th><th>Anticipo</th><th>Vigencia</th><th>Presupuesto</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const expired = new Date(o.validUntil) < new Date() && o.quoteState !== 'aceptada'
              return (
                <tr key={o.id} onClick={() => onOpen(o.id, 'presupuesto')}>
                  <td><div className="thumb"><DesignPreview design={o.design} /></div></td>
                  <td><strong>{o.folio}</strong><div className="muted small">{fmtDate(o.createdAt)}</div></td>
                  <td>{o.customer.name}</td>
                  <td><strong>{money(o.totals?.total || 0)}</strong>{o.totals?.discount > 0 && <div className="muted small">desc. {money(o.totals.discount)}</div>}</td>
                  <td>{money(o.totals?.deposit || 0)}</td>
                  <td className={expired ? 'bad small' : 'small'}>{fmtDate(o.validUntil)}{expired ? ' · vencido' : ''}</td>
                  <td><QuotePill state={o.quoteState} /></td>
                  <td className="actions" onClick={(e) => e.stopPropagation()}>
                    <SendQuote order={o} onUpdate={onUpdate} compact />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="muted empty">Sin presupuestos.</p>}
      </div>
    </>
  )
}

// Botones para compartir el presupuesto (marca "enviado" al mandarlo)
export function SendQuote({ order, onUpdate, compact = false }) {
  const [copied, setCopied] = useState(false)
  const link = quoteLink(order)
  const markSent = () => order.quoteState === 'pendiente' && onUpdate(order.id, { quoteState: 'enviada' })
  const wa = waTo(
    order.customer.phone,
    `Hola ${order.customer.name}, aquí está tu presupuesto ${order.folio} por ${money(order.totals?.total || 0)}: ${link}`
  )
  return (
    <div className="row send-quote">
      {wa && (
        <a className={`btn ${compact ? 'ghost sm' : 'primary'}`} href={wa} target="_blank" rel="noreferrer" onClick={markSent}>
          {compact ? 'WhatsApp' : 'Enviar por WhatsApp'}
        </a>
      )}
      <button
        className={`btn ghost ${compact ? 'sm' : ''}`}
        onClick={async () => {
          await copy(link)
          setCopied(true)
          markSent()
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? '¡Copiado!' : 'Copiar enlace'}
      </button>
      {!compact && <a className="btn ghost" href={link} target="_blank" rel="noreferrer">Ver como cliente ↗</a>}
    </div>
  )
}

// Editor de ajustes del presupuesto (cargos extra, descuentos, nota) con totales en vivo
export function QuoteEditor({ order, business, onUpdate, canEdit }) {
  const [adj, setAdj] = useState(() => ({ items: [], discountPct: 0, discountAmt: 0, note: '', ...order.adjust }))
  const [saving, setSaving] = useState(false)
  const totals = useMemo(() => computeTotals(order.quote, adj, business), [order.quote, adj, business])
  const dirty = JSON.stringify(adj) !== JSON.stringify({ items: [], discountPct: 0, discountAmt: 0, note: '', ...order.adjust })
  const setItem = (i, patch) => setAdj((a) => ({ ...a, items: a.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))

  const save = async () => {
    setSaving(true)
    try {
      await onUpdate(order.id, { adjust: adj })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="quote-editor">
      <section>
        <h3>Conceptos calculados</h3>
        <ul className="quote-lines">
          {order.quote.lines.map((l, i) => <li key={i}><span>{l.label}</span><span>{money(l.amount)}</span></li>)}
          {order.quote.discount > 0 && <li className="discount"><span>Descuento por volumen</span><span>−{money(order.quote.discount)}</span></li>}
        </ul>
      </section>

      <section>
        <h3>Cargos o ajustes extra</h3>
        {adj.items.map((it, i) => (
          <div className="row adj-row" key={i}>
            <input className="input grow" placeholder="Concepto (flete, diseño, urgencia…)" value={it.label} disabled={!canEdit} onChange={(e) => setItem(i, { label: e.target.value })} />
            <input className="input amount" type="number" value={it.amount} disabled={!canEdit} onChange={(e) => setItem(i, { amount: Number(e.target.value) })} />
            {canEdit && <button className="icon-btn" onClick={() => setAdj((a) => ({ ...a, items: a.items.filter((_, j) => j !== i) }))}>✕</button>}
          </div>
        ))}
        {canEdit && (
          <div className="row wrap">
            <button className="link-btn" onClick={() => setAdj((a) => ({ ...a, items: [...a.items, { label: '', amount: 0 }] }))}>+ Agregar concepto</button>
            {['Flete', 'Instalación en altura', 'Diseño personalizado', 'Urgencia 48 h'].map((s) => (
              <button key={s} className="chip-mini" onClick={() => setAdj((a) => ({ ...a, items: [...a.items, { label: s, amount: 0 }] }))}>{s}</button>
            ))}
          </div>
        )}
        <div className="row adj-discount">
          <label className="field grow"><span>Descuento %</span><input className="input" type="number" min="0" max="100" value={adj.discountPct} disabled={!canEdit} onChange={(e) => setAdj((a) => ({ ...a, discountPct: Number(e.target.value) }))} /></label>
          <label className="field grow"><span>Descuento $</span><input className="input" type="number" min="0" value={adj.discountAmt} disabled={!canEdit} onChange={(e) => setAdj((a) => ({ ...a, discountAmt: Number(e.target.value) }))} /></label>
        </div>
        <label className="field"><span>Nota para el cliente</span><textarea className="input" rows="2" value={adj.note} disabled={!canEdit} placeholder="Ej. incluye 2 revisiones de diseño…" onChange={(e) => setAdj((a) => ({ ...a, note: e.target.value }))} /></label>
      </section>

      <section className="qe-totals">
        <div><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
        <div><span>IVA {totals.ivaRate} %{totals.ivaIncluded ? ' incluido' : ''}</span><span>{money(totals.iva)}</span></div>
        <div className="grand"><span>Total</span><span>{money(totals.total)}</span></div>
        <div><span>Anticipo {totals.depositPct} %</span><span>{money(totals.deposit)}</span></div>
      </section>

      {canEdit && (
        <button className="btn primary block" disabled={!dirty || saving} onClick={save}>
          {saving ? 'Guardando…' : dirty ? 'Guardar presupuesto' : 'Presupuesto guardado'}
        </button>
      )}
      <SendQuote order={order} onUpdate={onUpdate} />
      {canEdit && (
        <div className="row wrap">
          <span className="muted small">Marcar como:</span>
          {QUOTE_STATES.map((s) => (
            <button key={s.id} className={`chip-mini ${order.quoteState === s.id ? 'on' : ''}`} onClick={() => onUpdate(order.id, { quoteState: s.id })}>{s.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------- Clientes ----------
export function Clients({ orders, onOpen, showMoney }) {
  const [q, setQ] = useState('')
  const clients = useMemo(() => {
    const map = new Map()
    for (const o of orders) {
      const key = (o.customer.phone || '').replace(/\D/g, '').slice(-10) || o.customer.email || o.customer.name.toLowerCase()
      if (!map.has(key)) map.set(key, { key, name: o.customer.name, phone: o.customer.phone, email: o.customer.email, orders: [], total: 0, last: o.createdAt })
      const c = map.get(key)
      c.orders.push(o)
      if (o.status !== 'cancelado') c.total += o.totals?.total || 0
      if (o.createdAt > c.last) c.last = o.createdAt
    }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last))
  }, [orders])
  const term = q.trim().toLowerCase()
  const list = clients.filter((c) => !term || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(term))
  return (
    <>
      <div className="toolbar">
        <input className="input search" placeholder="Buscar cliente, teléfono o correo…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="clients">
        {list.map((c) => (
          <article className="client-card" key={c.key}>
            <div className="client-head">
              <span className="avatar">{c.name.slice(0, 1).toUpperCase()}</span>
              <div className="grow">
                <strong>{c.name}</strong>
                <span className="muted small">{c.phone || c.email || '—'}</span>
              </div>
              {waTo(c.phone, `Hola ${c.name}, te saludamos de AP.`) && (
                <a className="btn ghost sm" href={waTo(c.phone, `Hola ${c.name}, te saludamos de AP.`)} target="_blank" rel="noreferrer">WhatsApp</a>
              )}
            </div>
            <div className="client-stats">
              <div><strong>{c.orders.length}</strong><span>pedido{c.orders.length > 1 ? 's' : ''}</span></div>
              {showMoney && <div><strong>{money(c.total)}</strong><span>comprado</span></div>}
              <div><strong>{fmtDate(c.last)}</strong><span>último</span></div>
            </div>
            <div className="client-orders">
              {c.orders.slice(0, 4).map((o) => (
                <button key={o.id} className="chip-mini" onClick={() => onOpen(o.id)}>{o.folio}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
      {list.length === 0 && <p className="muted empty">Sin clientes.</p>}
    </>
  )
}

// ---------- Precios ----------
function PriceField({ label, value, onChange, suffix }) {
  return (
    <label className="price-field">
      <span>{label}</span>
      <div className="price-input">
        <em>$</em>
        <input type="number" min="0" step="0.5" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  )
}

export function Prices({ settings, onSaved }) {
  const [p, setP] = useState(settings.prices)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => setP(settings.prices), [settings.prices])
  const set = (path, value) =>
    setP((prev) => {
      const next = structuredClone(prev)
      let o = next
      for (const k of path.slice(0, -1)) o = o[k]
      o[path.at(-1)] = value
      return next
    })
  const dirty = JSON.stringify(p) !== JSON.stringify(settings.prices)

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      onSaved(await api.savePrices(p))
      setMsg('Precios guardados. Ya se usan en el sitio.')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="save-bar">
        <span className="muted small">
          {settings.pricesUpdated ? `Última actualización: ${new Date(settings.pricesUpdated.at).toLocaleString('es-MX')} por ${settings.pricesUpdated.by}` : 'Precios de fábrica'}
        </span>
        {msg && <span className="small">{msg}</span>}
        <button className="btn ghost sm" onClick={() => setP(DEFAULT_PRICES)}>Restaurar de fábrica</button>
        <button className="btn primary sm" disabled={!dirty || saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar precios'}</button>
      </div>

      <section className="card">
        <h2>Letrero LED · placa y LED</h2>
        <div className="price-grid">
          {BOARD_MATERIALS.map((m) => (
            <PriceField key={m.id} label={m.name} suffix="/m²" value={p.led.boards[m.id]} onChange={(v) => set(['led', 'boards', m.id], v)} />
          ))}
          <PriceField label="Placa mínima" value={p.led.minBoard} onChange={(v) => set(['led', 'minBoard'], v)} />
          <PriceField label="Perforado y armado" suffix="/LED" value={p.led.assembly} onChange={(v) => set(['led', 'assembly'], v)} />
          <PriceField label="Instalación" value={p.led.installation} onChange={(v) => set(['led', 'installation'], v)} />
        </div>
        <h3 className="sub">Precio por LED según color</h3>
        <div className="price-grid">
          {LED_COLORS.map((c) => (
            <PriceField key={c.id} label={<><span className="led sm" style={{ '--led': c.hex }} /> {c.name}</>} suffix="/LED" value={p.led.colors[c.id]} onChange={(v) => set(['led', 'colors', c.id], v)} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Letrero LED · electrónica</h2>
        <div className="price-grid">
          <PriceField label="Placa B (fuente 127 V)" value={p.led.boardB} onChange={(v) => set(['led', 'boardB'], v)} />
          <PriceField label="Placa A (secuenciador)" value={p.led.boardA} onChange={(v) => set(['led', 'boardA'], v)} />
          <PriceField label="Intermitente" value={p.led.flasher} onChange={(v) => set(['led', 'flasher'], v)} />
          <PriceField label="Efecto respirar (PWM)" value={p.led.fader} onChange={(v) => set(['led', 'fader'], v)} />
          <PriceField label="Marco LED (trazo y armado)" value={p.led.frame} onChange={(v) => set(['led', 'frame'], v)} />
          <PriceField label="Controlador 12 V" value={p.led.controller12} onChange={(v) => set(['led', 'controller12'], v)} />
          <PriceField label="Resistencias" suffix="/cadena" value={p.led.resistor} onChange={(v) => set(['led', 'resistor'], v)} />
          {Object.keys(p.led.supply12).map((a) => (
            <PriceField key={a} label={`Eliminador 12 V ${a} A`} value={p.led.supply12[a]} onChange={(v) => set(['led', 'supply12', a], v)} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Letrero LED · forma y montaje</h2>
        <div className="price-grid">
          {SHAPES.map((x) => (
            <PriceField key={x.id} label={`Forma ${x.name.toLowerCase()}`} value={p.led.shapes[x.id]} onChange={(v) => set(['led', 'shapes', x.id], v)} />
          ))}
          {MOUNTS.map((x) => (
            <PriceField key={x.id} label={x.name} value={p.led.mounts[x.id]} onChange={(v) => set(['led', 'mounts', x.id], v)} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Letrero LED · acabados y texturas</h2>
        <div className="price-grid">
          {FINISHES.filter((f) => f.id !== 'liso').map((f) => (
            <PriceField key={f.id} label={`${f.group} · ${f.name}`} suffix="/m²" value={p.led.finishes[f.id]} onChange={(v) => set(['led', 'finishes', f.id], v)} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Letrero impreso</h2>
        <div className="price-grid">
          {MATERIALS.map((m) => (
            <PriceField key={m.id} label={m.name} suffix="/m²" value={p.print.materials[m.id]} onChange={(v) => set(['print', 'materials', m.id], v)} />
          ))}
          <PriceField label="Pieza mínima" value={p.print.minPiece} onChange={(v) => set(['print', 'minPiece'], v)} />
          {EXTRAS.map((x) => (
            <PriceField key={x.id} label={x.name} suffix={x.per === 'm2' ? '/m²' : `/${x.per}`} value={p.print.extras[x.id]} onChange={(v) => set(['print', 'extras', x.id], v)} />
          ))}
          <PriceField label="Neón LED flex" suffix="/m²" value={p.print.light.neon} onChange={(v) => set(['print', 'light', 'neon'], v)} />
          <PriceField label="Retroiluminación" suffix="/m²" value={p.print.light.backlit} onChange={(v) => set(['print', 'light', 'backlit'], v)} />
          <PriceField label="Tira LED contorno" suffix="/m" value={p.print.light.perimeter} onChange={(v) => set(['print', 'light', 'perimeter'], v)} />
          <PriceField label="Fuente 12 V" value={p.print.powerSupply} onChange={(v) => set(['print', 'powerSupply'], v)} />
        </div>
      </section>

      <section className="card">
        <h2>Descuento por volumen</h2>
        <div className="volume-rows">
          {p.volume.map(([q, pct], i) => (
            <div className="row" key={i}>
              <label className="field grow"><span>Desde (piezas)</span><input className="input" type="number" min="2" value={q} onChange={(e) => set(['volume', i], [Number(e.target.value), pct])} /></label>
              <label className="field grow"><span>Descuento %</span><input className="input" type="number" min="0" max="90" value={pct} onChange={(e) => set(['volume', i], [q, Number(e.target.value)])} /></label>
              <button className="icon-btn" onClick={() => setP((prev) => ({ ...prev, volume: prev.volume.filter((_, j) => j !== i) }))}>✕</button>
            </div>
          ))}
          <button className="link-btn" onClick={() => setP((prev) => ({ ...prev, volume: [...prev.volume, [100, 25]] }))}>+ Agregar escalón</button>
        </div>
      </section>
    </div>
  )
}

// ---------- Datos del negocio ----------
export function Business({ settings, onSaved }) {
  const [b, setB] = useState(settings.business)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => setB(settings.business), [settings.business])
  const set = (k) => (e) => setB((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      onSaved(await api.saveBusiness(b))
      setMsg('Guardado')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="settings-page">
      <div className="save-bar">
        <span className="muted small">Estos datos aparecen en los presupuestos</span>
        {msg && <span className="small">{msg}</span>}
        <button className="btn primary sm" disabled={saving || JSON.stringify(b) === JSON.stringify(settings.business)} onClick={save}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
      <section className="card form-grid">
        <label className="field"><span>Nombre del negocio</span><input className="input" value={b.name} onChange={set('name')} /></label>
        <label className="field"><span>WhatsApp</span><input className="input" value={b.whatsapp} onChange={set('whatsapp')} placeholder="55 1234 5678" /></label>
        <label className="field"><span>Correo</span><input className="input" value={b.email} onChange={set('email')} /></label>
        <label className="field"><span>Ciudad</span><input className="input" value={b.city} onChange={set('city')} /></label>
        <label className="field wide"><span>Dirección</span><input className="input" value={b.address} onChange={set('address')} /></label>
      </section>
      <section className="card form-grid">
        <label className="field"><span>IVA %</span><input className="input" type="number" min="0" max="30" value={b.ivaRate} onChange={set('ivaRate')} /></label>
        <label className="check-row"><input type="checkbox" checked={b.ivaIncluded} onChange={set('ivaIncluded')} /><span>Los precios ya incluyen IVA</span></label>
        <label className="field"><span>Anticipo %</span><input className="input" type="number" min="0" max="100" value={b.depositPct} onChange={set('depositPct')} /></label>
        <label className="field"><span>Vigencia del presupuesto (días)</span><input className="input" type="number" min="1" value={b.validityDays} onChange={set('validityDays')} /></label>
        <label className="field"><span>Entrega estimada (días hábiles)</span><input className="input" type="number" min="1" value={b.deliveryDays} onChange={set('deliveryDays')} /></label>
        <label className="field"><span>Garantía (meses)</span><input className="input" type="number" min="0" max="120" value={b.warrantyMonths} onChange={set('warrantyMonths')} /></label>
        <label className="field"><span>Meses sin intereses con tarjeta (0 = no)</span><input className="input" type="number" min="0" max="24" value={b.installments} onChange={set('installments')} /></label>
        <label className="field"><span>Costo de envío</span><input className="input" type="number" min="0" value={b.shippingCost} onChange={set('shippingCost')} /></label>
        <label className="field"><span>Envío gratis desde (0 = nunca)</span><input className="input" type="number" min="0" value={b.freeShippingFrom} onChange={set('freeShippingFrom')} /></label>
        <label className="field wide"><span>Datos para pago (banco, CLABE, titular)</span><textarea className="input" rows="2" value={b.bank} onChange={set('bank')} /></label>
        <label className="field wide"><span>Términos y condiciones</span><textarea className="input" rows="4" value={b.terms} onChange={set('terms')} /></label>
      </section>
      <section className="card form-grid">
        <label className="field wide">
          <span>Enlace para reseñas de Google (Perfil de Empresa → “Pedir reseñas”)</span>
          <input className="input" value={b.googleReviewUrl} onChange={set('googleReviewUrl')} placeholder="https://g.page/r/…/review" />
        </label>
        <label className="field"><span>Instagram</span><input className="input" value={b.instagram} onChange={set('instagram')} placeholder="ap.letreros" /></label>
        <label className="field"><span>Facebook</span><input className="input" value={b.facebook} onChange={set('facebook')} placeholder="https://facebook.com/…" /></label>
      </section>
    </div>
  )
}

// ---------- Equipo ----------
export function Team({ me }) {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const load = () => api.users().then(setUsers).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const act = async (fn) => {
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="settings-page">
      <div className="save-bar">
        <span className="muted small">Cada persona entra con su usuario y solo ve lo que le permitas. Tú entras como <b>admin</b>.</span>
        <button className="btn primary sm" onClick={() => setForm({ name: '', username: '', password: '', role: 'ventas', perms: ROLES.find((r) => r.id === 'ventas').perms })}>+ Agregar persona</button>
      </div>
      {error && <p className="error">{error}</p>}

      {form && (
        <section className="card user-form">
          <h2>{form.id ? `Editar a ${form.name}` : 'Nueva persona'}</h2>
          <div className="form-grid">
            <label className="field"><span>Nombre</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>Usuario</span><input className="input" value={form.username} disabled={!!form.id} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} /></label>
            <label className="field"><span>{form.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}</span><input className="input" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="mínimo 6 caracteres" /></label>
          </div>
          <div className="field">
            <span>Rol</span>
            <div className="chips">
              {ROLES.map((r) => (
                <button key={r.id} className={form.role === r.id ? 'active' : ''} onClick={() => setForm({ ...form, role: r.id, perms: r.id === 'personalizado' ? form.perms : r.perms })}>{r.name}</button>
              ))}
            </div>
          </div>
          <div className="perm-grid">
            {PERMISSIONS.map((p) => (
              <label key={p.id} className="check-row">
                <input
                  type="checkbox"
                  checked={form.perms.includes(p.id)}
                  onChange={(e) => setForm({ ...form, role: 'personalizado', perms: e.target.checked ? [...form.perms, p.id] : form.perms.filter((x) => x !== p.id) })}
                />
                <span>{p.name}</span>
              </label>
            ))}
          </div>
          <div className="row">
            <button className="btn ghost sm" onClick={() => setForm(null)}>Cancelar</button>
            <button
              className="btn primary sm"
              onClick={() =>
                act(async () => {
                  if (form.id) {
                    const patch = { name: form.name, role: form.role, perms: form.perms }
                    if (form.password) patch.password = form.password
                    await api.updateUser(form.id, patch)
                  } else {
                    await api.createUser(form)
                  }
                  setForm(null)
                })
              }
            >
              Guardar
            </button>
          </div>
        </section>
      )}

      <div className="team-list">
        <article className="team-card owner">
          <span className="avatar">★</span>
          <div className="grow"><strong>Dueño</strong><span className="muted small">usuario admin · todos los permisos</span></div>
          {me.id === 'owner' && <span className="kind led-kind">Tú</span>}
        </article>
        {users.map((u) => (
          <article key={u.id} className={`team-card ${u.active ? '' : 'off'}`}>
            <span className="avatar">{u.name.slice(0, 1).toUpperCase()}</span>
            <div className="grow">
              <strong>{u.name}</strong>
              <span className="muted small">usuario {u.username} · {ROLES.find((r) => r.id === u.role)?.name || 'Personalizado'}{u.active ? '' : ' · desactivado'}</span>
              <div className="perm-chips">
                {u.perms.map((p) => <span key={p} className="kind">{PERMISSIONS.find((x) => x.id === p)?.name}</span>)}
              </div>
            </div>
            <div className="row">
              <button className="btn ghost sm" onClick={() => setForm({ ...u, password: '' })}>Editar</button>
              <button className="btn ghost sm" onClick={() => act(() => api.updateUser(u.id, { active: !u.active }))}>{u.active ? 'Desactivar' : 'Activar'}</button>
              <button className="icon-btn" title="Eliminar" onClick={() => confirm(`¿Eliminar a ${u.name}?`) && act(() => api.deleteUser(u.id))}>✕</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
