import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import {
  CASE_KINDS, CASE_PRIORITIES, CASE_STATES, WARRANTY_DECISIONS, WARRANTY_REMEDIES, caseKindName, caseOverdue
} from '../lib/business'
import Icon from '../components/Icon'

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const left = (iso) => {
  const m = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (m < 0) return `venció hace ${Math.abs(m) < 60 ? `${Math.abs(m)} min` : `${Math.round(Math.abs(m) / 60)} h`}`
  return m < 60 ? `${m} min` : m < 60 * 24 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} días`
}
const wa = (phone, text) => {
  const d = String(phone || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}

// Atención: cada caso tiene responsable, prioridad, fecha límite de primera respuesta, historial y resolución
export default function Support({ people = [], orders = [], onOpenOrder }) {
  const [cases, setCases] = useState(null)
  const [filter, setFilter] = useState('abiertos')
  const [sel, setSel] = useState(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState(null)
  const load = useCallback(() => api.list('cases').then(setCases).catch((e) => setMsg(e.message)), [])
  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])
  if (!cases) return <p className="muted">{msg || 'Cargando…'}</p>

  const nameOf = (id) => people.find((p) => p.id === id)?.name || 'Sin responsable'
  const open = cases.filter((c) => c.status !== 'resuelto')
  const late = open.filter((c) => caseOverdue(c))
  const shown = (filter === 'abiertos' ? open : filter === 'vencidos' ? late : filter === 'garantia' ? cases.filter((c) => c.kind === 'garantia') : cases)
    .slice()
    .sort((a, b) => (a.status === 'resuelto') - (b.status === 'resuelto') || CASE_PRIORITIES.findIndex((p) => p.id === a.priority) - CASE_PRIORITIES.findIndex((p) => p.id === b.priority) || a.dueAt.localeCompare(b.dueAt))
  const current = sel && cases.find((c) => c.id === sel)
  const patch = async (id, body) => {
    setMsg('')
    try {
      await api.update('cases', id, body)
      await load()
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <div className="support">
      <div className="kpis">
        <div className="kpi"><span>Abiertos</span><strong>{open.length}</strong></div>
        <div className={`kpi ${late.length ? 'hot' : ''}`}><span>Sin respuesta a tiempo</span><strong>{late.length}</strong></div>
        <div className="kpi"><span>Sin responsable</span><strong>{open.filter((c) => !c.owner).length}</strong></div>
        <div className="kpi"><span>Garantías en revisión</span><strong>{cases.filter((c) => c.warranty?.decision === 'pendiente' && c.status !== 'resuelto').length}</strong></div>
      </div>
      <p className="muted small">Objetivos de primera respuesta (horario lun–sáb 9–19 h): {CASE_PRIORITIES.map((p) => `${p.name} ${p.minutes < 60 ? `${p.minutes} min` : `${p.minutes / 60} h`}`).join(' · ')}. Ajústalos a la capacidad real antes de publicarlos.</p>
      <div className="row between wrap">
        <div className="switch small">
          {[['abiertos', 'Abiertos'], ['vencidos', 'Vencidos'], ['garantia', 'Garantías'], ['todos', 'Todos']].map(([id, label]) => (
            <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
        <button className="btn primary sm" onClick={() => setForm({ kind: 'consulta', title: '', orderId: '', message: '' })}>+ Nuevo caso</button>
      </div>
      {msg && <p className="error">{msg}</p>}

      {form && (
        <form className="card lead-form" onSubmit={async (e) => {
          e.preventDefault()
          try {
            const c = await api.create('cases', form)
            setForm(null)
            await load()
            setSel(c.id)
          } catch (err) {
            setMsg(err.message)
          }
        }}>
          <div className="lead-grid">
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{CASE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select>
            <select className="input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
              <option value="">Sin pedido</option>
              {orders.slice(0, 200).map((o) => <option key={o.id} value={o.id}>{o.folio} · {o.customer.name}</option>)}
            </select>
            <input className="input span2" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input span2" rows="2" placeholder="Qué pasó" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="row"><button className="btn primary sm">Abrir caso</button><button type="button" className="btn ghost sm" onClick={() => setForm(null)}>Cancelar</button></div>
        </form>
      )}

      <div className="support-grid">
        <ul className="case-list">
          {shown.map((c) => (
            <li key={c.id} className={`${sel === c.id ? 'active' : ''} ${caseOverdue(c) ? 'late' : ''} ${c.status === 'resuelto' ? 'done' : ''}`} onClick={() => setSel(c.id)}>
              <div className="row between">
                <strong>{c.code} · {c.title}</strong>
                <span className={`prio prio-${c.priority}`}>{CASE_PRIORITIES.find((p) => p.id === c.priority)?.name}</span>
              </div>
              <span className="muted small">{caseKindName(c.kind)}{c.folio && ` · ${c.folio}`} · {c.contact?.name || '—'}</span>
              <span className="small">
                {c.status === 'resuelto' ? `Resuelto ${fmt(c.resolvedAt)}` : c.firstResponseAt ? `${CASE_STATES.find((s) => s.id === c.status)?.name} · ${nameOf(c.owner)}` : <b className={caseOverdue(c) ? 'warn-text' : ''}>Responder en {left(c.dueAt)}</b>}
              </span>
            </li>
          ))}
          {!shown.length && <li className="muted">Sin casos aquí.</li>}
        </ul>
        {current ? <CaseDetail key={current.id} c={current} people={people} orders={orders} onPatch={(b) => patch(current.id, b)} onOpenOrder={onOpenOrder} /> : <p className="muted card">Elige un caso para verlo.</p>}
      </div>
    </div>
  )
}

function CaseDetail({ c, people, orders, onPatch, onOpenOrder }) {
  const [note, setNote] = useState('')
  const [resolution, setResolution] = useState(c.resolution || '')
  const [next, setNext] = useState(c.nextAction || '')
  const [link, setLink] = useState(null)
  const order = orders.find((o) => o.id === c.orderId)
  const genLink = async () => {
    try {
      setLink(await api.resetLink(c.contact.email))
    } catch (e) {
      alert(e.message)
    }
  }
  const resetUrl = link && `${window.location.origin}${window.location.pathname}${link.path}`
  return (
    <section className="card case-detail">
      <div className="row between wrap">
        <h2>{c.code} · {c.title}</h2>
        {order && <button className="btn ghost sm" onClick={() => onOpenOrder(order.id)}>Ver pedido {order.folio}</button>}
      </div>
      <p className="muted small">
        {caseKindName(c.kind)} · abierto {fmt(c.createdAt)} por {c.source === 'cliente' ? 'el cliente' : 'el equipo'} · primera respuesta {c.firstResponseAt ? fmt(c.firstResponseAt) : `pendiente (límite ${fmt(c.dueAt)})`}
      </p>
      {(c.contact?.name || c.contact?.phone) && (
        <p className="small">
          <Icon name="user" size={14} /> {c.contact.name} {c.contact.phone && <a href={wa(c.contact.phone, `Hola ${c.contact.name.split(' ')[0]}, te escribimos sobre tu caso ${c.code}.`)} target="_blank" rel="noreferrer">· WhatsApp {c.contact.phone}</a>} {c.contact.email && `· ${c.contact.email}`}
        </p>
      )}
      <div className="case-controls">
        <label className="field"><span>Estado</span><select className="input" value={c.status} onChange={(e) => (e.target.value === 'resuelto' ? onPatch({ status: 'resuelto', resolution }) : onPatch({ status: e.target.value }))}>{CASE_STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="field"><span>Prioridad</span><select className="input" value={c.priority} onChange={(e) => onPatch({ priority: e.target.value })}>{CASE_PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="field"><span>Responsable</span><select className="input" value={c.owner} onChange={(e) => onPatch({ owner: e.target.value })}><option value="">Sin responsable</option>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      </div>
      <div className="row wrap">
        <label className="field grow"><span>Próxima acción</span><input className="input" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Ej. Llamar el martes para agendar la revisión" /></label>
        <button className="btn ghost sm" disabled={next === (c.nextAction || '')} onClick={() => onPatch({ nextAction: next })}>Guardar</button>
      </div>
      {c.warranty && (
        <div className="warranty-box">
          <b>Garantía</b>
          <select className="input" value={c.warranty.decision} onChange={(e) => onPatch({ warranty: { decision: e.target.value } })}>{WARRANTY_DECISIONS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select className="input" value={c.warranty.remedy} onChange={(e) => onPatch({ warranty: { remedy: e.target.value } })}>{WARRANTY_REMEDIES.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <span className="muted small">La decisión la toma una persona con la evidencia (fotos, folio); no se resuelve sola.</span>
        </div>
      )}
      {c.kind === 'acceso' && c.contact?.email && (
        <div className="warranty-box">
          <b>Recuperar acceso</b>
          <button className="btn ghost sm" onClick={genLink}>Generar enlace de un solo uso (1 h)</button>
          {link && (
            <>
              <code className="reset-url">{resetUrl}</code>
              {link.phone && <a className="btn ghost sm" href={wa(link.phone, `Hola ${link.name.split(' ')[0]}, este es tu enlace para crear una nueva contraseña (vence en 1 hora): ${resetUrl}`)} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>}
              <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(resetUrl)}>Copiar</button>
            </>
          )}
        </div>
      )}
      <ol className="case-events">
        {c.events.map((e, i) => <li key={i}><span className="muted small">{fmt(e.at)} · {e.by}</span><p>{e.text}</p></li>)}
      </ol>
      <div className="row wrap">
        <textarea className="input grow" rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota o respuesta al cliente (queda en el historial)" />
        <button className="btn primary sm" disabled={!note.trim()} onClick={() => { onPatch({ note }); setNote('') }}>Agregar</button>
      </div>
      <div className="row wrap">
        <textarea className="input grow" rows="2" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolución (obligatoria para cerrar)" />
        <button className="btn ghost sm" disabled={!resolution.trim() || c.status === 'resuelto'} onClick={() => onPatch({ status: 'resuelto', resolution })}>Resolver y cerrar</button>
      </div>
    </section>
  )
}
