import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { EXPENSE_CATEGORIES, breakEven, expenseName, mergeHr, monthReport, payroll } from '../lib/business'
import { costEstimate } from '../lib/costs'
import { money } from '../lib/pricing'
import { BRAND } from '../lib/brand'

const thisMonth = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' }).slice(0, 7)
const prevMonths = (m, n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${m}-15T12:00:00`)
    d.setMonth(d.getMonth() - (n - 1 - i))
    return d.toISOString().slice(0, 7)
  })
const short = (v) => (Math.abs(v) >= 1000 ? `${v < 0 ? '−' : ''}$${Math.round(Math.abs(v) / 100) / 10}k` : money(v))
const monthName = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
const EMPTY = { date: '', category: 'material', amount: '', concept: '', supplier: '', recurring: false }
const waLink = (phone, text) => {
  const d = String(phone || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d.length === 10 ? '52' : ''}${d}?text=${encodeURIComponent(text)}` : null
}

// Administración y finanzas: estado de resultados, gastos, cuentas por cobrar, comisiones y punto de equilibrio
export default function Finance({ orders = [], settings }) {
  const [month, setMonth] = useState(thisMonth)
  const [expenses, setExpenses] = useState(null)
  const [employees, setEmployees] = useState([])
  const [people, setPeople] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [msg, setMsg] = useState('')
  const hr = mergeHr(settings?.hr)

  const load = useCallback(async () => {
    try {
      const [x, e, p] = await Promise.all([api.list('expenses'), api.list('employees').catch(() => []), api.people()])
      setExpenses(x)
      setEmployees(e)
      setPeople(p)
    } catch (err) {
      setMsg(err.message)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const materialCost = useCallback(
    (o) => (o.design?.kind === 'led' ? costEstimate(o.design, settings?.costs).total * (o.quote?.quantity || 1) : 0),
    [settings?.costs]
  )
  const reports = useMemo(
    () => (expenses ? prevMonths(month, 6).map((m) => monthReport(m, { orders, expenses, employees, hr, materialCost })) : []),
    [expenses, employees, orders, month, hr, materialCost]
  )
  if (!expenses) return <p className="muted">{msg || 'Cargando finanzas…'}</p>
  const r = reports[reports.length - 1]
  const maxBar = Math.max(1, ...reports.map((x) => Math.max(x.sales, x.materials + x.expenses + x.payroll)))

  // Punto de equilibrio con los gastos fijos del mes (renta, servicios, nómina, impuestos, recurrentes)
  const fixed = ['renta', 'servicios', 'impuestos'].reduce((s, k) => s + (r.byCategory[k] || 0), 0) + (r.payroll || r.byCategory.nomina || 0)
  const live = orders.filter((o) => o.status !== 'cancelado' && o.totals)
  const avgTicket = live.length ? live.reduce((s, o) => s + o.totals.subtotal, 0) / live.length : 0
  const avgMaterial = live.length ? live.reduce((s, o) => s + materialCost(o), 0) / live.length : 0
  const be = breakEven(fixed, avgTicket, avgMaterial)

  // Cuentas por cobrar
  const receivable = live.filter((o) => (o.pay?.balance || 0) > 0).sort((a, b) => b.pay.balance - a.pay.balance)

  // Comisiones del mes: pedidos asignados a una persona con % de comisión en su ficha
  const commissions = employees
    .filter((e) => e.active && e.userId && e.commissionPct > 0)
    .map((e) => {
      const sold = live.filter((o) => o.assignee === e.userId && o.createdAt.slice(0, 7) === month)
      const base = sold.reduce((s, o) => s + o.totals.subtotal, 0)
      return { ...e, sold: sold.length, base, amount: Math.round((base * e.commissionPct) / 100) }
    })

  const add = async (ev) => {
    ev.preventDefault()
    setMsg('')
    try {
      await api.create('expenses', { ...form, date: form.date || `${month}-${new Date().getDate().toString().padStart(2, '0')}` })
      setForm({ ...EMPTY, category: form.category })
      await load()
    } catch (err) {
      setMsg(err.message)
    }
  }
  const monthExpenses = expenses.filter((x) => x.date.startsWith(month) || (x.recurring && x.date.slice(0, 7) < month))
  const exportCsv = () => {
    const rows = [['Fecha', 'Categoría', 'Concepto', 'Proveedor', 'Monto', 'Recurrente'], ...monthExpenses.map((x) => [x.date, expenseName(x.category), x.concept, x.supplier, x.amount, x.recurring ? 'sí' : ''])]
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv' }))
    a.download = `gastos-${month}.csv`
    a.click()
  }

  return (
    <div className="finance">
      <div className="row between wrap">
        <label className="field inline"><span>Mes</span><input className="input" type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></label>
        <span className="muted small">Ventas sin IVA por fecha del pedido; material estimado con tu tabla de costos si no registras compras de material.</span>
      </div>
      {msg && <p className="error">{msg}</p>}

      <div className="kpis">
        <div className="kpi"><span>Ventas (sin IVA)</span><strong>{money(r.sales)}</strong></div>
        <div className="kpi"><span>Cobrado</span><strong>{money(r.collected)}</strong></div>
        <div className="kpi"><span>Material</span><strong>{money(r.materials)}</strong></div>
        <div className="kpi"><span>Nómina</span><strong>{money(r.payroll || r.byCategory.nomina || 0)}</strong></div>
        <div className="kpi"><span>Otros gastos</span><strong>{money(r.expenses - (r.byCategory.nomina || 0) - (r.byCategory.material || 0))}</strong></div>
        <div className={`kpi ${r.profit < 0 ? 'hot' : ''}`}><span>Utilidad</span><strong>{money(r.profit)}</strong></div>
        <div className="kpi"><span>Margen</span><strong>{r.marginPct} %</strong></div>
      </div>

      <div className="admin-grid">
        <section className="card">
          <h2>Últimos 6 meses</h2>
          <div className="fin-bars">
            {reports.map((x) => (
              <div key={x.month} className={`fin-bar ${x.month === month ? 'on' : ''}`} onClick={() => setMonth(x.month)} title={`Ventas ${money(x.sales)} · Utilidad ${money(x.profit)}`}>
                <div className="fin-cols">
                  <i className="in" style={{ height: `${(x.sales / maxBar) * 100}%` }} />
                  <i className="out" style={{ height: `${((x.materials + x.expenses + x.payroll) / maxBar) * 100}%` }} />
                </div>
                <span className={x.profit < 0 ? 'warn-text' : ''}>{short(x.profit)}</span>
                <em>{monthName(x.month)}</em>
              </div>
            ))}
          </div>
          <p className="muted small"><span className="dot" style={{ background: '#ec4899' }} /> ventas <span className="dot" style={{ background: '#cbd5e1' }} /> costos y gastos · abajo la utilidad</p>
        </section>

        <section className="card">
          <h2>Estado de resultados · {monthName(month)}</h2>
          <ul className="quote-lines">
            <li><span>Ventas ({r.orders} pedidos)</span><span>{money(r.sales)}</span></li>
            <li><span>− Material {r.byCategory.material ? '(compras registradas)' : '(estimado)'}</span><span>{money(r.materials + (r.byCategory.material || 0))}</span></li>
            <li><span>− Nómina {r.byCategory.nomina ? '(registrada)' : `(estimada, factor ${hr.employerFactor})`}</span><span>{money(r.payroll + (r.byCategory.nomina || 0))}</span></li>
            {Object.entries(r.byCategory).filter(([k]) => !['material', 'nomina'].includes(k)).map(([k, v]) => <li key={k}><span>− {expenseName(k)}</span><span>{money(v)}</span></li>)}
            <li className="total-line"><span>Utilidad antes de impuestos</span><span className={r.profit < 0 ? 'warn-text' : ''}>{money(r.profit)}</span></li>
          </ul>
          <p className="muted small">
            {be
              ? `Punto de equilibrio: ${be} letreros al mes cubren tus gastos fijos (${money(fixed)}) con ticket promedio de ${money(avgTicket)} y material de ${money(avgMaterial)}.`
              : 'Registra gastos fijos y ventas para calcular tu punto de equilibrio.'}
          </p>
        </section>
      </div>

      <section className="card">
        <div className="row between wrap">
          <h2>Gastos del mes</h2>
          {monthExpenses.length > 0 && <button className="btn ghost sm" onClick={exportCsv}>Descargar CSV para el contador</button>}
        </div>
        <form className="fin-form" onSubmit={add}>
          <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Fecha" />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input" placeholder="Concepto" value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
          <input className="input" placeholder="Proveedor" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <input className="input" type="number" min="0" step="0.01" placeholder="Monto *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <label className="check-row"><input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} /><span>Fijo cada mes</span></label>
          <button className="btn primary sm" disabled={!(Number(form.amount) > 0)}>Agregar</button>
        </form>
        <div className="table-wrap">
          <table className="market-table">
            <thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th>Monto</th><th /></tr></thead>
            <tbody>
              {monthExpenses.map((x) => (
                <tr key={x.id}>
                  <td className="nowrap">{x.date}{x.recurring && <span className="muted small"> · fijo</span>}</td>
                  <td>{expenseName(x.category)}</td>
                  <td>{x.concept}{x.supplier && <div className="muted small">{x.supplier}</div>}</td>
                  <td>{money(x.amount)}</td>
                  <td><button className="link-btn danger" onClick={() => confirm('¿Borrar el gasto?') && api.remove('expenses', x.id).then(load)}>Borrar</button></td>
                </tr>
              ))}
              {!monthExpenses.length && <tr><td colSpan="5" className="muted">Sin gastos registrados este mes.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-grid">
        <section className="card">
          <h2>Por cobrar <span className="muted small">{money(receivable.reduce((s, o) => s + o.pay.balance, 0))}</span></h2>
          <ul className="quote-lines">
            {receivable.slice(0, 12).map((o) => {
              const link = waLink(o.customer.phone, `Hola ${o.customer.name.split(' ')[0]}, te escribo de ${settings?.business?.name || BRAND} por tu pedido ${o.folio}. Queda un saldo de ${money(o.pay.balance)}. ¿Te comparto los datos para pagar?`)
              return (
                <li key={o.id}>
                  <span>{o.folio} · {o.customer.name}<em className="muted small"> · {o.status}</em></span>
                  <span className="row">{money(o.pay.balance)}{link && <a className="btn ghost xs" href={link} target="_blank" rel="noreferrer">Cobrar</a>}</span>
                </li>
              )
            })}
            {!receivable.length && <li className="muted">Todo cobrado.</li>}
          </ul>
        </section>
        <section className="card">
          <h2>Comisiones de {monthName(month)}</h2>
          {commissions.length ? (
            <ul className="quote-lines">
              {commissions.map((c) => <li key={c.id}><span>{c.name} · {c.sold} pedidos · {c.commissionPct} % de {money(c.base)}</span><span>{money(c.amount)}</span></li>)}
            </ul>
          ) : (
            <p className="muted small">Asigna pedidos a tus vendedores (en cada pedido → Responsable) y pon su % de comisión en su ficha de RRHH.</p>
          )}
          <p className="muted small">Responsables sin ficha: {people.filter((p) => !employees.some((e) => e.userId === p.id)).map((p) => p.name).join(', ') || 'ninguno'}</p>
        </section>
      </div>

      <section className="card">
        <h2>Costo de nómina</h2>
        <ul className="quote-lines">
          {employees.filter((e) => e.active).map((e) => {
            const p = payroll(e, hr)
            return <li key={e.id}><span>{e.name} · {e.position || 'sin puesto'}{p.belowMinimum && <em className="warn-text"> · debajo del mínimo</em>}</span><span>{money(p.monthlyCost)}/mes</span></li>
          })}
          {!employees.length && <li className="muted">Registra a tu equipo en Recursos humanos para estimar la nómina.</li>}
        </ul>
      </section>
    </div>
  )
}
