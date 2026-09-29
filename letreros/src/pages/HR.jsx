import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { AREAS, areaById, PAY_PERIODS, HR_DEFAULTS, mergeHr, seniorityYears, vacationDays, payroll, workedHours } from '../lib/business'
import { JOB_REFS, HR_DUTIES, MIN_WAGE_2026, weeklyHoursFor } from '../lib/commerce'
import './hr.css'

const pad = (n) => String(n).padStart(2, '0')
const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toMin = (s) => (/^\d{2}:\d{2}$/.test(s || '') ? +s.slice(0, 2) * 60 + +s.slice(3) : null)
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`
const fmtDay = (iso, opts = { day: 'numeric', month: 'long' }) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', opts) : '')
const hours = (n) => `${Math.round(n * 10) / 10} h`
const waLink = (phone) => {
  const d = (phone || '').replace(/\D/g, '').slice(-10)
  return d.length === 10 ? `https://wa.me/52${d}` : ''
}
const yearsLabel = (y) => (y === 1 ? '1 año' : `${y} años`)

const DUTIES_KEY = 'ap_hr_duties'
const readDuties = () => {
  try {
    return JSON.parse(localStorage.getItem(DUTIES_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

const EMPTY = {
  name: '', position: '', area: 'produccion', userId: '', phone: '', email: '', startDate: '', birthday: '',
  salaryMonthly: '', payPeriod: 'semanal', commissionPct: '', imss: true, active: true, notes: ''
}

const TABS = [
  { id: 'personal', name: 'Personal' },
  { id: 'asistencia', name: 'Asistencia' },
  { id: 'nomina', name: 'Nómina' },
  { id: 'ley', name: 'Ley y ajustes' }
]

export default function HR({ settings, onSettings, canEdit }) {
  const hr = useMemo(() => mergeHr(settings?.hr || HR_DEFAULTS), [settings])
  const [tab, setTab] = useState('personal')
  const [employees, setEmployees] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const [list, users] = await Promise.all([api.list('employees'), api.people().catch(() => [])])
      setEmployees(Array.isArray(list) ? list : [])
      setPeople(Array.isArray(users) ? users : [])
    } catch (e) {
      setError(e.message || 'No se pudo cargar el personal')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const active = employees.filter((e) => e.active !== false)

  return (
    <div className="hr">
      <div className="row between wrap">
        <div className="switch small hr-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.name}</button>
          ))}
        </div>
        {!canEdit && <span className="muted small">Solo lectura: pide el permiso de RRHH para hacer cambios.</span>}
      </div>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Cargando personal…</p>
      ) : (
        <>
          {tab === 'personal' && <Staff employees={employees} people={people} hr={hr} canEdit={canEdit} onChanged={load} />}
          {tab === 'asistencia' && <Attendance employees={active} hr={hr} canEdit={canEdit} />}
          {tab === 'nomina' && <Payroll employees={active} hr={hr} />}
          {tab === 'ley' && <Law hr={hr} settings={settings} onSettings={onSettings} canEdit={canEdit} />}
        </>
      )}
    </div>
  )
}

// ---------- Personal ----------
function Staff({ employees, people, hr, canEdit, onChanged }) {
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState('')
  const [ref, setRef] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const month = new Date().getMonth() + 1

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const openNew = () => { setForm(EMPTY); setEditId(''); setRef(''); setError('') }
  const openEdit = (e) => {
    setForm({ ...EMPTY, ...e, salaryMonthly: e.salaryMonthly || '', commissionPct: e.commissionPct || '' })
    setEditId(e.id)
    setRef('')
    setError('')
  }
  const close = () => { setForm(null); setEditId('') }

  const pickRef = (i) => {
    setRef(i)
    const r = JOB_REFS[+i]
    if (r) setForm({ ...form, position: r.position, area: r.area, salaryMonthly: r.monthly })
  }

  const save = async (ev) => {
    ev.preventDefault()
    if (!form.name.trim()) return setError('Escribe el nombre')
    setBusy(true)
    setError('')
    try {
      const body = { ...form, salaryMonthly: Number(form.salaryMonthly) || 0, commissionPct: Number(form.commissionPct) || 0 }
      delete body.id
      delete body.createdAt
      if (editId) await api.update('employees', editId, body)
      else await api.create('employees', body)
      close()
      await onChanged()
    } catch (e) {
      setError(e.message || 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`¿Eliminar a ${form.name}? Si ya no trabaja aquí, mejor márcalo como inactivo para conservar su historial.`)) return
    setBusy(true)
    try {
      await api.remove('employees', editId)
      close()
      await onChanged()
    } catch (e) {
      setError(e.message || 'No se pudo eliminar')
    } finally {
      setBusy(false)
    }
  }

  const daily = form ? (Number(form.salaryMonthly) || 0) / 30 : 0
  const userName = (id) => people.find((p) => p.id === id)?.name || ''
  const bdays = employees.filter((e) => e.active !== false && e.birthday && +e.birthday.slice(5, 7) === month)
  const sorted = [...employees].sort((a, b) => (b.active !== false) - (a.active !== false) || a.name.localeCompare(b.name))
  const r = ref !== '' ? JOB_REFS[+ref] : null

  return (
    <>
      <div className="kpis">
        <div className="kpi"><span>Personas activas</span><strong>{employees.filter((e) => e.active !== false).length}</strong></div>
        <div className="kpi"><span>Sueldos al mes</span><strong>{money(employees.filter((e) => e.active !== false).reduce((s, e) => s + (e.salaryMonthly || 0), 0))}</strong></div>
        <div className="kpi"><span>Cumpleaños este mes</span><strong>{bdays.length}</strong></div>
      </div>

      {bdays.length > 0 && (
        <p className="notice small">
          Cumpleaños del mes: {bdays.map((e) => `${e.name} (${fmtDay(e.birthday, { day: 'numeric', month: 'long' })})`).join(', ')}.
        </p>
      )}

      {canEdit && !form && (
        <div><button className="btn primary sm" onClick={openNew}>Agregar persona</button></div>
      )}

      {form && (
        <form className="card lead-form" onSubmit={save}>
          <div className="row between" style={{ width: '100%' }}>
            <h2>{editId ? `Editar a ${form.name || 'persona'}` : 'Nueva persona'}</h2>
            <button type="button" className="link-btn" onClick={close}>Cancelar</button>
          </div>
          <label className="field" style={{ width: '100%', marginBottom: 0 }}>
            <span>Puesto de referencia (llena puesto, área y sueldo)</span>
            <select className="input" value={ref} onChange={(e) => pickRef(e.target.value)}>
              <option value="">Elegir un puesto típico…</option>
              {JOB_REFS.map((j, i) => <option key={j.position} value={i}>{j.position} · {money(j.monthly)}/mes</option>)}
            </select>
          </label>
          {r && (
            <div className="hr-ref">
              Rango de mercado para <b>{r.position}</b>: {r.range} al mes.{' '}
              <a href={r.url} target="_blank" rel="noreferrer">Ver fuente</a>
            </div>
          )}
          <div className="lead-grid">
            <input className="input" placeholder="Nombre completo *" value={form.name} onChange={set('name')} maxLength={80} />
            <input className="input" placeholder="Puesto" value={form.position} onChange={set('position')} maxLength={60} />
            <select className="input" value={form.area} onChange={set('area')}>
              {AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input className="input" placeholder="WhatsApp (10 dígitos)" inputMode="tel" value={form.phone} onChange={set('phone')} maxLength={30} />
            <input className="input" placeholder="Correo" type="email" value={form.email} onChange={set('email')} maxLength={120} />
            <select className="input" value={form.userId} onChange={set('userId')}>
              <option value="">Sin usuario del panel</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}{p.role ? ` · ${p.role}` : ''}</option>)}
            </select>
            <label className="field"><span>Fecha de ingreso</span><input className="input" type="date" value={form.startDate} onChange={set('startDate')} /></label>
            <label className="field"><span>Cumpleaños</span><input className="input" type="date" value={form.birthday} onChange={set('birthday')} /></label>
            <label className="field"><span>Sueldo mensual</span><input className="input" type="number" min="0" step="50" value={form.salaryMonthly} onChange={set('salaryMonthly')} /></label>
            <label className="field">
              <span>Pago</span>
              <select className="input" value={form.payPeriod} onChange={set('payPeriod')}>
                {PAY_PERIODS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Comisión sobre ventas (%)</span><input className="input" type="number" min="0" max="50" step="0.5" value={form.commissionPct} onChange={set('commissionPct')} /></label>
            <div className="field">
              <label className="hr-check"><input type="checkbox" checked={form.imss} onChange={set('imss')} /> Dado de alta en el IMSS</label>
              <label className="hr-check"><input type="checkbox" checked={form.active} onChange={set('active')} /> Trabaja actualmente</label>
            </div>
          </div>
          {daily > 0 && (
            <p className={`small ${daily < hr.minWageDaily ? 'warn-text' : 'muted'}`}>
              Salario diario: {money(daily)}.{' '}
              {daily < hr.minWageDaily ? `Está por debajo del mínimo legal (${money(hr.minWageDaily)} diarios, ${money(hr.minWageDaily * 30)} al mes).` : 'Cumple con el salario mínimo.'}
            </p>
          )}
          <textarea className="input" rows={2} placeholder="Notas (horario, talla de uniforme, contacto de emergencia…)" value={form.notes} onChange={set('notes')} maxLength={1000} />
          {error && <p className="error">{error}</p>}
          <div className="row wrap">
            <button className="btn primary sm" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
            {editId && <button type="button" className="link-btn danger" onClick={remove} disabled={busy}>Eliminar</button>}
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="muted">Todavía no hay personas registradas.{canEdit ? ' Agrega a tu primer colaborador.' : ''}</p>
      ) : (
        <div className="hr-grid">
          {sorted.map((e) => {
            const area = areaById(e.area)
            const y = seniorityYears(e.startDate)
            const wa = waLink(e.phone)
            const bday = e.active !== false && e.birthday && +e.birthday.slice(5, 7) === month
            const low = e.salaryMonthly > 0 && e.salaryMonthly / 30 < hr.minWageDaily
            return (
              <div key={e.id} className={`hr-card${e.active === false ? ' off' : ''}${bday ? ' bday' : ''}`}>
                <div className="row between">
                  <strong>{e.name}</strong>
                  {canEdit && <button className="link-btn" onClick={() => openEdit(e)}>Editar</button>}
                </div>
                <span>{e.position || 'Sin puesto'}</span>
                <span className="muted"><i className="hr-dot" style={{ background: area.color }} />{area.name}</span>
                <span className="muted">
                  {e.startDate ? `Antigüedad: ${y < 1 ? 'menos de 1 año' : yearsLabel(y)} · desde ${fmtDay(e.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Sin fecha de ingreso'}
                </span>
                {e.userId && <span className="muted">Usuario: {userName(e.userId) || 'no encontrado'}</span>}
                {e.salaryMonthly > 0 && <span className={low ? 'warn-text' : 'muted'}>{money(e.salaryMonthly)}/mes{low ? ' · abajo del mínimo' : ''}</span>}
                {wa && <a href={wa} target="_blank" rel="noreferrer">WhatsApp {e.phone}</a>}
                {e.active === false && <span className="muted small">Inactivo</span>}
                {bday && <span className="hr-pill">Cumple el {fmtDay(e.birthday)}</span>}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ---------- Asistencia ----------
function Attendance({ employees, hr, canEdit }) {
  const today = localDay()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [date, setDate] = useState(today)
  const [records, setRecords] = useState([])
  const [drafts, setDrafts] = useState({})
  const [lateAt, setLateAt] = useState('09:10')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const legal = weeklyHoursFor(new Date().getFullYear())

  const load = async (m) => {
    setLoading(true)
    setError('')
    try {
      const list = await api.attendance(m)
      setRecords(Array.isArray(list) ? list : [])
      setDrafts({})
    } catch (e) {
      setError(e.message || 'No se pudo cargar la asistencia')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { if (/^\d{4}-\d{2}$/.test(month)) load(month) }, [month])

  const changeMonth = (m) => {
    setMonth(m)
    if (m && date.slice(0, 7) !== m) setDate(m === today.slice(0, 7) ? today : `${m}-01`)
  }

  const rec = (id, d = date) => records.find((r) => r.employeeId === id && r.date === d)
  const row = (id) => drafts[id] || { in: rec(id)?.in || '', out: rec(id)?.out || '', note: rec(id)?.note || '' }
  const edit = (id, k, v) => setDrafts({ ...drafts, [id]: { ...row(id), [k]: v } })
  const dirty = (id) => {
    if (!drafts[id]) return false
    const r = rec(id) || {}
    return ['in', 'out', 'note'].some((k) => (drafts[id][k] || '') !== (r[k] || ''))
  }

  const save = async (id) => {
    const d = row(id)
    setSaving(id)
    setError('')
    try {
      await api.saveAttendance({ employeeId: id, date, in: d.in, out: d.out, note: d.note })
      const list = await api.attendance(month)
      setRecords(Array.isArray(list) ? list : [])
      const rest = { ...drafts }
      delete rest[id]
      setDrafts(rest)
    } catch (e) {
      setError(e.message || 'No se pudo guardar')
    } finally {
      setSaving('')
    }
  }

  const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

  // Semana (lunes a domingo) de la fecha elegida, dentro del mes cargado
  const week = useMemo(() => {
    const d = new Date(`${date}T00:00:00`)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(monday); x.setDate(monday.getDate() + i); return localDay(x) })
  }, [date])
  const weekHours = (id) => records.filter((r) => r.employeeId === id && week.includes(r.date)).reduce((s, r) => s + workedHours(r), 0)

  const lateMin = toMin(lateAt) ?? 550
  const summary = employees.map((e) => {
    const mine = records.filter((r) => r.employeeId === e.id)
    const worked = mine.filter((r) => r.in)
    const ins = worked.map((r) => toMin(r.in)).filter((m) => m !== null)
    return {
      e,
      days: worked.length,
      hours: mine.reduce((s, r) => s + workedHours(r), 0),
      avgIn: ins.length ? fromMin(ins.reduce((a, b) => a + b, 0) / ins.length) : '—',
      late: ins.filter((m) => m > lateMin).length
    }
  })

  const weekCrossesMonth = week.some((d) => d.slice(0, 7) !== month)

  return (
    <>
      <div className="card">
        <div className="row wrap">
          <label className="field"><span>Mes</span><input className="input" type="month" value={month} onChange={(e) => changeMonth(e.target.value)} /></label>
          <label className="field"><span>Día a registrar</span><input className="input" type="date" value={date} min={`${month}-01`} max={`${month}-31`} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
          <label className="field"><span>Retardo después de</span><input className="input" type="time" value={lateAt} onChange={(e) => setLateAt(e.target.value)} /></label>
        </div>
        <p className="muted small">
          Jornada máxima legal en {new Date().getFullYear()}: {legal} h por semana (tu ajuste: {hr.weeklyHours} h).
          {weekCrossesMonth && ' Esta semana cruza de mes: solo se suman los días del mes cargado.'}
        </p>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Cargando asistencia…</p>
      ) : employees.length === 0 ? (
        <p className="muted">No hay personas activas. Agrégalas en la pestaña Personal.</p>
      ) : (
        <>
          <h3 className="small">Registro del {fmtDay(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <div className="table-wrap">
            <table className="market-table">
              <thead>
                <tr><th>Persona</th><th>Entrada</th><th>Salida</th><th>Nota</th><th className="hr-r">Horas</th><th className="hr-r">Semana</th>{canEdit && <th />}</tr>
              </thead>
              <tbody>
                {employees.map((e) => {
                  const d = row(e.id)
                  const wh = weekHours(e.id)
                  const over = wh > legal
                  return (
                    <tr key={e.id}>
                      <td>{e.name}<div className="muted small">{e.position}</div></td>
                      <td>
                        <input className="input hr-time" type="time" value={d.in} disabled={!canEdit} onChange={(x) => edit(e.id, 'in', x.target.value)} />
                        {canEdit && !d.in && date === today && <div><button className="link-btn" onClick={() => edit(e.id, 'in', nowTime())}>Ahora</button></div>}
                      </td>
                      <td>
                        <input className="input hr-time" type="time" value={d.out} disabled={!canEdit} onChange={(x) => edit(e.id, 'out', x.target.value)} />
                        {canEdit && d.in && !d.out && date === today && <div><button className="link-btn" onClick={() => edit(e.id, 'out', nowTime())}>Ahora</button></div>}
                      </td>
                      <td><input className="input hr-note" value={d.note} disabled={!canEdit} placeholder="Falta, permiso…" maxLength={120} onChange={(x) => edit(e.id, 'note', x.target.value)} /></td>
                      <td className="hr-r">{hours(workedHours(d))}</td>
                      <td className={`hr-r${over ? ' hr-over' : ''}`} title={over ? 'Pasa de la jornada legal: se pagan horas extra' : ''}>{hours(wh)} / {legal}</td>
                      {canEdit && (
                        <td>
                          <button className="btn ghost sm" disabled={!dirty(e.id) || saving === e.id} onClick={() => save(e.id)}>
                            {saving === e.id ? '…' : 'Guardar'}
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {canEdit && <p className="muted small">Para borrar un registro, deja vacías la entrada, la salida y la nota y guarda.</p>}

          <h3 className="small">Resumen de {fmtDay(`${month}-01`, { month: 'long', year: 'numeric' })}</h3>
          <div className="table-wrap">
            <table className="market-table">
              <thead>
                <tr><th>Persona</th><th className="hr-r">Días</th><th className="hr-r">Horas</th><th className="hr-r">Entrada promedio</th><th className="hr-r">Retardos</th></tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.e.id}>
                    <td>{s.e.name}</td>
                    <td className="hr-r">{s.days}</td>
                    <td className="hr-r">{hours(s.hours)}</td>
                    <td className="hr-r">{s.avgIn}</td>
                    <td className={`hr-r${s.late ? ' warn-text' : ''}`}>{s.late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}

// ---------- Nómina ----------
function Payroll({ employees, hr }) {
  const [sales, setSales] = useState({})
  const [copied, setCopied] = useState('')

  const rows = employees.map((e) => ({ e, p: payroll(e, hr, { commissionBase: Number(sales[e.id]) || 0 }) }))
  const sum = (k) => rows.reduce((s, r) => s + (r.p[k] || 0), 0)

  const copy = async () => {
    const lines = [
      `Nómina estimada · ${fmtDay(localDay(), { day: 'numeric', month: 'long', year: 'numeric' })}`,
      '',
      ...rows.map(({ e, p }) => `${e.name} (${p.period}): sueldo ${money(p.salary)}${p.commission ? ` + comisión ${money(p.commission)}` : ''} = ${money(p.pay)}`),
      '',
      `Total a pagar: ${money(sum('pay'))}`,
      `Costo mensual para la empresa: ${money(sum('monthlyCost'))}`,
      '',
      'Estimación. Los recibos CFDI de nómina los timbra el contador.'
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied('Nómina copiada')
    } catch {
      prompt('Copia la nómina:', lines.join('\n'))
    }
    setTimeout(() => setCopied(''), 2500)
  }

  if (!employees.length) return <p className="muted">No hay personas activas para calcular la nómina.</p>

  return (
    <>
      <div className="kpis">
        <div className="kpi"><span>A pagar este periodo</span><strong>{money(sum('pay'))}</strong></div>
        <div className="kpi"><span>Costo mensual empresa</span><strong>{money(sum('monthlyCost'))}</strong></div>
        <div className="kpi"><span>Aguinaldos (diciembre)</span><strong>{money(sum('aguinaldo'))}</strong></div>
      </div>
      <div className="row between wrap">
        <p className="muted small grow">Anota las ventas de cada quien en el periodo para calcular su comisión. No se guardan.</p>
        <div className="row">
          {copied && <span className="small muted">{copied}</span>}
          <button className="btn ghost sm" onClick={copy}>Copiar nómina</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="market-table">
          <thead>
            <tr>
              <th>Persona</th><th>Periodo</th><th className="hr-r">Sueldo</th><th>Ventas para comisión</th><th className="hr-r">Comisión</th>
              <th className="hr-r">Total a pagar</th><th className="hr-r">Costo mensual</th><th className="hr-r">Aguinaldo</th>
              <th className="hr-r">Vacaciones</th><th className="hr-r">Prima vacacional</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, p }) => (
              <tr key={e.id}>
                <td>
                  {e.name}
                  <div className="muted small">{money(p.daily)}/día{e.imss ? '' : ' · sin IMSS'}</div>
                  {p.belowMinimum && <div className="warn-text small">Abajo del salario mínimo</div>}
                </td>
                <td>{p.period}</td>
                <td className="hr-r">{money(p.salary)}</td>
                <td>
                  {e.commissionPct > 0 ? (
                    <input className="input hr-num" type="number" min="0" step="100" placeholder="$0" value={sales[e.id] || ''} onChange={(x) => setSales({ ...sales, [e.id]: x.target.value })} />
                  ) : <span className="muted small">Sin comisión</span>}
                  {e.commissionPct > 0 && <div className="muted small">{e.commissionPct} %</div>}
                </td>
                <td className="hr-r">{money(p.commission)}</td>
                <td className="hr-r"><b>{money(p.pay)}</b></td>
                <td className="hr-r">{money(p.monthlyCost)}</td>
                <td className="hr-r">{money(p.aguinaldo)}</td>
                <td className="hr-r">{p.vacationDays ? `${p.vacationDays} días` : <span className="muted">Aún no</span>}</td>
                <td className="hr-r">{money(p.vacationPremium)}</td>
              </tr>
            ))}
            <tr className="hr-total">
              <td>Total</td><td /><td className="hr-r">{money(sum('salary'))}</td><td /><td className="hr-r">{money(sum('commission'))}</td>
              <td className="hr-r">{money(sum('pay'))}</td><td className="hr-r">{money(sum('monthlyCost'))}</td><td className="hr-r">{money(sum('aguinaldo'))}</td>
              <td /><td className="hr-r">{money(sum('vacationPremium'))}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="notice small">
        Es una estimación para planear pagos: no incluye retenciones de ISR ni cuotas obreras del IMSS.
        Cada pago necesita su recibo CFDI de nómina, que timbra tu contador. El costo mensual usa el factor patronal de {hr.employerFactor} para quien está en el IMSS.
      </p>
    </>
  )
}

// ---------- Ley y ajustes ----------
const HR_FIELDS = [
  { k: 'minWageDaily', label: 'Salario mínimo diario', step: '0.01' },
  { k: 'aguinaldoDays', label: 'Días de aguinaldo', step: '1' },
  { k: 'vacationPremiumPct', label: 'Prima vacacional (%)', step: '1' },
  { k: 'employerFactor', label: 'Factor de costo patronal', step: '0.01' },
  { k: 'weeklyHours', label: 'Horas por semana', step: '1' }
]

function Law({ hr, settings, onSettings, canEdit }) {
  const [form, setForm] = useState(hr)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(readDuties)
  const year = new Date().getFullYear()

  useEffect(() => { setForm(hr) }, [hr])

  const save = async (ev) => {
    ev.preventDefault()
    setBusy(true)
    setError('')
    setMsg('')
    try {
      const payload = Object.fromEntries(HR_FIELDS.map(({ k }) => [k, Number(form[k])]))
      const saved = await api.saveHr(payload)
      onSettings?.({ ...settings, hr: saved || mergeHr(payload) })
      setMsg('Ajustes guardados')
    } catch (e) {
      setError(e.message || 'No se pudo guardar')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (i) => {
    const next = { ...done, [i]: !done[i] }
    setDone(next)
    try { localStorage.setItem(DUTIES_KEY, JSON.stringify(next)) } catch { /* sin almacenamiento */ }
  }

  const doneCount = HR_DUTIES.filter((_, i) => done[i]).length

  return (
    <div className="admin-grid">
      <form className="card" onSubmit={save}>
        <h2>Ajustes de RRHH</h2>
        <div className="hr-settings">
          {HR_FIELDS.map(({ k, label, step }) => (
            <label key={k} className="field">
              <span>{label}</span>
              <input className="input" type="number" min="0" step={step} value={form[k]} disabled={!canEdit} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <p className="muted small">
          Salario mínimo 2026: {money(MIN_WAGE_2026.general)} general y {money(MIN_WAGE_2026.frontera)} en la zona libre de la frontera norte (diario).{' '}
          <a href={MIN_WAGE_2026.url} target="_blank" rel="noreferrer">Fuente</a>
        </p>
        <p className="muted small">Jornada legal en {year}: {weeklyHoursFor(year)} h; en {year + 1}: {weeklyHoursFor(year + 1)} h.</p>
        {canEdit && (
          <div className="row wrap">
            <button className="btn primary sm" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
            <button type="button" className="link-btn" onClick={() => setForm(HR_DEFAULTS)}>Volver a los valores de ley</button>
            {msg && <span className="small muted">{msg}</span>}
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </form>

      <div className="card">
        <h2>Obligaciones del patrón · {doneCount} de {HR_DUTIES.length}</h2>
        <ul className="hr-duties">
          {HR_DUTIES.map((d, i) => (
            <li key={d.title}>
              <label className={done[i] ? 'done' : ''}>
                <input type="checkbox" checked={Boolean(done[i])} onChange={() => toggle(i)} />
                <span>{d.title} · <a href={d.url} target="_blank" rel="noreferrer">fuente</a></span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Vacaciones por antigüedad</h2>
        <div className="table-wrap">
          <table className="market-table">
            <thead><tr><th>Años cumplidos</th><th className="hr-r">Días</th></tr></thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((y) => (
                <tr key={y}><td>{yearsLabel(y)}</td><td className="hr-r">{vacationDays(y)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted small">LFT art. 76 (reforma 2023). Más la prima vacacional de al menos {hr.vacationPremiumPct} %.</p>
      </div>
    </div>
  )
}
