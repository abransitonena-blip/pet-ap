import { useCallback, useEffect, useMemo, useState } from 'react'
import DesignPreview from '../components/DesignPreview'
import { Brand } from '../components/ApLogo'
import { deliveryName } from '../lib/customer'
import { Business, Clients, Prices, QuoteEditor, QuotePill, Quotes, Team } from './AdminSections'
import StatusPill from '../components/StatusPill'
import TechDiagram from '../components/TechDiagram'
import LedDiagram from '../components/LedDiagram'
import { ANIMATIONS, DOT_STYLES, POWER, boardMaterialById, ledColorById, planPower } from '../lib/ledSign'
import { api, getToken, setToken } from '../lib/api'
import { LED_MODES } from '../lib/design'
import { materialById, extraById, ledSpec, money } from '../lib/pricing'
import { PRINTED_STATUSES, STATUSES, statusById } from '../lib/status'
import { downloadDesignPng, downloadDiagramSvg, downloadDxf, downloadGcode, downloadPointsCsv, downloadSignSvg, printDiagram, printSheets } from '../lib/files'
import { PAPERS, planTiles } from '../lib/production'
import { ledPointsMm } from '../lib/ledPoints'

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const ledName = (d) =>
  d.kind === 'led' ? `Puntos LED · ${d.dots.length}` : LED_MODES.find((m) => m.id === d.led?.mode)?.name || 'Sin luz'
const NEXT = { nuevo: 'en_diseno', en_diseno: 'aprobado', aprobado: 'imprimiendo', imprimiendo: 'impreso', impreso: 'entregado' }
const waLink = (phone, text = '') => {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits.length === 10 ? '52' + digits : digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
const kindName = (d) => (d.kind === 'led' ? 'LED' : 'Impreso')

function exportCsv(orders) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [['folio', 'fecha', 'estado', 'tipo', 'cliente', 'telefono', 'correo', 'texto', 'medida_cm', 'cantidad', 'total']]
  for (const o of orders) {
    rows.push([
      o.folio, o.createdAt.slice(0, 10), statusById(o.status).label, kindName(o.design), o.customer.name, o.customer.phone,
      o.customer.email, o.design.lines.map((l) => l.text || (l.icon ? `[${l.icon}]` : '')).filter(Boolean).join(' / '), `${o.design.widthCm}x${o.design.heightCm}`, o.quote.quantity, o.totals?.total ?? ''
    ])
  }
  const blob = new Blob(['\ufeff' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// Pedidos por día (últimos 14 días): barras con tooltip
function Activity({ orders }) {
  const [hover, setHover] = useState(-1)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - 13 + i)
    return d
  })
  const data = days.map((d) => {
    const key = d.toDateString()
    const list = orders.filter((o) => new Date(o.createdAt).toDateString() === key && o.status !== 'cancelado')
    return { d, n: list.length, total: list.reduce((a, o) => a + (o.totals?.total ?? o.quote.total), 0) }
  })
  const max = Math.max(1, ...data.map((x) => x.n))
  const h = hover >= 0 ? data[hover] : null
  const total = data.reduce((a, x) => a + x.n, 0)
  return (
    <div className="activity">
      <div className="activity-head">
        <span>{h ? h.d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Últimos 14 días'}</span>
        <strong>{h ? `${h.n} pedido${h.n === 1 ? '' : 's'} · ${money(h.total)}` : `${total} pedidos · ${money(data.reduce((a, x) => a + x.total, 0))}`}</strong>
      </div>
      <div className="bars-chart" onMouseLeave={() => setHover(-1)} role="img" aria-label={`Pedidos por día, últimos 14 días: ${total} en total`}>
        <span className="y-max">{max}</span>
        {data.map((x, i) => (
          <div key={i} className={`day ${hover === i ? 'on' : ''} ${hover >= 0 && hover !== i ? 'dim' : ''}`} onMouseEnter={() => setHover(i)}>
            <div className="bar-col">
              {x.n > 0 && <div className="bar" style={{ height: `${(x.n / max) * 100}%` }} />}
            </div>
            <span className="x">{i % 2 === 1 || i === 13 ? x.d.getDate() : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const materialName = (d) => (d.kind === 'led' ? boardMaterialById(d.material).name : materialById(d.material).name)

// Cada sección exige al menos uno de estos permisos
const SECTIONS = [
  { id: 'resumen', label: 'Resumen', perms: [] },
  { id: 'pedidos', label: 'Pedidos', perms: ['pedidos'] },
  { id: 'presupuestos', label: 'Presupuestos', perms: ['presupuestos'] },
  { id: 'produccion', label: 'Producción', perms: ['produccion', 'editar'] },
  { id: 'impresos', label: 'Terminados', perms: ['pedidos', 'produccion'] },
  { id: 'archivos', label: 'Archivos', perms: ['produccion'] },
  { id: 'clientes', label: 'Clientes', perms: ['pedidos'] },
  { id: 'precios', label: 'Precios', perms: ['precios'], group: 'Configuración' },
  { id: 'equipo', label: 'Equipo', perms: ['equipo'] },
  { id: 'ajustes', label: 'Negocio', perms: ['ajustes'] }
]
const ORDER_PERMS = ['pedidos', 'produccion', 'presupuestos']

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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { token } = await api.login(username, password)
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
        <Brand sub="admin" />
        <h1>Entrar al panel</h1>
        <input className="input" placeholder="Usuario (vacío = dueño)" autoFocus autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
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
  const [online, setOnline] = useState(true)
  const [selected, setSelected] = useState(null) // { id, tab }
  const [me, setMe] = useState(null)
  const [settings, setSettings] = useState(null)
  const can = useCallback((...perms) => !!me && perms.some((p) => me.perms.includes(p)), [me])

  const load = useCallback(async () => {
    try {
      const user = await api.me()
      const canOrders = ORDER_PERMS.some((p) => user.perms.includes(p))
      const [o, s, st] = await Promise.all([canOrders ? api.orders() : [], api.stats(), api.settings()])
      setMe(user)
      setOrders(o)
      setStats(s)
      setSettings(st)
      setOnline(true)
    } catch (err) {
      if (err.status === 401) return onLogout()
      setOnline(false)
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
      setSelected(null)
    })
  const open = (id, tab = 'detalle') => setSelected({ id, tab })

  const current = selected && orders.find((o) => o.id === selected.id)
  const counts = {
    pedidos: orders.filter((o) => o.status === 'nuevo').length,
    presupuestos: orders.filter((o) => o.quoteState === 'pendiente').length,
    produccion: orders.filter((o) => ['aprobado', 'imprimiendo'].includes(o.status)).length
  }
  const sections = SECTIONS.filter((s) => !s.perms.length || can(...s.perms))
  const active = sections.find((s) => s.id === section) || sections[0]

  return (
    <div className="admin">
      <aside className="admin-side">
        <Brand sub="admin" />
        <nav>
          {sections.map((s) => (
            <div key={s.id} className="nav-item">
              {s.group && <span className="nav-group">{s.group}</span>}
              <button className={active?.id === s.id ? 'active' : ''} onClick={() => setSection(s.id)}>
                {s.label}
                {counts[s.id] > 0 && <span className="count">{counts[s.id]}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="admin-side-foot">
          <span className="status small">
            <span className={`led ${online ? '' : 'blink'}`} style={{ '--led': online ? '#22c55e' : '#ef4444' }} />
            {online ? 'En línea' : 'Sin conexión'}
          </span>
          {me && <span className="me-chip"><span className="avatar sm">{me.name.slice(0, 1)}</span>{me.name}</span>}
          <a href="#/" target="_blank" rel="noreferrer">Ver sitio ↗</a>
          <button onClick={onLogout}>Salir</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-top">
          <h1>{active?.label}</h1>
          <button className="btn ghost sm" onClick={load}>Actualizar</button>
        </header>
        {loading || !me ? (
          <p className="muted">Cargando…</p>
        ) : (
          <>
            {active.id === 'resumen' && <Overview stats={stats} orders={orders} onOpen={open} showMoney={can('ventas')} />}
            {active.id === 'pedidos' && <OrdersList orders={orders} onOpen={open} onUpdate={updateOrder} can={can} />}
            {active.id === 'presupuestos' && <Quotes orders={orders} onOpen={open} onUpdate={updateOrder} />}
            {active.id === 'produccion' && <Production orders={orders} onOpen={open} onUpdate={updateOrder} />}
            {active.id === 'impresos' && <PrintedGallery orders={orders} onOpen={open} />}
            {active.id === 'archivos' && <Files orders={orders} onOpen={open} />}
            {active.id === 'clientes' && <Clients orders={orders} onOpen={open} showMoney={can('ventas')} />}
            {active.id === 'precios' && <Prices settings={settings} onSaved={setSettings} />}
            {active.id === 'equipo' && <Team me={me} />}
            {active.id === 'ajustes' && <Business settings={settings} onSaved={setSettings} />}
          </>
        )}
      </main>

      {current && (
        <OrderDrawer
          key={current.id}
          order={current}
          tab={selected.tab}
          setTab={(tab) => setSelected((s) => ({ ...s, tab }))}
          onClose={() => setSelected(null)}
          onUpdate={(patch) => updateOrder(current.id, patch)}
          onUpdateAny={updateOrder}
          onDelete={() => deleteOrder(current.id)}
          can={can}
          business={settings?.business}
        />
      )}
    </div>
  )
}

function Overview({ stats, orders, onOpen, showMoney }) {
  const pending = ['nuevo', 'en_diseno', 'aprobado'].reduce((n, s) => n + (stats.byStatus[s] || 0), 0)
  const active = orders.filter((o) => o.status !== 'cancelado')
  const ticket = active.length ? Math.round(stats.revenue / active.length) : 0
  const ledToBuild = orders
    .filter((o) => o.design.kind === 'led' && ['nuevo', 'en_diseno', 'aprobado', 'imprimiendo'].includes(o.status))
    .reduce((a, o) => a + o.design.dots.length * o.quote.quantity, 0)
  const tiles = [
    { label: 'Pedidos', value: stats.total },
    { label: 'Por producir', value: pending },
    { label: 'En producción', value: stats.byStatus.imprimiendo || 0 },
    { label: 'LED por armar', value: ledToBuild.toLocaleString('es-MX') },
    ...(showMoney ? [{ label: 'Ticket promedio', value: money(ticket) }, { label: 'Ventas', value: money(stats.revenue) }] : []),
    { label: 'Presupuestos aceptados', value: stats.quotes?.aceptada ?? 0 }
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
      {orders.length > 0 && (
        <section className="card activity-card">
          <h2>Actividad</h2>
          <Activity orders={orders} />
        </section>
      )}
      <div className="admin-grid">
        <section className="card">
          <h2>Estados</h2>
          <ul className="led-board">
            {STATUSES.map((s) => {
              const n = stats.byStatus[s.id] || 0
              return (
                <li key={s.id} className={n ? '' : 'off'}>
                  <span className={`led ${s.id === 'imprimiendo' && n ? 'blink' : ''}`} style={{ '--led': s.color }} data-off={!n || undefined} />
                  <span className="grow">{s.label}</span>
                  <strong>{n}</strong>
                </li>
              )
            })}
          </ul>
        </section>
        <section className="card">
          <h2>Últimos pedidos</h2>
          {orders.length === 0 && <p className="muted">Aún no hay pedidos.</p>}
          <ul className="recent">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} onClick={() => onOpen(o.id)}>
                <div className="thumb"><DesignPreview design={o.design} /></div>
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

function OrdersList({ orders, onOpen, onUpdate, can }) {
  const [filter, setFilter] = useState('todos')
  const [kind, setKind] = useState('todos')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (filter !== 'todos' && o.status !== filter) return false
      if (kind !== 'todos' && (o.design.kind === 'led' ? 'led' : 'impreso') !== kind) return false
      if (!term) return true
      return [o.folio, o.customer.name, o.customer.phone, o.customer.email, ...o.design.lines.map((l) => l.text)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [orders, filter, kind, search])

  return (
    <>
      <div className="toolbar">
        <div className="row wrap">
          <input className="input search" placeholder="Buscar folio, cliente o texto…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="switch small">
            {[['todos', 'Todos'], ['led', 'LED'], ['impreso', 'Impreso']].map(([id, label]) => (
              <button key={id} className={kind === id ? 'active' : ''} onClick={() => setKind(id)}>{label}</button>
            ))}
          </div>
          <button className="btn ghost sm push" onClick={() => exportCsv(filtered)}>Exportar CSV</button>
        </div>
        <div className="chips">
          <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos {orders.length}</button>
          {STATUSES.map((s) => (
            <button key={s.id} className={filter === s.id ? 'active' : ''} onClick={() => setFilter(s.id)}>
              <span className="led sm" style={{ '--led': s.color }} /> {s.label} {orders.filter((o) => o.status === s.id).length}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="orders-table">
          <thead>
            <tr><th>Diseño</th><th>Folio</th><th>Cliente</th><th>Medida</th><th>Tipo</th><th>Cant.</th><th>Total</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} onClick={() => onOpen(o.id)}>
                <td><div className="thumb"><DesignPreview design={o.design} /></div></td>
                <td><strong>{o.folio}</strong><div className="muted small">{fmtDate(o.createdAt)}</div></td>
                <td>{o.customer.name}<div className="muted small">{o.customer.phone || o.customer.email}</div></td>
                <td>{o.design.widthCm}×{o.design.heightCm}<div className="muted small">{materialName(o.design)}</div></td>
                <td className="small"><span className={`kind ${o.design.kind === 'led' ? 'led-kind' : ''}`}>{kindName(o.design)}</span><div className="muted small">{ledName(o.design)}</div></td>
                <td>{o.quote.quantity}</td>
                <td>{o.totals ? money(o.totals.total) : '—'}{o.quoteState === 'aceptada' && <div className="small ok-text">aceptado</div>}</td>
                <td><StatusPill status={o.status} /></td>
                <td className="actions" onClick={(e) => e.stopPropagation()}>
                  {waLink(o.customer.phone) && (
                    <a className="icon-btn wa" href={waLink(o.customer.phone, `Hola ${o.customer.name}, te escribimos de AP sobre tu pedido ${o.folio}.`)} target="_blank" rel="noreferrer" title="WhatsApp">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.7-4.4A8.5 8.5 0 1 1 8 20z" /><path d="M9 9.5c.3 2 2.4 4.2 4.5 4.6l1.2-1.2 2 .9c-.2 1.3-1.3 2-2.4 1.9C10.8 15.3 8.4 12.8 8 9.6 8 8.5 8.7 7.4 10 7.2l.9 2z" /></svg>
                    </a>
                  )}
                  {NEXT[o.status] && can('editar', 'produccion') && (
                    <button className="btn ghost sm" onClick={() => onUpdate(o.id, { status: NEXT[o.status] })} title="Avanzar al siguiente estado">
                      {statusById(NEXT[o.status]).label} →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="muted empty">Sin resultados.</p>}
      </div>
    </>
  )
}

function Production({ orders, onOpen, onUpdate }) {
  const columns = ['aprobado', 'imprimiendo', 'impreso'].map(statusById)
  const next = { aprobado: 'imprimiendo', imprimiendo: 'impreso' }
  return (
    <div className="kanban">
      {columns.map((col) => {
        const items = orders.filter((o) => o.status === col.id)
        return (
          <section key={col.id} className="kanban-col">
            <h2>
              <span className={`led ${col.id === 'imprimiendo' && items.length ? 'blink' : ''}`} style={{ '--led': col.color }} data-off={!items.length || undefined} />
              {col.label} <span className="muted">{items.length}</span>
            </h2>
            {items.map((o) => (
              <article key={o.id} className="kanban-card">
                <div className="kanban-thumb" onClick={() => onOpen(o.id)}><DesignPreview design={o.design} /></div>
                <div className="row between">
                  <strong>{o.folio}</strong>
                  <span className="muted small">{o.quote.quantity} pz · {o.design.widthCm}×{o.design.heightCm}</span>
                </div>
                <span className="muted small">{materialName(o.design)} · {ledName(o.design)}</span>
                <div className="row">
                  <button className="btn ghost sm" onClick={() => onOpen(o.id, 'diagrama')}>Diagrama</button>
                  {next[col.id] && (
                    <button className="btn primary sm grow" onClick={() => onUpdate(o.id, { status: next[col.id] })}>
                      {col.id === 'aprobado' ? 'Imprimir' : 'Listo'}
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
          <div className="gallery-thumb"><DesignPreview design={o.design} night /></div>
          <figcaption>
            <div className="row between">
              <strong>{o.folio}</strong>
              <StatusPill status={o.status} />
            </div>
            <span className="muted small">{o.customer.name} · {o.quote.quantity} pz · {o.design.widthCm}×{o.design.heightCm} cm</span>
            <span className="muted small">Impreso {fmtDate(o.printedAt || o.updatedAt)}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

const PAPER_KEY = 'letreros_paper'
function usePaper() {
  const [paper, setPaper] = useState(() => {
    try {
      return localStorage.getItem(PAPER_KEY) || 'carta'
    } catch {
      return 'carta'
    }
  })
  const change = (id) => {
    setPaper(id)
    try {
      localStorage.setItem(PAPER_KEY, id)
    } catch {}
  }
  return [paper, change]
}

function FileButtons({ order }) {
  const [busy, setBusy] = useState('')
  const [paper, setPaper] = usePaper()
  const plan = planTiles(order.design, paper)
  const points = ledPointsMm(order.design).length
  const run = (key, fn) => async () => {
    setBusy(key)
    try {
      await fn()
    } finally {
      setBusy('')
    }
  }
  return (
    <div className="file-groups">
      <div className="file-buttons">
        <button className="file" onClick={run('png', () => downloadDesignPng(order.design, `${order.folio}.png`, 6000))} disabled={!!busy}>
          <b>PNG</b><span>{busy === 'png' ? 'Generando…' : 'Impresión 6000 px'}</span>
        </button>
        <button className="file" onClick={run('svg', () => downloadSignSvg(order.design, `${order.folio}.svg`))} disabled={!!busy}>
          <b>SVG</b><span>Vector a escala</span>
        </button>
        <button className="file" onClick={run('dia', () => downloadDiagramSvg(order))} disabled={!!busy}>
          <b>DIAGRAMA</b><span>Plano técnico SVG</span>
        </button>
        <button className="file" onClick={() => printDiagram(order)}>
          <b>PDF</b><span>Imprimir diagrama</span>
        </button>
      </div>
      <div className="file-buttons production">
        <label className="file paper">
          <b>HOJAS 1:1</b>
          <select value={paper} onChange={(e) => setPaper(e.target.value)} onClick={(e) => e.stopPropagation()}>
            {PAPERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <button className="file accent" onClick={run('hojas', () => printSheets(order, paper))} disabled={!!busy}>
          <b>IMPRIMIR {plan.count} HOJA{plan.count > 1 ? 'S' : ''}</b>
          <span>{plan.cols}×{plan.rows} · {points ? `${points} puntos LED` : 'con marcas'}</span>
        </button>
        <button className="file" onClick={() => downloadDxf(order)}>
          <b>DXF</b><span>Contorno + puntos</span>
        </button>
        <button className="file" onClick={() => downloadGcode(order)}>
          <b>G-CODE</b><span>Láser GRBL · Arduino</span>
        </button>
        {points > 0 && (
          <button className="file" onClick={() => downloadPointsCsv(order)}>
            <b>PUNTOS</b><span>Coordenadas CSV</span>
          </button>
        )}
      </div>
    </div>
  )
}

function Files({ orders, onOpen }) {
  const [search, setSearch] = useState('')
  const term = search.trim().toLowerCase()
  const list = orders.filter((o) => !term || `${o.folio} ${o.customer.name}`.toLowerCase().includes(term))
  if (orders.length === 0) return <p className="muted">No hay archivos todavía.</p>
  return (
    <>
      <div className="toolbar">
        <input className="input" placeholder="Buscar folio o cliente…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="files-list">
        {list.map((o) => (
          <article key={o.id} className="file-row">
            <div className="file-thumb" onClick={() => onOpen(o.id, 'diagrama')}><DesignPreview design={o.design} /></div>
            <div className="file-meta">
              <strong>{o.folio}</strong>
              <span className="muted small">{o.customer.name} · {o.design.widthCm}×{o.design.heightCm} cm · {ledName(o.design)}</span>
              <StatusPill status={o.status} />
            </div>
            <FileButtons order={o} />
          </article>
        ))}
      </div>
    </>
  )
}

function OrderDrawer({ order, tab, setTab, onClose, onUpdate, onUpdateAny, onDelete, can, business }) {
  const [notes, setNotes] = useState(order.adminNotes || '')
  const d = order.design
  const led = ledSpec(d)
  const phoneDigits = (order.customer.phone || '').replace(/\D/g, '')

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className={`drawer ${tab === 'diagrama' ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>{order.folio}</h2>
            <StatusPill status={order.status} />
          </div>
          <div className="switch small">
            <button className={tab === 'detalle' ? 'active' : ''} onClick={() => setTab('detalle')}>Detalle</button>
            {can('presupuestos', 'ventas') && order.totals && (
              <button className={tab === 'presupuesto' ? 'active' : ''} onClick={() => setTab('presupuesto')}>Presupuesto</button>
            )}
            {can('produccion') && <button className={tab === 'diagrama' ? 'active' : ''} onClick={() => setTab('diagrama')}>Diagrama</button>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        {tab === 'diagrama' && can('produccion') ? (
          <>
            <div className="diagram-frame">{d.kind === 'led' ? <LedDiagram order={order} /> : <TechDiagram order={order} />}</div>
            <FileButtons order={order} />
          </>
        ) : tab === 'presupuesto' && order.totals && business ? (
          <>
            <div className="row between">
              <QuotePill state={order.quoteState} />
              <span className="muted small">Válido hasta {new Date(order.validUntil).toLocaleDateString('es-MX')}</span>
            </div>
            <QuoteEditor order={order} business={business} onUpdate={onUpdateAny} canEdit={can('presupuestos')} />
          </>
        ) : (
          <>
            <div className="drawer-preview"><DesignPreview design={d} night={d.kind === 'led' || d.led?.mode !== 'none'} animate withMount /></div>
            {can('produccion') && <FileButtons order={order} />}

            <div className="drawer-actions">
              {NEXT[order.status] && can('editar', 'produccion') && (
                <button className="btn primary grow" onClick={() => onUpdate({ status: NEXT[order.status] })}>
                  Avanzar a {statusById(NEXT[order.status]).label} →
                </button>
              )}
              {waLink(order.customer.phone) && (
                <a className="btn ghost" href={waLink(order.customer.phone, `Hola ${order.customer.name}, tu pedido ${order.folio} de AP está: ${statusById(order.status).label}.`)} target="_blank" rel="noreferrer">
                  Avisar por WhatsApp
                </a>
              )}
            </div>

            <section>
              <h3>Estado</h3>
              <div className="status-steps">
                {STATUSES.map((s) => (
                  <button key={s.id} className={order.status === s.id ? 'active' : ''} disabled={!can('editar', 'produccion')} onClick={() => onUpdate({ status: s.id })}>
                    <span className="led sm" style={{ '--led': s.color }} data-off={order.status !== s.id || undefined} />
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {d.kind === 'led' ? <LedSpecs order={order} /> : (
            <section className="spec-grid">
                <div><span>Medida</span><strong>{d.widthCm} × {d.heightCm} cm</strong></div>
                <div><span>Material</span><strong>{materialById(d.material).name}</strong></div>
                <div><span>Cantidad</span><strong>{order.quote.quantity}</strong></div>
                <div><span>Área total</span><strong>{Math.round(order.quote.areaM2 * order.quote.quantity * 100) / 100} m²</strong></div>
                <div><span>Iluminación</span><strong>{ledName(d)}</strong></div>
                <div><span>LED</span><strong>{led ? `${led.quantity} · ${led.watts} W` : '—'}</strong></div>
                <div className="wide">
                  <span>Colores</span>
                  <strong className="row">
                    {['bg', 'text', 'accent'].map((k) => (
                      <span key={k} className="hex"><i style={{ background: d.colors[k] }} />{d.colors[k].toUpperCase()}</span>
                    ))}
                  </strong>
                </div>
                <div className="wide"><span>Extras</span><strong>{d.extras.map((e) => extraById(e)?.name).filter(Boolean).join(', ') || '—'}</strong></div>
              </section>
            )}

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
              {(order.customer.delivery || order.customer.date) && (
                <p className="small">
                  Entrega: <b>{deliveryName(order.customer.delivery)}</b>
                  {order.customer.date && <> · para el <b>{new Date(order.customer.date + 'T12:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</b></>}
                </p>
              )}
              {order.customer.notes && <p className="note">{order.customer.notes}</p>}
            </section>

            {order.totals && (
              <section>
                <h3>Presupuesto · <QuotePill state={order.quoteState} /></h3>
                <ul className="quote-lines">
                  <li><span>Total ({order.totals.ivaIncluded ? 'IVA incluido' : `+ IVA ${order.totals.ivaRate} %`})</span><span>{money(order.totals.total)}</span></li>
                  <li><span>Anticipo {order.totals.depositPct} %</span><span>{money(order.totals.deposit)}</span></li>
                </ul>
                {can('presupuestos', 'ventas') && <button className="link-btn" onClick={() => setTab('presupuesto')}>Ver y ajustar presupuesto →</button>}
              </section>
            )}

            <section>
              <h3>Notas internas</h3>
              <textarea className="input" rows="3" value={notes} disabled={!can('editar', 'produccion')} onChange={(e) => setNotes(e.target.value)} placeholder="Solo visibles para el equipo…" />
              {can('editar', 'produccion') && <button className="btn ghost sm" disabled={notes === (order.adminNotes || '')} onClick={() => onUpdate({ adminNotes: notes })}>Guardar</button>}
            </section>

            <section>
              <h3>Historial</h3>
              <ol className="timeline">
                {[...order.history].reverse().map((h, i) => (
                  <li key={i}>
                    <span className="led sm" style={{ '--led': statusById(h.status).color }} />
                    <span>{h.note || statusById(h.status).label}{h.by && <em className="by"> · {h.by}</em>}</span>
                    <span className="muted small">{fmtDate(h.at)}</span>
                  </li>
                ))}
              </ol>
            </section>

            {can('eliminar') && (
              <button className="link-btn danger" onClick={() => confirm(`¿Eliminar el pedido ${order.folio}?`) && onDelete()}>Eliminar pedido</button>
            )}
          </>
        )}
      </aside>
    </div>
  )
}

function LedSpecs({ order }) {
  const d = order.design
  const plan = planPower(d)
  return (
    <>
      <section className="spec-grid">
        <div><span>Placa</span><strong>{d.widthCm} × {d.heightCm} cm</strong></div>
        <div><span>Material</span><strong>{boardMaterialById(d.material).name}</strong></div>
        <div><span>LED</span><strong>{d.dots.length} de {d.ledMm} mm</strong></div>
        <div><span>Cantidad</span><strong>{order.quote.quantity}</strong></div>
        <div><span>Puntos</span><strong>{DOT_STYLES.find((x) => x.id === d.style)?.name} · cada {d.pitchMm} mm</strong></div>
        <div><span>Encendido</span><strong>{ANIMATIONS.find((a) => a.id === d.animation)?.name}</strong></div>
        <div><span>Fuente</span><strong>{POWER.find((p) => p.id === d.power)?.name}</strong></div>
        <div><span>Consumo</span><strong>{plan.watts} W · {plan.totalMa} mA</strong></div>
        <div className="wide">
          <span>Textos</span>
          <strong>
            {d.lines.map((l, i) => (
              <span key={i} className="hex"><i style={{ background: ledColorById(l.color).hex }} />“{l.text}” {l.font} {l.heightMm / 10} cm</span>
            ))}
          </strong>
        </div>
      </section>
      <section>
        <h3>Cadenas ({plan.strings.length}){d.power === '127v' ? ` · ${plan.boardsB ? `${plan.boardsB} placa B` : `${plan.boardsA} placa A`}` : ` · eliminador ${plan.supplyA} A`}</h3>
        <ul className="quote-lines">
          {plan.strings.slice(0, 8).map((s) => (
            <li key={s.id}>
              <span><span className="led sm" style={{ '--led': ledColorById(s.color).hex }} /> S{s.id} · {s.count} LED · {s.volts} V</span>
              <span>{d.power === '127v' ? s.cap : `${s.resistor} Ω`} · {s.mA} mA</span>
            </li>
          ))}
          {plan.strings.length > 8 && <li className="muted"><span>… {plan.strings.length - 8} más en el diagrama</span></li>}
        </ul>
      </section>
    </>
  )
}
