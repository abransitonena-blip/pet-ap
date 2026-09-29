import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { usePublicSettings } from '../lib/settings'
import { DELIVERY_OPTIONS } from '../lib/customer'
import { shippingFor } from '../lib/prices'
import { LEAD_SOURCES } from '../lib/business'
import { readCampaign } from '../lib/campaign'
import { useAccount } from '../lib/account'

const SAVED_KEY = 'ap_customer'

function loadCustomer() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY)) || {}
  } catch {
    return {}
  }
}

const today = () => new Date().toISOString().slice(0, 10)
const digits = (s) => (s || '').replace(/\D/g, '')

export const waLink = (phone, text) => {
  const d = digits(phone)
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}

// Formulario de pedido compartido por los dos editores.
// `preview`: vista del letrero · `summary`: renglones cortos (medida, material…)
export default function OrderModal({ design, batch, quantity, total, preview, summary = [], onClose }) {
  const { business } = usePublicSettings()
  const saved = loadCustomer()
  const { account } = useAccount()
  const [form, setForm] = useState({
    name: saved.name || '',
    phone: saved.phone || '',
    email: saved.email || '',
    delivery: saved.delivery || 'recoger',
    date: '',
    notes: '',
    source: saved.source || ''
  })
  // Con cuenta: sus datos se llenan solos
  useEffect(() => {
    if (!account) return
    setForm((f) => ({ ...f, name: f.name || account.name, email: f.email || account.email, phone: f.phone || account.phone }))
  }, [account])
  const campaign = readCampaign()
  const [code, setCode] = useState(campaign.coupon || '')
  const [coupon, setCoupon] = useState(null) // { code, pct, amount, label }
  const [couponMsg, setCouponMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const ship = shippingFor(form.delivery, total, business)
  const shipNote = (id) =>
    id !== 'envio' ? null : shippingFor('envio', total, business) ? `+${money(business.shippingCost)}` : business.shippingCost ? 'Gratis' : null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Descuento estimado del cupón (el servidor lo confirma al crear el pedido)
  const off = coupon ? Math.min(total, Math.round((total * coupon.pct) / 100) + coupon.amount) : 0
  const checkCoupon = async () => {
    setCouponMsg('')
    setCoupon(null)
    if (!code.trim()) return
    try {
      setCoupon(await api.coupon(code.trim(), total))
    } catch (err) {
      setCouponMsg(err.message)
    }
  }

  // Cupón que llegó en el enlace (?cupon=): se aplica solo
  useEffect(() => {
    if (campaign.coupon) checkCoupon()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const phoneOk = !form.phone || digits(form.phone).length >= 10
  const canSend = form.name.trim() && (form.phone || form.email) && phoneOk && !sending

  const submit = async (e) => {
    e.preventDefault()
    if (!canSend) return
    setError('')
    setSending(true)
    try {
      const customer = { ...form, ref: campaign.ref }
      const cp = coupon?.code || undefined
      const res = batch
        ? await api.createBatch({ customer, items: batch.map((d) => ({ design: d })), coupon: cp })
        : await api.createOrder({ customer, design, quantity, coupon: cp })
      try {
        const { name, phone, email, delivery, source } = form
        localStorage.setItem(SAVED_KEY, JSON.stringify({ name, phone, email, delivery, source }))
      } catch {}
      setResult(res)
    } catch (err) {
      setError(err.message || 'No se pudo enviar el pedido')
    } finally {
      setSending(false)
    }
  }

  if (result?.orders) {
    const lines = result.orders.map((o) => `${o.folio} (${o.text}): ${window.location.origin}${window.location.pathname}#/presupuesto/${o.folio}/${o.token}`)
    const confirm = business.whatsapp
      ? waLink(business.whatsapp, `Hola, acabo de pedir ${result.orders.length} letreros por ${money(result.total)}:\n${lines.join('\n')}`)
      : ''
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          <div className="success">
            <span className="led big" style={{ '--led': '#22c55e' }} />
            <h2>¡{result.orders.length} letreros pedidos!</h2>
            <p className="muted">Cada uno tiene su folio y su presupuesto · total {money(result.total)}</p>
            <ul className="batch-folios">
              {result.orders.map((o) => (
                <li key={o.folio}>
                  <strong>{o.folio}</strong>
                  <span className="grow">{o.text}</span>
                  <span>{money(o.total)}</span>
                  <a href={`#/presupuesto/${o.folio}/${o.token}`} target="_blank" rel="noreferrer">Ver</a>
                </li>
              ))}
            </ul>
            {confirm && <a className="btn wa-btn" href={confirm} target="_blank" rel="noreferrer">Confirmar por WhatsApp</a>}
          </div>
        </div>
      </div>
    )
  }

  if (result) {
    const quoteUrl = `${window.location.origin}${window.location.pathname}#/presupuesto/${result.folio}/${result.token}`
    const confirm = business.whatsapp
      ? waLink(business.whatsapp, `Hola, acabo de hacer el pedido ${result.folio} por ${money(result.total)}. Mi presupuesto: ${quoteUrl}`)
      : ''
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          <div className="success">
            <span className="led big" style={{ '--led': '#22c55e' }} />
            <h2>¡Pedido recibido!</h2>
            <p className="muted">Tu folio</p>
            <div className="folio">{result.folio}</div>
            <ol className="next-steps">
              <li><b>Revisa tu presupuesto</b> y acéptalo en línea.</li>
              <li>Te contactamos para el <b>anticipo</b> y detalles finales.</li>
              <li>Fabricamos tu letrero en <b>{business.deliveryDays} días hábiles</b>.</li>
            </ol>
            <div className="row center-row">
              <a className="btn primary" href={`#/presupuesto/${result.folio}/${result.token}`}>Ver mi presupuesto</a>
              {confirm && <a className="btn wa-btn" href={confirm} target="_blank" rel="noreferrer">Confirmar por WhatsApp</a>}
            </div>
            <a className="link-btn" href={`#/seguimiento/${result.folio}`}>Seguimiento del pedido</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <form onSubmit={submit} noValidate>
          <h2>Casi listo</h2>
          <div className="modal-preview">
            <div className="modal-sign">{preview}</div>
            <div>
              {summary.map((s, i) => <span key={i} className={i ? 'muted' : ''}>{s}</span>)}
              <span className="muted">{batch ? `${batch.length} letreros distintos` : `${quantity} pieza${quantity > 1 ? 's' : ''}`}</span>
              <strong className="modal-total">{money(total + ship - off)}</strong>
              {off > 0 && <span className="small free">cupón {coupon.code}: −{money(off)}</span>}
              {ship > 0 && <span className="muted small">incluye envío {money(ship)}{business.freeShippingFrom > 0 && ` · gratis desde ${money(business.freeShippingFrom)}`}</span>}
            </div>
          </div>

          <label className="field"><span>Tu nombre o negocio *</span><input className="input" autoComplete="name" value={form.name} onChange={set('name')} /></label>
          <div className="row">
            <label className="field grow">
              <span>WhatsApp *</span>
              <input className={`input ${phoneOk ? '' : 'invalid'}`} type="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos" value={form.phone} onChange={set('phone')} />
              {!phoneOk && <em className="field-error">Escribe 10 dígitos</em>}
            </label>
            <label className="field grow"><span>Correo (opcional)</span><input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></label>
          </div>

          <div className="field">
            <span>¿Cómo lo recibes?</span>
            <div className="delivery">
              {DELIVERY_OPTIONS.map((o) => (
                <button type="button" key={o.id} className={form.delivery === o.id ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, delivery: o.id }))}>
                  <strong>{o.name}</strong>
                  <span>{o.note}{shipNote(o.id) && <b className={shipNote(o.id) === 'Gratis' ? 'free' : ''}> · {shipNote(o.id)}</b>}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <label className="field grow"><span>¿Para cuándo lo necesitas?</span><input className="input" type="date" min={today()} value={form.date} onChange={set('date')} /></label>
          </div>
          <div className="row wrap">
            <label className="field grow">
              <span>¿Cómo nos conociste?</span>
              <select className="input" value={form.source} onChange={set('source')}>
                <option value="">Elige una opción</option>
                {LEAD_SOURCES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
            <div className="field grow">
              <span>Cupón de descuento</span>
              <div className="row coupon-row">
                <input className="input grow" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCoupon(null) }} placeholder="Opcional" />
                <button type="button" className="btn ghost sm" onClick={checkCoupon} disabled={!code.trim()}>Aplicar</button>
              </div>
              {coupon && <em className="small free">✓ {coupon.label}</em>}
              {couponMsg && <em className="field-error">{couponMsg}</em>}
            </div>
          </div>
          <label className="field"><span>Notas</span><textarea className="input" rows="2" value={form.notes} onChange={set('notes')} placeholder="Dirección, horario, dudas…" /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary block" disabled={!canSend}>{sending ? 'Enviando…' : 'Enviar pedido y ver presupuesto'}</button>
          <p className="muted small center">Sin pago en línea: primero revisas y aceptas tu presupuesto. Al enviar aceptas el <a href="#/privacidad" target="_blank" rel="noreferrer">aviso de privacidad</a>.</p>
        </form>
      </div>
    </div>
  )
}
