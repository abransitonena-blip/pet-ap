import { useState } from 'react'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { usePublicSettings } from '../lib/settings'
import { DELIVERY_OPTIONS } from '../lib/customer'
import { shippingFor } from '../lib/prices'

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
export default function OrderModal({ design, quantity, total, preview, summary = [], onClose }) {
  const { business } = usePublicSettings()
  const saved = loadCustomer()
  const [form, setForm] = useState({
    name: saved.name || '',
    phone: saved.phone || '',
    email: saved.email || '',
    delivery: saved.delivery || 'recoger',
    date: '',
    notes: ''
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const ship = shippingFor(form.delivery, total, business)
  const shipNote = (id) =>
    id !== 'envio' ? null : shippingFor('envio', total, business) ? `+${money(business.shippingCost)}` : business.shippingCost ? 'Gratis' : null
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const phoneOk = !form.phone || digits(form.phone).length >= 10
  const canSend = form.name.trim() && (form.phone || form.email) && phoneOk && !sending

  const submit = async (e) => {
    e.preventDefault()
    if (!canSend) return
    setError('')
    setSending(true)
    try {
      const res = await api.createOrder({ customer: form, design, quantity })
      try {
        const { name, phone, email, delivery } = form
        localStorage.setItem(SAVED_KEY, JSON.stringify({ name, phone, email, delivery }))
      } catch {}
      setResult(res)
    } catch (err) {
      setError(err.message || 'No se pudo enviar el pedido')
    } finally {
      setSending(false)
    }
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
              <span className="muted">{quantity} pieza{quantity > 1 ? 's' : ''}</span>
              <strong className="modal-total">{money(total + ship)}</strong>
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
          <label className="field"><span>Notas</span><textarea className="input" rows="2" value={form.notes} onChange={set('notes')} placeholder="Dirección, horario, dudas…" /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary block" disabled={!canSend}>{sending ? 'Enviando…' : 'Enviar pedido y ver presupuesto'}</button>
          <p className="muted small center">Sin pago en línea: primero revisas y aceptas tu presupuesto.</p>
        </form>
      </div>
    </div>
  )
}
