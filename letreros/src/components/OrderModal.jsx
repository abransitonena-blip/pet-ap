import { useEffect, useRef, useState } from 'react'
import Dialog from './Dialog'
import HelpDialog from './HelpDialog'
import Icon from './Icon'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { usePublicSettings } from '../lib/settings'
import { DELIVERY_OPTIONS, addBusinessDays, customerErrors, localDate, needsAddress } from '../lib/customer'
import { deliveryCharges } from '../lib/prices'
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

const digits = (s) => (s || '').replace(/\D/g, '')
const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

export const waLink = (phone, text) => {
  const d = digits(phone)
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}

// Cómo se reciben: textos con datos reales del negocio (o aviso de que se confirman)
function deliveryNote(id, business, charges) {
  if (id === 'recoger') return [business.address, business.city].filter(Boolean).join(', ') || 'Te confirmamos dirección y horario'
  if (!charges.length) return id === 'envio' && business.shippingCost ? 'Gratis' : 'Te confirmamos el costo'
  return `+${money(charges[0].amount)}`
}

// Solicitud de cotización sin compromiso (los dos editores).
// `preview`: vista del letrero · `summary`: renglones cortos (medida, material…)
export default function OrderModal({ design, batch, quantity, total, preview, summary = [], onClose }) {
  const { business, prices, ok: priceOk } = usePublicSettings()
  const kind = (design || batch?.[0])?.kind === 'led' ? 'led' : 'impreso'
  const saved = loadCustomer()
  const { account } = useAccount()
  const [form, setForm] = useState({
    name: saved.name || '',
    phone: saved.phone || '',
    email: saved.email || '',
    delivery: saved.delivery || 'recoger',
    cp: saved.cp || '',
    address: saved.address || '',
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
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [result, setResult] = useState(null)
  const [help, setHelp] = useState(false)
  const attempt = useRef({ body: '', key: '' })
  const set = (k) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const next = { ...f, [k]: value }
      if (touched) setErrors(customerErrors(next))
      return next
    })
  }

  // Mismo cálculo que el servidor: una sola forma de recibir, cupón aparte
  const off = coupon ? Math.min(total, Math.round((total * coupon.pct) / 100) + coupon.amount) : 0
  const chargesFor = (id) => deliveryCharges(id, total, business, prices, kind)
  const charges = chargesFor(form.delivery)
  const extra = charges.reduce((a, c) => a + c.amount, 0)
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

  // Fecha deseada: desde el plazo anunciado en días hábiles, en hora local
  const earliest = addBusinessDays(localDate(), business.deliveryDays || 7)

  const submit = async (e) => {
    e.preventDefault()
    setTouched(true)
    const errs = customerErrors(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector(`[name="${Object.keys(errs)[0]}"]`)?.focus()
      return
    }
    setError('')
    setSending(true)
    const customer = { ...form, ref: campaign.ref }
    const cp = coupon?.code || undefined
    const payload = batch ? { customer, items: batch.map((d) => ({ design: d })), coupon: cp } : { customer, design, quantity, coupon: cp }
    // Reintento con los mismos datos = misma clave: el servidor no duplica la solicitud
    const body = JSON.stringify(payload)
    if (attempt.current.body !== body) attempt.current = { body, key: newKey() }
    try {
      const res = batch ? await api.createBatch(payload, attempt.current.key) : await api.createOrder(payload, attempt.current.key)
      try {
        const { name, phone, email, delivery, source, cp: zip, address } = form
        localStorage.setItem(SAVED_KEY, JSON.stringify({ name, phone, email, delivery, source, cp: zip, address }))
      } catch {}
      setResult(res)
    } catch (err) {
      setError(err.status ? err.message : 'No hubo conexión. Tu diseño sigue aquí: vuelve a intentar.')
    } finally {
      setSending(false)
    }
  }

  const fieldProps = (k) => ({
    name: k,
    className: `input ${errors[k] ? 'invalid' : ''}`,
    value: form[k],
    onChange: set(k),
    'aria-invalid': Boolean(errors[k]),
    'aria-describedby': errors[k] ? `err-${k}` : undefined
  })
  const err = (k) => errors[k] && <em id={`err-${k}`} className="field-error">{errors[k]}</em>
  const dirty = Boolean(form.notes || code !== (campaign.coupon || '') || form.address !== (saved.address || ''))

  if (help) return <HelpDialog onClose={() => setHelp(false)} kind="cotizacion" context={summary.join(' · ')} />

  if (result?.orders) {
    const lines = result.orders.map((o) => `${o.folio} (${o.text}): ${window.location.origin}${window.location.pathname}#/presupuesto/${o.folio}/${o.token}`)
    const confirm = business.whatsapp ? waLink(business.whatsapp, `Hola, acabo de solicitar ${result.orders.length} letreros por ${money(result.total)}:\n${lines.join('\n')}`) : ''
    return (
      <Dialog title={`Recibimos tu solicitud de ${result.orders.length} letreros`} onClose={onClose}>
        <div className="success">
          <span className="led big" style={{ '--led': '#22c55e' }} />
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
          {confirm && <a className="btn wa-btn" href={confirm} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>}
        </div>
      </Dialog>
    )
  }

  if (result) {
    const quoteUrl = `${window.location.origin}${window.location.pathname}#/presupuesto/${result.folio}/${result.token}`
    const confirm = business.whatsapp ? waLink(business.whatsapp, `Hola, acabo de solicitar la cotización ${result.folio} (${money(result.total)}). Mi presupuesto: ${quoteUrl}`) : ''
    return (
      <Dialog title="¡Recibimos tu solicitud!" onClose={onClose}>
        <div className="success">
          <span className="led big" style={{ '--led': '#22c55e' }} />
          <p className="muted">Tu folio (guárdalo para dar seguimiento)</p>
          <div className="folio">{result.folio}</div>
          <ol className="next-steps">
            <li><b>Revisamos tu diseño</b> y te confirmamos el presupuesto.</li>
            <li><b>Aceptas</b> tu presupuesto en línea.</li>
            <li>Confirmamos tu <b>anticipo</b> ({business.depositPct} %).</li>
            <li>Fabricamos en <b>{business.deliveryDays} días hábiles</b> desde ese momento.</li>
          </ol>
          <div className="row center-row">
            <a className="btn primary" href={`#/presupuesto/${result.folio}/${result.token}`}>Ver mi presupuesto</a>
            {confirm && <a className="btn wa-btn" href={confirm} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>}
          </div>
          <a className="link-btn" href={`#/seguimiento/${result.folio}`}>Seguimiento del pedido</a>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog title="Solicita tu cotización sin compromiso" onClose={onClose} dirty={dirty}>
      <ol className="process-strip" aria-label="Cómo funciona">
        <li><b>1</b> Revisamos tu diseño</li>
        <li><b>2</b> Aceptas el presupuesto</li>
        <li><b>3</b> Anticipo {business.depositPct} %</li>
        <li><b>4</b> Fabricamos en {business.deliveryDays} días hábiles</li>
      </ol>
      <p className="muted small">No pagas nada ahora. {business.leadTimeNote}</p>
      <form onSubmit={submit} noValidate>
        <div className="modal-preview">
          <div className="modal-sign">{preview}</div>
          <div>
            {summary.map((s, i) => <span key={i} className={i ? 'muted' : ''}>{s}</span>)}
            <span className="muted">{batch ? `${batch.length} letreros distintos` : `${quantity} pieza${quantity > 1 ? 's' : ''}`}</span>
            <strong className="modal-total">{money(total + extra - off)}</strong>
            {charges.map((c) => <span key={c.label} className="muted small">incluye {c.label.toLowerCase()} {money(c.amount)}</span>)}
            {off > 0 && <span className="small free">cupón {coupon.code}: −{money(off)}</span>}
            <span className="muted small">{priceOk ? (business.ivaIncluded ? 'IVA incluido' : `más IVA ${business.ivaRate} %`) : 'Precio estimado: lo confirmamos en tu presupuesto'}</span>
          </div>
        </div>

        <label className="field"><span>Tu nombre o negocio</span><input {...fieldProps('name')} autoComplete="name" />{err('name')}</label>
        <div className="row wrap">
          <label className="field grow">
            <span>WhatsApp (ahí te mandamos tu presupuesto)</span>
            <input {...fieldProps('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos" />
            {err('phone')}
          </label>
          <label className="field grow"><span>Correo (opcional)</span><input {...fieldProps('email')} type="email" autoComplete="email" />{err('email')}</label>
        </div>

        <fieldset className="field">
          <legend>¿Cómo lo recibes?</legend>
          <div className="delivery" role="radiogroup">
            {DELIVERY_OPTIONS.map((o) => (
              <button type="button" role="radio" aria-checked={form.delivery === o.id} key={o.id} className={form.delivery === o.id ? 'active' : ''} onClick={() => setForm((f) => ({ ...f, delivery: o.id }))}>
                <strong>{o.name}</strong>
                <span>{deliveryNote(o.id, business, chargesFor(o.id))}</span>
              </button>
            ))}
          </div>
          {form.delivery === 'recoger' && business.hours && <em className="muted small">Horario: {business.hours}</em>}
          {form.delivery === 'instalacion' && <em className="muted small">{business.installZones ? `Instalamos en: ${business.installZones}. ` : ''}El cargo se confirma con tu código postal; fuera de zona lo revisamos contigo.</em>}
        </fieldset>
        {needsAddress(form.delivery) && (
          <div className="row wrap">
            <label className="field cp-field"><span>Código postal</span><input {...fieldProps('cp')} inputMode="numeric" maxLength={5} autoComplete="postal-code" />{err('cp')}</label>
            <label className="field grow"><span>Calle, número y colonia</span><input {...fieldProps('address')} autoComplete="street-address" />{err('address')}</label>
          </div>
        )}
        <label className="field">
          <span>Fecha deseada (opcional · la confirmamos al aprobar)</span>
          <input className="input" name="date" type="date" min={earliest} value={form.date} onChange={set('date')} />
          <em className="muted small">Lo más pronto: {new Date(`${earliest}T12:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}, si apruebas y das anticipo hoy.</em>
        </label>

        <details className="optional-box">
          <summary>Más opciones (opcional): cupón, notas, cómo nos conociste</summary>
          <div className="field">
            <span>Cupón de descuento</span>
            <div className="row coupon-row">
              <input className="input grow" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setCoupon(null) }} />
              <button type="button" className="btn ghost sm" onClick={checkCoupon} disabled={!code.trim()}>Aplicar</button>
            </div>
            {coupon && <em className="small free">✓ {coupon.label}</em>}
            {couponMsg && <em className="field-error">{couponMsg}</em>}
          </div>
          <label className="field"><span>Notas</span><textarea className="input" rows="2" value={form.notes} onChange={set('notes')} placeholder="Colores, horario de entrega, dudas…" /></label>
          <label className="field">
            <span>¿Cómo nos conociste?</span>
            <select className="input" value={form.source} onChange={set('source')}>
              <option value="">Elige una opción</option>
              {LEAD_SOURCES.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        </details>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary block" disabled={sending}>{sending ? 'Enviando…' : 'Enviar solicitud'}</button>
        <p className="muted small center">
          ¿Dudas antes de enviar? <button type="button" className="link-btn" onClick={() => setHelp(true)}>Te ayudamos</button>
          {business.whatsapp && <> · <a href={waLink(business.whatsapp, 'Hola, tengo una duda sobre un letrero.')} target="_blank" rel="noreferrer"><Icon name="chat" size={13} /> WhatsApp</a></>}
          <br />Al enviar aceptas el <a href="#/privacidad" target="_blank" rel="noreferrer">aviso de privacidad</a>.
        </p>
      </form>
    </Dialog>
  )
}
