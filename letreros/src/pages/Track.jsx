import { useEffect, useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import SignPreview from '../components/SignPreview'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { STATUSES } from '../lib/status'

const FLOW = STATUSES.filter((s) => s.id !== 'cancelado')

export default function Track({ initialFolio }) {
  const [folio, setFolio] = useState(initialFolio)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const lookup = async (value) => {
    if (!value.trim()) return
    setLoading(true)
    setError('')
    try {
      setOrder(await api.track(value.trim()))
    } catch (err) {
      setOrder(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialFolio) lookup(initialFolio)
  }, [initialFolio])

  const current = order ? FLOW.findIndex((s) => s.id === order.status) : -1

  return (
    <div className="page">
      <SiteHeader active="track" />
      <div className="track">
        <h1>Consulta tu pedido</h1>
        <form className="row" onSubmit={(e) => { e.preventDefault(); lookup(folio) }}>
          <input className="input grow" placeholder="Folio, ej. LT-0001" value={folio} onChange={(e) => setFolio(e.target.value.toUpperCase())} />
          <button className="btn primary" disabled={loading}>{loading ? 'Buscando…' : 'Buscar'}</button>
        </form>
        {error && <p className="error">{error}</p>}

        {order && (
          <div className="track-card">
            <div className="track-preview"><SignPreview design={order.design} night={order.design.led?.mode !== 'none'} /></div>
            <div className="row between">
              <h2>{order.folio}</h2>
              <span className="muted">{order.quantity} pz · {money(order.total)}</span>
            </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
