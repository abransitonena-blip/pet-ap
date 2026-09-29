import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { AREAS, PRIORITIES, TASK_STATES, TASK_TEMPLATES, areaById, taskOverdue } from '../lib/business'

const EMPTY = { title: '', notes: '', area: 'ventas', assignee: '', due: '', priority: 'media', orderId: '' }
const today = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' }).slice(0, 10)
const addDays = (d, n) => new Date(new Date(`${d}T12:00:00`).getTime() + n * 86400000).toISOString().slice(0, 10)
const fmtDue = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '')

// Delegar: tablero de tareas por área, con responsable y fecha. Cada quien ve “Mi día” y checa entrada/salida.
export default function Tasks({ me, orders = [], can, onOpenOrder }) {
  const [tasks, setTasks] = useState(null)
  const [people, setPeople] = useState([])
  const [day, setDay] = useState(null)
  const [form, setForm] = useState(null)
  const [who, setWho] = useState(can('delegar') ? 'todos' : me.id)
  const [area, setArea] = useState('todas')
  const [msg, setMsg] = useState('')
  const delegate = can('delegar')

  const load = useCallback(async () => {
    try {
      const [t, p, d] = await Promise.all([api.list('tasks'), api.people(), api.myDay()])
      setTasks(t)
      setPeople(p)
      setDay(d)
    } catch (e) {
      setMsg(e.message)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const act = async (fn, ok) => {
    setMsg('')
    try {
      await fn()
      await load()
      if (ok) setMsg(ok)
    } catch (e) {
      setMsg(e.message)
    }
  }
  const nameOf = (id) => people.find((p) => p.id === id)?.name || '—'
  const folioOf = (id) => orders.find((o) => o.id === id)?.folio

  const shown = useMemo(
    () => (tasks || []).filter((t) => (who === 'todos' || t.assignee === who) && (area === 'todas' || t.area === area)),
    [tasks, who, area]
  )
  if (!tasks) return <p className="muted">{msg || 'Cargando tareas…'}</p>

  const mine = tasks.filter((t) => t.assignee === me.id && t.status !== 'hecha')
  const overdue = tasks.filter((t) => taskOverdue(t, today()))
  const save = (e) => {
    e.preventDefault()
    const body = { ...form, assignee: form.assignee || me.id }
    act(() => (form.id ? api.update('tasks', form.id, body) : api.create('tasks', body)), form.id ? 'Tarea actualizada' : 'Tarea asignada')
    setForm(null)
  }
  const fromTemplate = (t) => setForm({ ...EMPTY, ...t, due: addDays(today(), t.priority === 'alta' ? 0 : t.priority === 'media' ? 2 : 7) })
  const byPerson = people.map((p) => ({
    ...p,
    open: tasks.filter((t) => t.assignee === p.id && t.status !== 'hecha').length,
    late: overdue.filter((t) => t.assignee === p.id).length,
    done7: tasks.filter((t) => t.assignee === p.id && t.status === 'hecha' && t.doneAt >= addDays(today(), -7)).length
  }))

  return (
    <div className="tasks">
      <MyDay day={day} mine={mine} onClock={() => act(() => api.clock(), 'Registrado')} />
      {msg && <p className="small">{msg}</p>}

      {delegate && (
        <section className="card">
          <h2>Equipo</h2>
          <div className="team-load">
            {byPerson.map((p) => (
              <button key={p.id} className={`team-chip ${who === p.id ? 'active' : ''}`} onClick={() => setWho(who === p.id ? 'todos' : p.id)}>
                <span className="avatar sm" style={{ background: areaById(p.area).color }}>{p.name.slice(0, 1)}</span>
                <span className="grow"><strong>{p.name}</strong><em>{areaById(p.area).name}</em></span>
                <span className="team-nums">
                  <b>{p.open}</b> abiertas{p.late > 0 && <i className="warn-text"> · {p.late} vencidas</i>}
                  <br /><span className="muted">{p.done7} hechas en 7 días</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="row between wrap">
        <div className="chips">
          <button className={area === 'todas' ? 'active' : ''} onClick={() => setArea('todas')}>Todas las áreas</button>
          {AREAS.map((a) => (
            <button key={a.id} className={area === a.id ? 'active' : ''} onClick={() => setArea(a.id)}>
              <span className="dot" style={{ background: a.color }} /> {a.name}
            </button>
          ))}
        </div>
        <button className="btn primary sm" onClick={() => setForm({ ...EMPTY, assignee: who !== 'todos' ? who : '' })}>+ Nueva tarea</button>
      </div>

      {form && (
        <form className="card lead-form" onSubmit={save}>
          <h2>{form.id ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <div className="lead-grid">
            <input className="input" placeholder="¿Qué hay que hacer? *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
            <select className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="input" value={form.assignee || me.id} onChange={(e) => setForm({ ...form, assignee: e.target.value })} disabled={!delegate}>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}{p.id === me.id ? ' (yo)' : ''}</option>)}
            </select>
            <input className="input" type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} aria-label="Fecha límite" />
            <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p.id} value={p.id}>Prioridad {p.name.toLowerCase()}</option>)}
            </select>
            <select className="input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>
              <option value="">Sin pedido ligado</option>
              {orders.filter((o) => !['entregado', 'cancelado'].includes(o.status)).map((o) => <option key={o.id} value={o.id}>{o.folio} · {o.customer.name}</option>)}
            </select>
            <textarea className="input span2" rows="2" placeholder="Detalles (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {!delegate && <p className="muted small">Puedes crear tareas para ti. Para asignarlas a otros se necesita el permiso “Asignar tareas”.</p>}
          <div className="row">
            <button className="btn primary sm" disabled={!form.title.trim()}>{form.id ? 'Guardar' : 'Asignar'}</button>
            <button type="button" className="btn ghost sm" onClick={() => setForm(null)}>Cancelar</button>
          </div>
          {!form.id && (
            <>
              <p className="muted small">Tareas frecuentes del taller:</p>
              <div className="chips wrap">
                {TASK_TEMPLATES.map((t) => <button type="button" key={t.title} onClick={() => fromTemplate(t)}>{t.title}</button>)}
              </div>
            </>
          )}
        </form>
      )}

      <div className="task-board">
        {TASK_STATES.map((s) => {
          const col = shown.filter((t) => t.status === s.id).sort((a, b) => (a.due || '9').localeCompare(b.due || '9') || PRIORITIES.findIndex((p) => p.id === a.priority) - PRIORITIES.findIndex((p) => p.id === b.priority))
          return (
            <section key={s.id} className="task-col">
              <h3>{s.name} <span className="muted">{col.length}</span></h3>
              {col.map((t) => (
                <article key={t.id} className={`task ${t.priority} ${taskOverdue(t, today()) ? 'late' : ''}`}>
                  <div className="row between">
                    <span className="task-area" style={{ '--c': areaById(t.area).color }}>{areaById(t.area).name}</span>
                    {t.due && <span className={`small ${taskOverdue(t, today()) ? 'warn-text' : 'muted'}`}>{taskOverdue(t, today()) ? 'Venció ' : ''}{fmtDue(t.due)}</span>}
                  </div>
                  <strong>{t.title}</strong>
                  {t.notes && <p className="small muted">{t.notes}</p>}
                  <div className="row between wrap small">
                    <span><span className="avatar xs">{nameOf(t.assignee).slice(0, 1)}</span> {nameOf(t.assignee)}</span>
                    {t.orderId && folioOf(t.orderId) && <button className="link-btn" onClick={() => onOpenOrder(t.orderId)}>{folioOf(t.orderId)}</button>}
                  </div>
                  <div className="task-actions">
                    {TASK_STATES.filter((x) => x.id !== t.status).map((x) => (
                      <button key={x.id} className="btn ghost xs" onClick={() => act(() => api.update('tasks', t.id, { status: x.id }))}>{x.id === 'hecha' ? '✓ Hecha' : x.name}</button>
                    ))}
                    <button className="link-btn" onClick={() => setForm({ ...EMPTY, ...t })}>Editar</button>
                    <button className="link-btn danger" onClick={() => confirm('¿Borrar la tarea?') && act(() => api.remove('tasks', t.id))}>Borrar</button>
                  </div>
                </article>
              ))}
              {!col.length && <p className="muted small">—</p>}
            </section>
          )
        })}
      </div>
    </div>
  )
}

// Mi día: checador de entrada/salida y mis pendientes
function MyDay({ day, mine, onClock }) {
  if (!day) return null
  const t = day.today
  const label = !t ? 'Checar entrada' : !t.out ? 'Checar salida' : null
  return (
    <section className="card my-day">
      <div className="grow">
        <h2>Hola, {day.user.name.split(' ')[0]}</h2>
        <p className="muted small">
          {mine.length ? `Tienes ${mine.length} tarea${mine.length > 1 ? 's' : ''} abierta${mine.length > 1 ? 's' : ''}.` : 'No tienes tareas pendientes.'}
          {day.employee && ` · ${day.employee.position || areaById(day.employee.area).name}`}
        </p>
      </div>
      {day.employee ? (
        <div className="clock">
          <span className="small">{t ? `Entrada ${t.in}${t.out ? ` · Salida ${t.out}` : ''}` : 'Sin registro hoy'}</span>
          {label ? <button className="btn primary sm" onClick={onClock}>{label}</button> : <span className="impact bajo">Jornada registrada</span>}
        </div>
      ) : (
        <span className="muted small">Para checar entrada, RRHH debe ligar tu usuario a tu ficha de empleado.</span>
      )}
    </section>
  )
}
