import { useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import DesignPreview from '../components/DesignPreview'
import HelpDialog from '../components/HelpDialog'
import Icon from '../components/Icon'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { STATUSES } from '../lib/status'
import { usePublicSettings } from '../lib/settings'

const FLOW = STATUSES.filter((s) => s.id !== 'cancelado')
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

// Seguimiento: folio + últimos 4 dígitos del WhatsApp (el folio consecutivo solo no abre pedidos ajenos)
export default function Track({ initialFolio }) {
  const { business } = usePublicSettings()
  const [folio, setFolio] = useState(initialFolio)
  const [tel, setTel] = useState('')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [help, setHelp] = useState(false)

  const lookup = async (e) => {
    e.preventDefault()
    if (!folio.trim() || tel.replace(/\D/g, '').length !== 4) return setError('Escribe el folio y los últimos 4 dígitos de tu WhatsApp')
    setLoading(true)
    setError('')
    try {
      setOrder(await api.track(folio.trim(), tel))
    } catch (err) {
      setOrder(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const current = order ? FLOW.findIndex((s) => s.id === order.status) : -1
  return (
    <div className="page">
      <SiteHeader active="track" />
      <div className="track">
        <h1>Consulta tu pedido</h1>
        <p className="muted small">Tu folio (LT-0000) aparece al enviar tu solicitud, en tu presupuesto y en el mensaje de WhatsApp que te mandamos. Si tienes cuenta, tus pedidos están en <a href="#/cuenta">Mi cuenta</a>.</p>
        <form className="track-form" onSubmit={lookup} noValidate>
          <label className="field"><span>Folio</span><input className="input" placeholder="LT-0001" value={folio} onChange={(e) => setFolio(e.target.value.toUpperCase())} autoCapitalize="characters" /></label>
          <label className="field"><span>Últimos 4 dígitos de tu WhatsApp</span><input className="input" inputMode="numeric" maxLength={4} placeholder="5678" value={tel} onChange={(e) => setTel(e.target.value.replace(/\D/g, ''))} /></label>
          <button className="btn primary" disabled={loading}>{loading ? 'Buscando…' : 'Buscar'}</button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        <p className="small">¿Perdiste tu folio o algo no cuadra? <button className="link-btn" onClick={() => setHelp(true)}>Pide ayuda</button></p>

        {order && (
          <div className="track-card">
            <div className="track-preview"><DesignPreview design={order.design} night={order.design.kind === 'led' || order.design.led?.mode !== 'none'} animate /></div>
            <div className="row between">
              <h2>{order.folio}</h2>
              <span className="muted">{order.quantity} pz · {money(order.total)}</span>
            </div>
            <p className="next-step-note"><Icon name="next" size={16} /> <b>Siguiente paso:</b> {order.next}</p>
            {order.updatedAt && <p className="muted small">Última actualización: {fmt(order.updatedAt)}</p>}
            {order.status === 'cancelado' ? (
              <p className="error">Este pedido fue cancelado. Contáctanos si tienes dudas.</p>
            ) : (
              <ol className="stepper-track">
                {FLOW.map((s, i) => (
                  <li key={s.id} className={i < current ? 'done' : i === current ? 'current' : ''}>
                    <span className="step-dot">{i < current ? '✓' : i + 1}</span>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="row wrap">
              <button className="btn ghost sm" onClick={() => setHelp(true)}><Icon name="chat" size={16} /> Tengo un problema con este pedido</button>
            </div>
          </div>
        )}
      </div>
      <SiteFooter business={business} />
      {help && <HelpDialog onClose={() => setHelp(false)} kind={order ? 'entrega' : 'consulta'} folio={order?.folio || folio} />}
    </div>
  )
}
