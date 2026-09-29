import { useState } from 'react'
import Dialog from './Dialog'
import Icon from './Icon'
import { api } from '../lib/api'
import { usePublicSettings } from '../lib/settings'
import { normalizePhone } from '../lib/customer'
import { CASE_KINDS } from '../lib/business'
import { track } from '../lib/events'

const waHref = (phone, text) => {
  const d = String(phone || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}

// “Necesito ayuda”: abre un expediente con número de caso (funciona aunque el negocio no tenga WhatsApp capturado)
export default function HelpDialog({ onClose, kind = 'consulta', folio = '', context = '' }) {
  const { business } = usePublicSettings()
  const [form, setForm] = useState({ name: '', phone: '', message: context, kind, folio })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const dirty = Boolean(form.name || form.phone || (form.message && form.message !== context))
  const kinds = CASE_KINDS.filter((k) => k.id !== 'acceso')

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Escribe tu nombre'
    const ph = normalizePhone(form.phone)
    if (ph.error) errs.phone = ph.error
    if (form.message.trim().length < 5) errs.message = 'Cuéntanos en qué te ayudamos'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      setDone(await api.help(form))
      track('support_opened')
    } catch (err) {
      setErrors({ [err.field || 'form']: err.message })
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Dialog title="Recibimos tu mensaje" onClose={onClose}>
        <p>Tu número de caso es <b>{done.code}</b>. Te contestamos por WhatsApp{done.dueAt ? ` antes de ${new Date(done.dueAt).toLocaleString('es-MX', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}` : ''} (horario de atención).</p>
        {business.whatsapp && <a className="btn ghost block" href={waHref(business.whatsapp, `Hola, mi caso es ${done.code}.`)} target="_blank" rel="noreferrer"><Icon name="chat" /> Escribir por WhatsApp</a>}
        <button className="btn primary block" onClick={onClose}>Listo</button>
      </Dialog>
    )
  }
  return (
    <Dialog title="¿En qué te ayudamos?" onClose={onClose} dirty={dirty}>
      <p className="muted small">Te respondemos por WhatsApp. Si prefieres, escríbenos directo{business.whatsapp ? '' : ' desde este formulario'}.</p>
      {business.whatsapp && (
        <a className="btn ghost sm" href={waHref(business.whatsapp, form.message || 'Hola, necesito ayuda con un letrero.')} target="_blank" rel="noreferrer"><Icon name="chat" size={16} /> WhatsApp directo</a>
      )}
      <form className="help-form" onSubmit={submit} noValidate>
        <label className="field"><span>Motivo</span>
          <select className="input" value={form.kind} onChange={set('kind')}>{kinds.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select>
        </label>
        <label className="field"><span>Tu nombre</span>
          <input className={`input ${errors.name ? 'invalid' : ''}`} autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} aria-describedby="h-name" />
          {errors.name && <em id="h-name" className="field-error">{errors.name}</em>}
        </label>
        <label className="field"><span>WhatsApp</span>
          <input className={`input ${errors.phone ? 'invalid' : ''}`} type="tel" inputMode="tel" autoComplete="tel" placeholder="10 dígitos" value={form.phone} onChange={set('phone')} aria-invalid={Boolean(errors.phone)} aria-describedby="h-phone" />
          {errors.phone && <em id="h-phone" className="field-error">{errors.phone}</em>}
        </label>
        {['entrega', 'incidencia', 'garantia', 'cotizacion'].includes(form.kind) && (
          <label className="field"><span>Folio del pedido (si lo tienes)</span><input className="input" value={form.folio} onChange={set('folio')} placeholder="LT-0000" /></label>
        )}
        <label className="field"><span>Mensaje</span>
          <textarea className={`input ${errors.message ? 'invalid' : ''}`} rows="4" value={form.message} onChange={set('message')} aria-invalid={Boolean(errors.message)} aria-describedby="h-msg" />
          {errors.message && <em id="h-msg" className="field-error">{errors.message}</em>}
        </label>
        {errors.form && <p className="error">{errors.form}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Enviando…' : 'Enviar'}</button>
      </form>
    </Dialog>
  )
}
