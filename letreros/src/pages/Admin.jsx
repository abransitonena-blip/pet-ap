import { useCallback, useEffect, useMemo, useState } from 'react'
import SignPreview from '../components/SignPreview'
import StatusPill from '../components/StatusPill'
import { api, getToken, setToken } from '../lib/api'
import { materialById, extraById, money } from '../lib/pricing'
import { PRINTED_STATUSES, STATUSES, statusById } from '../lib/status'
import { downloadPng } from '../lib/render'

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const SECTIONS = [
  { id: 'resumen', label: 'Resumen', icon: '▦' },
  { id: 'pedidos', label: 'Pedidos', icon: '☰' },
  { id: 'cola', label: 'Cola de impresión', icon: '⎙' },
  { id: 'impresos', label: 'Impresos', icon: '✓' }
]

export default function Admin() {
  const [token, setTok] = useState(getToken)
  const logout = useCallback(() => {
    setToken(null)
    setTok(null)
  }, [])

  if (!token) return <Login onLogin={(t) => { setToken(t); setTok(t) }} />
  return <Dashboard onLogout={logout} />
}

function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await api.login(password)
      onLogin(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand"><span className="brand-mark">L</span> LetreroLab</div>
        <h1>Panel de administración</h1>
        <label className="field">
          <span>Contraseña</span>
          <input className="input" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary block" disabled={loading || !password}>{loading ? 'Entrando…' : 'Entrar'}</button>
        <a href="#/" className="muted small center">← Volver al sitio</a>
      </form>
    </div>
  )
}

function Dashboard({ onLogout }) {
  const [section, setSection] = useState('resumen')
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([api.orders(), api.stats()])
      setOrders(o)
      setStats(s)
      setError('')
    } catch (err) {
      if (err.status === 401) return onLogout()
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const handle = async (fn) => {
    try {
      await fn()
      await load()
    } catch (err) {
      if (err.status === 401) return onLogout()
      alert(err.message)
    }
  }

  const updateOrder = (id, patch) => handle(() => api.updateOrder(id, patch))
  const deleteOrder = (id) =>
    handle(async () => {
      await api.deleteOrder(id)
      setSelectedId(null)
    })

  const selected = orders.find((o) => o.id === selectedId)
  const queueCount = orders.filter((o) => ['aprobado', 'imprimiendo'].includes(o.status)).length
  const newCount = orders.filter((o) => o.status === 'nuevo').length

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="brand"><span className="brand-mark">L</span> LetreroLab</div>
        <nav>
          {SECTIONS.map((s) => (
            <button key={s.id} className={section === s.id ? 'active' : ''} onClick={() => setSection(s.id)}>
              <span className="nav-icon">{s.icon}</span>
              {s.label}
              {s.id === 'pedidos' && newCount > 0 && <span className="badge">{newCount}</span>}
              {s.id === 'cola' && queueCount > 0 && <span className="badge amber">{queueCount}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-side-foot">
          <a href="#/" target="_blank" rel="noreferrer">Ver sitio ↗</a>
          <button onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <h1>{SECTIONS.find((s) => s.id === section).label}</h1>
          <button className="btn ghost-dark" onClick={load}>↻ Actualizar</button>
        </header>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p className="muted">Cargando…</p>
        ) : (
          <>
            {section === 'resumen' && <Overview stats={stats} orders={orders} onOpen={setSelectedId} />}
            {section === 'pedidos' && <OrdersList orders={orders} onOpen={setSelectedId} />}
            {section === 'cola' && <PrintQueue orders={orders} onOpen={setSelectedId} onUpdate={updateOrder} />}
            {section === 'impresos' && <PrintedGallery orders={orders} onOpen={setSelectedId} />}
          </>
        )}
      </main>

      {selected && (
        <OrderDrawer
          key={selected.id}
          order={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateOrder(selected.id, patch)}
          onDelete={() => deleteOrder(selected.id)}
        />
      )}
    </div>
  )
}

function Overview({ stats, orders, onOpen }) {
  const pending = ['nuevo', 'en_diseno', 'aprobado'].reduce((n, s) => n + (stats.byStatus[s] || 0), 0)
  const max = Math.max(1, ...Object.values(stats.byStatus))
  const tiles = [
    { label: 'Pedidos totales', value: stats.total },
    { label: 'Por imprimir', value: pending },
    { label: 'Imprimiendo', value: stats.byStatus.imprimiendo || 0 },
    { label: 'Piezas impresas', value: stats.printedPieces },
    { label: 'm² impresos', value: stats.printedM2 },
    { label: 'Ventas', value: money(stats.revenue) }
  ]

  return (
    <>
      <div className="kpis">
        {tiles.map((t) => (
          <div className="kpi" key={t.label}>
            <span>{t.label}</span>
            <strong>{t.value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-grid">
        <section className="card-dark">
          <h2>Pedidos por estado</h2>
          <ul className="bars">
            {STATUSES.map((s) => (
              <li key={s.id}>
                <span>{s.label}</span>
                <div className="bar-track">
                  <div className="bar" style={{ width: `${((stats.byStatus[s.id] || 0) / max) * 100}%`, background: s.color }} />
                </div>
                <strong>{stats.byStatus[s.id] || 0}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="card-dark">
          <h2>Últimos pedidos</h2>
          {orders.length === 0 && <p className="muted">Aún no hay pedidos. Comparte el editor con tus clientes.</p>}
          <ul className="recent">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} onClick={() => onOpen(o.id)}>
                <div className="thumb"><SignPreview design={o.design} /></div>
                <div className="grow">
                  <strong>{o.folio}</strong>
                  <span className="muted small">{o.customer.name} · {fmtDate(o.createdAt)}</span>
                </div>
                <StatusPill status={o.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function OrdersList({ orders, onOpen }) {
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (filter !== 'todos' && o.status !== filter) return false
      if (!term) return true
      const haystack = [o.folio, o.customer.name, o.customer.phone, o.customer.email, ...o.design.lines.map((l) => l.text)]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [orders, filter, search])

  const count = (s) => orders.filter((o) => o.status === s).length

  return (
    <>
      <div className="toolbar">
        <input className="input dark" placeholder="Buscar folio, cliente o texto…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="chips dark">
          <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos · {orders.length}</button>
          {STATUSES.map((s) => (
            <button key={s.id} className={filter === s.id ? 'active' : ''} onClick={() => setFilter(s.id)}>
              <i className="dot" style={{ background: s.color }} /> {s.label} · {count(s.id)}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Diseño</th><th>Folio</th><th>Cliente</th><th>Medida / material</th><th>Cant.</th><th>Total</th><th>Estado</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} onClick={() => onOpen(o.id)}>
                <td><div className="thumb"><SignPreview design={o.design} /></div></td>
                <td><strong>{o.folio}</strong></td>
                <td>{o.customer.name}<div className="muted small">{o.customer.phone || o.customer.email}</div></td>
                <td>{o.design.widthCm}×{o.design.heightCm} cm<div className="muted small">{materialById(o.design.material).name}</div></td>
                <td>{o.quote.quantity}</td>
                <td>{money(o.quote.total)}</td>
                <td><StatusPill status={o.status} /></td>
                <td className="muted small">{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="muted empty">No hay pedidos con ese filtro.</p>}
      </div>
    </>
  )
}

function PrintQueue({ orders, onOpen, onUpdate }) {
  const columns = ['aprobado', 'imprimiendo', 'impreso'].map(statusById)
  const next = { aprobado: 'imprimiendo', imprimiendo: 'impreso' }
  return (
    <div className="kanban">
      {columns.map((col) => {
        const items = orders.filter((o) => o.status === col.id)
        return (
          <section key={col.id} className="kanban-col">
            <h2><i className="dot" style={{ background: col.color }} /> {col.label} <span className="muted">{items.length}</span></h2>
            {items.map((o) => (
              <article key={o.id} className="kanban-card">
                <div className="kanban-thumb" onClick={() => onOpen(o.id)}><SignPreview design={o.design} /></div>
                <div className="row between">
                  <strong>{o.folio}</strong>
                  <span className="muted small">{o.quote.quantity} pz · {o.design.widthCm}×{o.design.heightCm}</span>
                </div>
                <span className="muted small">{materialById(o.design.material).name}</span>
                <div className="row">
                  <button className="btn ghost-dark sm" onClick={() => downloadPng(o.design, `${o.folio}.png`, 6000)}>PNG</button>
                  {next[col.id] && (
                    <button className="btn primary sm grow" onClick={() => onUpdate(o.id, { status: next[col.id] })}>
                      {col.id === 'aprobado' ? 'Mandar a imprimir' : 'Marcar impreso'}
                    </button>
                  )}
                </div>
              </article>
            ))}
            {items.length === 0 && <p className="muted small">Vacío</p>}
          </section>
        )
      })}
    </div>
  )
}

function PrintedGallery({ orders, onOpen }) {
  const printed = orders
    .filter((o) => PRINTED_STATUSES.includes(o.status))
    .sort((a, b) => (b.printedAt || b.updatedAt).localeCompare(a.printedAt || a.updatedAt))

  if (printed.length === 0) return <p className="muted">Todavía no hay letreros impresos.</p>
  return (
    <div className="gallery">
      {printed.map((o) => (
        <figure key={o.id} className="gallery-item" onClick={() => onOpen(o.id)}>
          <div className="gallery-thumb"><SignPreview design={o.design} /></div>
          <figcaption>
            <div className="row between">
              <strong>{o.folio}</strong>
              <StatusPill status={o.status} />
            </div>
            <span className="muted small">{o.customer.name} · {o.quote.quantity} pz · {o.design.widthCm}×{o.design.heightCm} cm</span>
            <span className="muted small">Impreso: {fmtDate(o.printedAt || o.updatedAt)}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function OrderDrawer({ order, onClose, onUpdate, onDelete }) {
  const [notes, setNotes] = useState(order.adminNotes || '')
  const [exporting, setExporting] = useState(false)
  const d = order.design
  const phoneDigits = (order.customer.phone || '').replace(/\D/g, '')

  const exportPng = async () => {
    setExporting(true)
    try {
      await downloadPng(d, `${order.folio}.png`, 6000)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>{order.folio}</h2>
            <span className="muted small">Creado {fmtDate(order.createdAt)}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="drawer-preview"><SignPreview design={d} /></div>
        <div className="row">
          <button className="btn primary grow" onClick={exportPng} disabled={exporting}>
            {exporting ? 'Generando…' : '⬇ Descargar para imprimir (PNG)'}
          </button>
        </div>

        <section>
          <h3>Estado</h3>
          <div className="status-steps">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                className={order.status === s.id ? 'active' : ''}
                style={order.status === s.id ? { background: s.color, borderColor: s.color } : undefined}
                onClick={() => onUpdate({ status: s.id })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className="spec-grid">
          <div><span>Medida</span><strong>{d.widthCm} × {d.heightCm} cm</strong></div>
          <div><span>Material</span><strong>{materialById(d.material).name}</strong></div>
          <div><span>Cantidad</span><strong>{order.quote.quantity}</strong></div>
          <div><span>Área total</span><strong>{Math.round(order.quote.areaM2 * order.quote.quantity * 100) / 100} m²</strong></div>
          <div className="wide"><span>Extras</span><strong>{d.extras.map((e) => extraById(e)?.name).filter(Boolean).join(', ') || '—'}</strong></div>
          <div className="wide"><span>Textos</span><strong>{d.lines.map((l) => `${l.text} (${l.font})`).join(' · ')}</strong></div>
        </section>

        <section>
          <h3>Cliente</h3>
          <p><strong>{order.customer.name}</strong></p>
          {order.customer.phone && (
            <p>
              <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
              {phoneDigits && <> · <a href={`https://wa.me/${phoneDigits.length === 10 ? '52' + phoneDigits : phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp</a></>}
            </p>
          )}
          {order.customer.email && <p><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a></p>}
          {order.customer.notes && <p className="note">{order.customer.notes}</p>}
        </section>

        <section>
          <h3>Cotización</h3>
          <ul className="quote-lines dark">
            {order.quote.lines.map((l, i) => <li key={i}><span>{l.label}</span><span>{money(l.amount)}</span></li>)}
            {order.quote.discount > 0 && <li><span>Descuento</span><span>−{money(order.quote.discount)}</span></li>}
            <li className="total-line"><span>Total</span><span>{money(order.quote.total)}</span></li>
          </ul>
        </section>

        <section>
          <h3>Notas internas</h3>
          <textarea className="input dark" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Solo visibles para el equipo…" />
          <button className="btn ghost-dark sm" disabled={notes === (order.adminNotes || '')} onClick={() => onUpdate({ adminNotes: notes })}>
            Guardar notas
          </button>
        </section>

        <section>
          <h3>Historial</h3>
          <ol className="timeline">
            {[...order.history].reverse().map((h, i) => (
              <li key={i}>
                <i className="dot" style={{ background: statusById(h.status).color }} />
                <span>{statusById(h.status).label}</span>
                <span className="muted small">{fmtDate(h.at)}</span>
              </li>
            ))}
          </ol>
        </section>

        <button className="btn danger-outline" onClick={() => confirm(`¿Eliminar el pedido ${order.folio}? No se puede deshacer.`) && onDelete()}>
          Eliminar pedido
        </button>
      </aside>
    </div>
  )
}
