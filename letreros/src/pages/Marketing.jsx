import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import {
  CHANNELS,
  COMMERCIAL_CALENDAR,
  CONTENT_IDEAS,
  POST_STATES,
  couponLabel,
  normalizeCoupon,
  normalizePost,
  sourceName
} from '../lib/business'
import { AD_BENCHMARKS, COMMERCE_DATES, PAYMENT_FEES, RESEARCH_DATE, SALES_CHANNELS, TACTICS, netFromSale } from '../lib/commerce'
import './marketing.css'

const SITE = 'https://letrerolab.vercel.app'
const TACTICS_KEY = 'ap_mkt_tactics'
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const TABS = [
  { id: 'resultados', name: 'Resultados' },
  { id: 'contenido', name: 'Contenido' },
  { id: 'cupones', name: 'Cupones' },
  { id: 'canales', name: 'Canales y comisiones' },
  { id: 'plan', name: 'Plan' }
]

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const todayStr = () => ymd(new Date())
const parseDay = (s) => new Date(`${s}T00:00:00`)
const daysUntil = (s, from = todayStr()) => Math.round((parseDay(s) - parseDay(from)) / 86400000)
const fmtDay = (s) => (s ? parseDay(s).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
const stateName = (id) => POST_STATES.find((s) => s.id === id)?.name || id
const channelName = (id) => CHANNELS.find((c) => c.id === id)?.name || id

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    window.prompt('Copia el texto:', text)
    return false
  }
}

const readTactics = () => {
  try {
    const v = JSON.parse(localStorage.getItem(TACTICS_KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

const Src = ({ url }) => (url ? <a className="src" href={url} target="_blank" rel="noreferrer">fuente</a> : null)

export default function Marketing({ orders = [], settings, canEdit }) {
  const [tab, setTab] = useState('resultados')
  return (
    <div className="mkt">
      <div className="mkt-tabs">
        <div className="switch small">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.name}</button>
          ))}
        </div>
      </div>
      {!canEdit && <p className="muted small">Solo lectura: necesitas el permiso de marketing para hacer cambios.</p>}
      {tab === 'resultados' && <Results orders={orders} />}
      {tab === 'contenido' && <Content canEdit={canEdit} />}
      {tab === 'cupones' && <Coupons orders={orders} canEdit={canEdit} />}
      {tab === 'canales' && <Channels settings={settings} />}
      {tab === 'plan' && <Plan />}
    </div>
  )
}

// ---------- Resultados ----------
function groupBy(list, key) {
  const map = new Map()
  for (const o of list) {
    const k = key(o)
    const g = map.get(k) || { key: k, count: 0, sales: 0 }
    g.count++
    if (o.totals && o.status !== 'cancelado') g.sales += o.totals.total || 0
    map.set(k, g)
  }
  return [...map.values()].sort((a, b) => b.count - a.count || b.sales - a.sales)
}

function Bars({ rows, label, showSales }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  if (!rows.length) return <p className="muted small">Aún no hay pedidos en este periodo.</p>
  return (
    <div className="mkt-bars">
      {rows.map((r) => (
        <div className="mkt-bar" key={r.key || '_'}>
          <span className="mkt-bar-label">{label(r.key)}</span>
          <div className="mkt-bar-track"><i style={{ width: `${(r.count / max) * 100}%` }} /></div>
          <span className="mkt-bar-val">
            {r.count} {r.count === 1 ? 'pedido' : 'pedidos'}
            {showSales && <em> · {money(r.sales)}</em>}
          </span>
        </div>
      ))}
    </div>
  )
}

function Results({ orders }) {
  const [days, setDays] = useState(30)
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  const recent = useMemo(() => {
    const from = Date.now() - days * 86400000
    return orders.filter((o) => new Date(o.createdAt).getTime() >= from)
  }, [orders, days])

  const live = recent.filter((o) => o.status !== 'cancelado')
  const hasSales = recent.some((o) => o.totals)
  const sales = live.reduce((s, o) => s + (o.totals?.total || 0), 0)
  const accepted = recent.filter((o) => o.quoteState === 'aceptada').length
  const conversion = recent.length ? Math.round((accepted / recent.length) * 100) : 0
  const withCoupon = recent.filter((o) => o.coupon).length

  const bySource = useMemo(() => groupBy(recent, (o) => o.customer?.source || ''), [recent])
  const byRef = useMemo(() => groupBy(recent.filter((o) => o.customer?.ref), (o) => o.customer.ref), [recent])

  const slug = campaign.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const link = `${SITE}/?ref=${slug || 'CAMPAÑA'}`
  const copy = async () => {
    if (!slug) return
    await copyText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="row between wrap mkt-head">
        <p className="muted small">Pedidos de los últimos {days} días.</p>
        <div className="chips small">
          {[7, 30, 90].map((d) => <button key={d} className={days === d ? 'active' : ''} onClick={() => setDays(d)}>{d} días</button>)}
        </div>
      </div>
      <div className="kpis">
        <div className="kpi"><span>Pedidos</span><strong>{recent.length}</strong></div>
        <div className="kpi"><span>Ventas</span><strong>{hasSales ? money(sales) : '—'}</strong></div>
        <div className="kpi"><span>Presupuestos aceptados</span><strong>{conversion} %</strong></div>
        <div className="kpi"><span>Pedidos con cupón</span><strong>{withCoupon}</strong></div>
      </div>

      <div className="admin-grid mkt-grid">
        <section className="card">
          <h2>¿De dónde vienen tus clientes?</h2>
          <p className="muted small">Lo que el cliente eligió en “¿Cómo nos conociste?”.</p>
          <Bars rows={bySource} label={(k) => (k ? sourceName(k) : 'Sin dato')} showSales={hasSales} />
        </section>
        <section className="card">
          <h2>Campañas (links con ?ref=)</h2>
          <p className="muted small">Pedidos que llegaron desde un link rastreado.</p>
          {byRef.length ? <Bars rows={byRef} label={(k) => k} showSales={hasSales} /> : <p className="muted small">Todavía ningún pedido llegó con un link de campaña.</p>}
        </section>
      </div>

      <section className="card">
        <h2>Crea un link rastreado</h2>
        <p className="muted small">Úsalo en tu bio, anuncios o estados de WhatsApp. Cada pedido que llegue por ese link queda marcado con la campaña y aparece arriba.</p>
        <div className="row wrap mkt-link">
          <input className="input grow" placeholder="Nombre de la campaña (ej. buen-fin-ig)" value={campaign} onChange={(e) => setCampaign(e.target.value)} maxLength={60} />
          <button className="btn primary sm" onClick={copy} disabled={!slug}>{copied ? 'Copiado' : 'Copiar link'}</button>
        </div>
        <code className="mkt-code">{link}</code>
      </section>
    </>
  )
}

// ---------- Contenido ----------
const EMPTY_POST = () => ({ date: todayStr(), channel: 'instagram', status: 'idea', title: '', notes: '', budget: '', assignee: '' })

function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - offset)
  const weeks = []
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) week.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d))
    if (w >= 4 && week[0].getMonth() !== month) break
    weeks.push(week)
  }
  return weeks
}

function commerceOn(day) {
  return COMMERCE_DATES.filter((c) => (c.end ? day >= c.date && day <= c.end : day === c.date))
}

function Content({ canEdit }) {
  const [posts, setPosts] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(EMPTY_POST)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('pendientes')
  const now = new Date()
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() })

  const load = async () => {
    setError('')
    try {
      const [p, ppl] = await Promise.all([api.list('posts'), api.people().catch(() => [])])
      setPosts(Array.isArray(p) ? p : [])
      setPeople(Array.isArray(ppl) ? ppl : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const act = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const personName = (id) => people.find((p) => p.id === id)?.name || ''
  const today = todayStr()

  const save = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Escribe de qué trata la publicación')
    const data = normalizePost(form)
    act(async () => {
      if (editing) await api.update('posts', editing, data)
      else await api.create('posts', data)
      setForm(EMPTY_POST())
      setEditing(null)
    })
  }
  const edit = (p) => {
    setEditing(p.id)
    setForm({ ...EMPTY_POST(), ...p, budget: p.budget || '' })
    document.querySelector('.mkt-post-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const cancel = () => {
    setEditing(null)
    setForm(EMPTY_POST())
  }
  const publish = (p) => act(() => api.update('posts', p.id, { ...normalizePost(p), status: 'publicada' }))
  const remove = (p) => {
    if (window.confirm(`¿Borrar “${p.title}”?`)) act(() => api.remove('posts', p.id))
  }
  const newOn = (day) => {
    if (!canEdit) return
    setEditing(null)
    setForm({ ...EMPTY_POST(), date: day })
    document.querySelector('.mkt-post-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const byDay = useMemo(() => {
    const map = {}
    for (const p of posts) (map[p.date] = map[p.date] || []).push(p)
    return map
  }, [posts])

  const weeks = monthGrid(view.y, view.m)
  const shift = (d) => {
    const m = view.m + d
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 })
  }

  const sorted = [...posts].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const shown = filter === 'pendientes'
    ? sorted.filter((p) => p.status !== 'publicada')
    : filter === 'publicadas'
      ? sorted.filter((p) => p.status === 'publicada').reverse()
      : sorted
  const spent = posts.filter((p) => p.status === 'publicada' && p.date.slice(0, 7) === today.slice(0, 7)).reduce((s, p) => s + (p.budget || 0), 0)
  const upcoming = COMMERCE_DATES.filter((c) => (c.end || c.date) >= today).slice(0, 3)

  if (loading) return <p className="muted">Cargando calendario…</p>

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="kpis">
        <div className="kpi"><span>Ideas</span><strong>{posts.filter((p) => p.status === 'idea').length}</strong></div>
        <div className="kpi"><span>Programadas</span><strong>{posts.filter((p) => p.status === 'programada').length}</strong></div>
        <div className="kpi"><span>Publicadas este mes</span><strong>{posts.filter((p) => p.status === 'publicada' && p.date.slice(0, 7) === today.slice(0, 7)).length}</strong></div>
        <div className="kpi"><span>Invertido este mes</span><strong>{money(spent)}</strong></div>
      </div>

      {upcoming.length > 0 && (
        <p className="notice mkt-notice">
          Próximas fechas: {upcoming.map((c, i) => (
            <span key={c.date}>{i > 0 && ' · '}<b>{c.name}</b> en {daysUntil(c.date)} días</span>
          ))}
        </p>
      )}

      <section className="card">
        <div className="row between wrap">
          <h2>{MONTHS[view.m]} {view.y}</h2>
          <div className="row">
            <button className="btn ghost sm" onClick={() => shift(-1)} aria-label="Mes anterior">‹</button>
            <button className="btn ghost sm" onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}>Hoy</button>
            <button className="btn ghost sm" onClick={() => shift(1)} aria-label="Mes siguiente">›</button>
          </div>
        </div>
        <div className="mkt-legend">
          {POST_STATES.map((s) => <span key={s.id} className={`mkt-dot st-${s.id}`}>{s.name}</span>)}
          <span className="mkt-dot st-fecha">Fecha comercial</span>
        </div>
        <div className="mkt-cal-scroll">
          <div className="mkt-cal">
            {WEEKDAYS.map((d) => <div className="mkt-cal-wd" key={d}>{d}</div>)}
            {weeks.flat().map((d) => {
              const day = ymd(d)
              const list = byDay[day] || []
              const events = commerceOn(day)
              const cls = ['mkt-cal-day', d.getMonth() !== view.m && 'out', day === today && 'today', events.length && 'event'].filter(Boolean).join(' ')
              return (
                <div className={cls} key={day} onDoubleClick={() => newOn(day)}>
                  <span className="mkt-cal-n">{d.getDate()}</span>
                  {events.map((ev) => <span className="mkt-cal-ev" key={ev.name} title={ev.name}>{ev.name}</span>)}
                  {list.map((p) => (
                    <button key={p.id} className={`mkt-chip st-${p.status}`} title={`${channelName(p.channel)} · ${stateName(p.status)}`} onClick={() => (canEdit ? edit(p) : null)}>
                      {p.title}
                    </button>
                  ))}
                  {canEdit && !list.length && <button className="mkt-cal-add" onClick={() => newOn(day)} aria-label={`Agregar el ${day}`}>+</button>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="admin-grid mkt-grid">
        {canEdit && (
          <form className="card lead-form mkt-post-form" onSubmit={save}>
            <h2>{editing ? 'Editar publicación' : 'Nueva publicación'}</h2>
            <div className="lead-grid mkt-form">
              <label className="field"><span>Fecha</span><input className="input" type="date" value={form.date} onChange={set('date')} /></label>
              <label className="field"><span>Canal</span>
                <select className="input" value={form.channel} onChange={set('channel')}>
                  {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Estado</span>
                <select className="input" value={form.status} onChange={set('status')}>
                  {POST_STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="field"><span>Responsable</span>
                <select className="input" value={form.assignee} onChange={set('assignee')}>
                  <option value="">Sin asignar</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>
            <label className="field"><span>Título</span><input className="input" value={form.title} onChange={set('title')} maxLength={140} placeholder="¿De qué trata?" /></label>
            <label className="field"><span>Notas</span><textarea className="input" rows={3} value={form.notes} onChange={set('notes')} maxLength={1000} placeholder="Texto, hashtags, música, a quién etiquetar…" /></label>
            <label className="field"><span>Presupuesto de anuncio (MXN)</span><input className="input" type="number" min="0" value={form.budget} onChange={set('budget')} placeholder="0" /></label>
            <div className="row">
              <button className="btn primary sm" disabled={busy}>{editing ? 'Guardar cambios' : 'Agregar'}</button>
              {editing && <button type="button" className="btn ghost sm" onClick={cancel}>Cancelar</button>}
            </div>
            <div className="mkt-ideas">
              <p className="muted small">¿Sin idea? Toca una para usarla:</p>
              <div className="chips small">
                {CONTENT_IDEAS.map((idea) => (
                  <button type="button" key={idea} className={form.title === idea ? 'active' : ''} onClick={() => setForm({ ...form, title: idea })}>{idea}</button>
                ))}
              </div>
            </div>
          </form>
        )}

        <section className="card">
          <div className="row between wrap">
            <h2>Publicaciones</h2>
            <div className="chips small">
              {[['pendientes', 'Pendientes'], ['publicadas', 'Publicadas'], ['todas', 'Todas']].map(([id, name]) => (
                <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{name}</button>
              ))}
            </div>
          </div>
          {!shown.length && <p className="muted small">No hay publicaciones aquí todavía.</p>}
          <ul className="mkt-list">
            {shown.map((p) => (
              <li key={p.id} className={p.status !== 'publicada' && p.date < today ? 'late' : ''}>
                <span className={`mkt-pill st-${p.status}`}>{stateName(p.status)}</span>
                <div className="grow">
                  <strong>{p.title}</strong>
                  <span className="muted small">
                    {fmtDay(p.date)} · {channelName(p.channel)}
                    {p.assignee && personName(p.assignee) && ` · ${personName(p.assignee)}`}
                    {p.budget > 0 && ` · ${money(p.budget)}`}
                    {p.status !== 'publicada' && p.date < today && ' · atrasada'}
                  </span>
                  {p.notes && <span className="small mkt-notes">{p.notes}</span>}
                </div>
                {canEdit && (
                  <div className="row mkt-actions">
                    {p.status !== 'publicada' && <button className="btn ghost sm" disabled={busy} onClick={() => publish(p)}>Publicada</button>}
                    <button className="link-btn" onClick={() => edit(p)}>Editar</button>
                    <button className="link-btn danger" onClick={() => remove(p)}>Borrar</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

// ---------- Cupones ----------
const EMPTY_COUPON = { code: '', pct: '10', amount: '', minTotal: '', expires: '', maxUses: '', note: '' }
const SUGGESTIONS = ['BIENVENIDA10', 'AMIGO10', 'BUENFIN15', 'NAVIDAD10', 'REGRESA10', 'EVENTO10', 'FOTO5']

function Coupons({ orders, canEdit }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(EMPTY_COUPON)
  const [open, setOpen] = useState('')
  const [copied, setCopied] = useState('')

  const load = async () => {
    setError('')
    try {
      const c = await api.list('coupons')
      setCoupons(Array.isArray(c) ? c : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const act = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const today = todayStr()
  const used = (code) => orders.filter((o) => o.coupon && o.coupon.toUpperCase() === code)

  const suggest = () => {
    const taken = new Set(coupons.map((c) => c.code))
    const pct = Number(form.pct) || 10
    const free = SUGGESTIONS.find((s) => !taken.has(s))
    const code = free || `PROMO${pct}${String(Date.now()).slice(-3)}`
    setForm({ ...form, code, pct: free ? free.replace(/\D/g, '') || form.pct : form.pct })
  }

  const create = (e) => {
    e.preventDefault()
    const data = normalizeCoupon(form)
    if (!data.code) return setError('Escribe un código')
    if (!data.pct && !data.amount) return setError('Pon un porcentaje o un monto de descuento')
    if (coupons.some((c) => c.code === data.code)) return setError('Ya existe un cupón con ese código')
    act(async () => {
      await api.create('coupons', data)
      setForm(EMPTY_COUPON)
    })
  }
  const toggle = (c) => act(() => api.update('coupons', c.id, { ...normalizeCoupon(c), active: !c.active }))
  const remove = (c) => {
    if (window.confirm(`¿Borrar el cupón ${c.code}?`)) act(() => api.remove('coupons', c.id))
  }
  const share = async (c) => {
    const extra = [c.minTotal ? `en compras desde ${money(c.minTotal)}` : '', c.expires ? `válido hasta el ${fmtDay(c.expires)}` : ''].filter(Boolean).join(', ')
    const msg = `Usa el cupón ${c.code} en letrerolab.vercel.app y obtén ${couponLabel(c).toLowerCase()}${extra ? ` (${extra})` : ''}. ¡Diseña tu letrero LED!`
    await copyText(msg)
    setCopied(c.code)
    setTimeout(() => setCopied(''), 1800)
  }

  if (loading) return <p className="muted">Cargando cupones…</p>

  const status = (c) => {
    if (!c.active) return ['Pausado', 'off']
    if (c.expires && c.expires < today) return ['Vencido', 'off']
    if (c.maxUses && (c.uses || 0) >= c.maxUses) return ['Agotado', 'off']
    return ['Activo', 'on']
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="admin-grid mkt-grid">
        {canEdit && (
          <form className="card lead-form" onSubmit={create}>
            <h2>Nuevo cupón</h2>
            <div className="row">
              <input className="input grow mkt-upper" placeholder="CÓDIGO" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={20} />
              <button type="button" className="btn ghost sm" onClick={suggest}>Sugerir</button>
            </div>
            <div className="lead-grid mkt-form">
              <label className="field"><span>% de descuento</span><input className="input" type="number" min="0" max="50" value={form.pct} onChange={set('pct')} /></label>
              <label className="field"><span>o monto fijo (MXN)</span><input className="input" type="number" min="0" value={form.amount} onChange={set('amount')} /></label>
              <label className="field"><span>Compra mínima</span><input className="input" type="number" min="0" value={form.minTotal} onChange={set('minTotal')} placeholder="Sin mínimo" /></label>
              <label className="field"><span>Vence</span><input className="input" type="date" value={form.expires} onChange={set('expires')} /></label>
              <label className="field"><span>Usos máximos</span><input className="input" type="number" min="0" value={form.maxUses} onChange={set('maxUses')} placeholder="Sin límite" /></label>
              <label className="field"><span>Nota interna</span><input className="input" value={form.note} onChange={set('note')} maxLength={120} placeholder="Ej. para clientes de Instagram" /></label>
            </div>
            <button className="btn primary sm" disabled={busy}>Crear cupón</button>
            <p className="muted small">El descuento máximo es 50 %. Un cupón con vencimiento motiva a decidir más rápido.</p>
          </form>
        )}

        <section className="card">
          <h2>Tus cupones</h2>
          {!coupons.length && <p className="muted small">Aún no tienes cupones. Crea uno de bienvenida y compártelo en tus redes.</p>}
          <ul className="mkt-list">
            {coupons.map((c) => {
              const [label, cls] = status(c)
              const list = used(c.code)
              return (
                <li key={c.id} className="mkt-coupon">
                  <div className="row between wrap">
                    <div className="row wrap">
                      <strong className="mkt-code-tag">{c.code}</strong>
                      <span className={`mkt-pill ${cls}`}>{label}</span>
                    </div>
                    {canEdit && (
                      <label className="row small mkt-toggle">
                        <input type="checkbox" checked={Boolean(c.active)} onChange={() => toggle(c)} disabled={busy} /> Activo
                      </label>
                    )}
                  </div>
                  <span>{couponLabel(c)}</span>
                  <span className="muted small">
                    {c.minTotal ? `Desde ${money(c.minTotal)}` : 'Sin mínimo'}
                    {' · '}{c.expires ? `Vence ${fmtDay(c.expires)}` : 'Sin vencimiento'}
                    {' · '}Usos: {c.uses || 0}{c.maxUses ? ` / ${c.maxUses}` : ''}
                    {c.note && ` · ${c.note}`}
                  </span>
                  <div className="row wrap">
                    <button className="btn ghost sm" onClick={() => share(c)}>{copied === c.code ? 'Copiado' : 'Copiar texto para WhatsApp'}</button>
                    <button className="link-btn" onClick={() => setOpen(open === c.code ? '' : c.code)}>
                      {list.length} {list.length === 1 ? 'pedido' : 'pedidos'} con este cupón
                    </button>
                    {canEdit && <button className="link-btn danger" onClick={() => remove(c)}>Borrar</button>}
                  </div>
                  {open === c.code && (
                    list.length
                      ? (
                        <ul className="mkt-used">
                          {list.map((o) => (
                            <li key={o.id || o.folio}>
                              <b>{o.folio}</b> · {o.customer?.name || 'Sin nombre'} · {fmtDay(String(o.createdAt).slice(0, 10))}
                              {o.totals && ` · ${money(o.totals.total)}`}
                            </li>
                          ))}
                        </ul>
                        )
                      : <p className="muted small">Nadie lo ha usado todavía.</p>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}

// ---------- Canales y comisiones ----------
function Channels() {
  const [price, setPrice] = useState('1200')
  const [payId, setPayId] = useState('mp')
  const payment = PAYMENT_FEES.find((p) => p.id === payId) || PAYMENT_FEES[0]
  const p = Math.max(0, Number(price) || 0)
  const rows = SALES_CHANNELS.map((ch) => ({ ch, r: netFromSale(p, ch, payment) })).sort((a, b) => b.r.net - a.r.net)

  return (
    <>
      <p className="muted small">Investigación de {RESEARCH_DATE}; confirma tarifas en cada sitio. Comisiones aproximadas, sin contar envío ni impuestos retenidos.</p>
      <section className="card">
        <h2>¿Cuánto te queda por venta?</h2>
        <div className="lead-grid mkt-form">
          <label className="field"><span>Precio de venta (MXN)</span><input className="input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
          <label className="field"><span>Cómo te pagan</span>
            <select className="input" value={payId} onChange={(e) => setPayId(e.target.value)}>
              {PAYMENT_FEES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table className="market-table">
            <thead><tr><th>Canal</th><th>Comisión canal</th><th>Comisión cobro</th><th>Te queda</th><th>%</th></tr></thead>
            <tbody>
              {rows.map(({ ch, r }, i) => (
                <tr key={ch.id} className={i === 0 ? 'mkt-best' : ''}>
                  <td>
                    <strong>{ch.name}</strong>
                    <div className="muted small">{ch.note} <Src url={ch.url} /></div>
                  </td>
                  <td className="nowrap">{money(r.channel)}</td>
                  <td className="nowrap">{money(r.payment)}</td>
                  <td className="nowrap"><strong>{money(r.net)}</strong></td>
                  <td className="nowrap">
                    <span className="mkt-pct"><i style={{ width: `${Math.max(0, r.pct)}%` }} /></span> {r.pct} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-grid mkt-grid mkt-even">
        <section className="card">
          <h2>Medios de cobro</h2>
          <div className="table-wrap">
            <table className="market-table">
              <thead><tr><th>Medio</th><th>Comisión</th><th>Notas</th></tr></thead>
              <tbody>
                {PAYMENT_FEES.map((f) => (
                  <tr key={f.id}>
                    <td><strong>{f.name}</strong></td>
                    <td className="nowrap">{f.pct || f.fixed ? `${f.pct} %${f.fixed ? ` + $${f.fixed}` : ''}${f.iva ? ' + IVA' : ''}` : 'Sin comisión'}</td>
                    <td className="small">{f.note} <Src url={f.url} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <h2>Publicidad: referencias en México</h2>
          <ul className="mkt-bench">
            {AD_BENCHMARKS.map((b) => (
              <li key={b.name}>
                <span>{b.name}</span>
                <strong>{b.value}</strong>
                <Src url={b.url} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

// ---------- Plan ----------
function Plan() {
  const [done, setDone] = useState(readTactics)
  const today = todayStr()
  const month = new Date().getMonth() + 1
  const toggle = (title) => {
    const next = done.includes(title) ? done.filter((x) => x !== title) : [...done, title]
    setDone(next)
    try {
      localStorage.setItem(TACTICS_KEY, JSON.stringify(next))
    } catch {
      /* sin almacenamiento */
    }
  }
  const upcoming = COMMERCE_DATES.filter((c) => (c.end || c.date) >= today)

  return (
    <>
      <p className="muted small">Investigación de {RESEARCH_DATE}; confirma tarifas en cada sitio.</p>
      <div className="admin-grid mkt-grid">
        <section className="card">
          <h2>Próximas fechas comerciales</h2>
          <ul className="mkt-dates">
            {upcoming.map((c) => {
              const n = daysUntil(c.date)
              return (
                <li key={c.date} className={n <= 30 ? 'soon' : ''}>
                  <span className="mkt-days">{n <= 0 ? 'Ahora' : n === 1 ? 'Mañana' : `${n} días`}</span>
                  <div className="grow">
                    <strong>{c.name}</strong>
                    <span className="muted small">{fmtDay(c.date)}{c.end && ` al ${fmtDay(c.end)}`} <Src url={c.url} /></span>
                    {n > 14 && n <= 45 && <span className="small mkt-tip">Prepara contenido y anuncios desde ya (2 semanas antes el CPM aún es bajo).</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
        <section className="card">
          <h2>Calendario comercial por mes</h2>
          <ul className="mkt-months">
            {COMMERCIAL_CALENDAR.map((c) => (
              <li key={c.month} className={c.month === month ? 'now' : ''}>
                <b>{MONTHS[c.month - 1]}</b>
                <span>{c.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="row between wrap">
          <h2>Tácticas que funcionan</h2>
          <span className="muted small">{done.filter((d) => TACTICS.some((t) => t.title === d)).length} de {TACTICS.length} en marcha</span>
        </div>
        <ul className="mkt-tactics">
          {TACTICS.map((t) => (
            <li key={t.title} className={done.includes(t.title) ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={done.includes(t.title)} onChange={() => toggle(t.title)} />
                <div>
                  <strong>{t.title}</strong>
                  <span className="muted small">{t.how} <Src url={t.url} /></span>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
