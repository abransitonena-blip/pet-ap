// Áreas del negocio: tareas (delegar), recursos humanos, finanzas y marketing.
// Módulo puro: lo usan el servidor (validación) y el panel (cálculos y vistas).

const text = (v, max) => String(v ?? '').trim().slice(0, max)
const money = (v, max = 1e7) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.round(n * 100) / 100)) : 0
}
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '')
const pick = (list, v, def) => (list.some((x) => x.id === v) ? v : def)

// ---------- Áreas ----------
export const AREAS = [
  { id: 'direccion', name: 'Dirección', color: '#111111' },
  { id: 'ventas', name: 'Ventas y atención', color: '#ec4899' },
  { id: 'produccion', name: 'Producción', color: '#f59e0b' },
  { id: 'diseno', name: 'Diseño', color: '#8b5cf6' },
  { id: 'instalacion', name: 'Instalación y envíos', color: '#0ea5e9' },
  { id: 'marketing', name: 'Marketing', color: '#ef4444' },
  { id: 'rrhh', name: 'Recursos humanos', color: '#22c55e' },
  { id: 'finanzas', name: 'Administración y finanzas', color: '#64748b' }
]
export const areaById = (id) => AREAS.find((a) => a.id === id) || AREAS[0]

// ---------- Tareas (delegar) ----------
export const TASK_STATES = [
  { id: 'pendiente', name: 'Por hacer' },
  { id: 'en_curso', name: 'En curso' },
  { id: 'hecha', name: 'Hecha' }
]
export const PRIORITIES = [
  { id: 'alta', name: 'Alta' },
  { id: 'media', name: 'Media' },
  { id: 'baja', name: 'Baja' }
]

// Tareas que se repiten en un taller de letreros: un clic para delegarlas
export const TASK_TEMPLATES = [
  { title: 'Contestar mensajes de WhatsApp e Instagram', area: 'ventas', priority: 'alta' },
  { title: 'Dar seguimiento a presupuestos enviados sin respuesta', area: 'ventas', priority: 'alta' },
  { title: 'Cobrar saldos pendientes de pedidos terminados', area: 'finanzas', priority: 'alta' },
  { title: 'Probar cadenas de LED y fuente antes de empacar', area: 'produccion', priority: 'alta' },
  { title: 'Tomar foto y video del letrero terminado (de día y de noche)', area: 'marketing', priority: 'media' },
  { title: 'Publicar reel del proceso de armado', area: 'marketing', priority: 'media' },
  { title: 'Pedir opinión y foto al cliente entregado', area: 'ventas', priority: 'media' },
  { title: 'Revisar inventario y hacer pedido a proveedores', area: 'produccion', priority: 'media' },
  { title: 'Registrar gastos de la semana', area: 'finanzas', priority: 'media' },
  { title: 'Revisar asistencia y pagar nómina', area: 'rrhh', priority: 'media' },
  { title: 'Limpiar y calibrar la cortadora láser / CNC', area: 'produccion', priority: 'baja' },
  { title: 'Visitar 5 negocios de la zona con el catálogo impreso', area: 'ventas', priority: 'baja' }
]

export function normalizeTask(t = {}) {
  return {
    title: text(t.title, 140),
    notes: text(t.notes, 1000),
    area: pick(AREAS, t.area, 'direccion'),
    assignee: text(t.assignee, 64),
    due: isDate(t.due) ? t.due : '',
    status: pick(TASK_STATES, t.status, 'pendiente'),
    priority: pick(PRIORITIES, t.priority, 'media'),
    orderId: text(t.orderId, 64)
  }
}

export const taskOverdue = (t, today = new Date().toISOString().slice(0, 10)) => t.status !== 'hecha' && t.due && t.due < today

// ---------- Recursos humanos ----------
export const PAY_PERIODS = [
  { id: 'semanal', name: 'Semanal', days: 7 },
  { id: 'quincenal', name: 'Quincenal', days: 15 },
  { id: 'mensual', name: 'Mensual', days: 30 }
]

// Referencias de ley en México (confírmalas cada año en Configuración → RRHH)
export const HR_DEFAULTS = {
  minWageDaily: 315.04, // salario mínimo general 2026
  aguinaldoDays: 15, // LFT art. 87
  vacationPremiumPct: 25, // LFT art. 80
  employerFactor: 1.35, // costo aproximado para el patrón (IMSS, INFONAVIT, SAR, ISN) sobre el sueldo
  weeklyHours: 48 // jornada máxima vigente (LFT art. 61)
}

export function mergeHr(input = {}) {
  const out = {}
  for (const [k, def] of Object.entries(HR_DEFAULTS)) {
    const n = Number(input?.[k])
    out[k] = Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : def
  }
  return out
}

export function normalizeEmployee(e = {}) {
  return {
    name: text(e.name, 80),
    position: text(e.position, 60),
    area: pick(AREAS, e.area, 'produccion'),
    userId: text(e.userId, 64),
    phone: text(e.phone, 30),
    email: text(e.email, 120),
    startDate: isDate(e.startDate) ? e.startDate : '',
    birthday: isDate(e.birthday) ? e.birthday : '',
    salaryMonthly: money(e.salaryMonthly, 1e6),
    payPeriod: pick(PAY_PERIODS, e.payPeriod, 'semanal'),
    commissionPct: Math.min(50, money(e.commissionPct, 50)),
    imss: e.imss !== false,
    active: e.active !== false,
    notes: text(e.notes, 1000)
  }
}

// Años cumplidos de antigüedad a una fecha
export function seniorityYears(startDate, at = new Date()) {
  if (!isDate(startDate)) return 0
  const s = new Date(`${startDate}T00:00:00`)
  let y = at.getFullYear() - s.getFullYear()
  if (at.getMonth() < s.getMonth() || (at.getMonth() === s.getMonth() && at.getDate() < s.getDate())) y--
  return Math.max(0, y)
}

// Días de vacaciones por año cumplido (LFT art. 76, reforma 2023):
// 12 el primer año, +2 por año hasta 20 (5.º año); después +2 cada 5 años
export function vacationDays(years) {
  if (years < 1) return 0
  if (years <= 5) return 10 + 2 * years
  return 20 + 2 * Math.floor((years - 1) / 5)
}

// Nómina estimada de un empleado para un periodo
export function payroll(e, hr = HR_DEFAULTS, { commissionBase = 0 } = {}) {
  const daily = e.salaryMonthly / 30
  const period = PAY_PERIODS.find((p) => p.id === e.payPeriod) || PAY_PERIODS[0]
  const years = seniorityYears(e.startDate)
  const vac = vacationDays(Math.max(1, years))
  const salary = Math.round(daily * period.days * 100) / 100
  const commission = Math.round(((commissionBase * e.commissionPct) / 100) * 100) / 100
  const monthlyCost = Math.round(e.salaryMonthly * (e.imss ? hr.employerFactor : 1))
  return {
    daily: Math.round(daily * 100) / 100,
    period: period.name,
    salary,
    commission,
    pay: Math.round((salary + commission) * 100) / 100,
    belowMinimum: e.salaryMonthly > 0 && daily < hr.minWageDaily,
    aguinaldo: Math.round(daily * hr.aguinaldoDays),
    vacationDays: years >= 1 ? vacationDays(years) : 0,
    vacationPremium: Math.round(daily * vac * (hr.vacationPremiumPct / 100)),
    monthlyCost,
    years
  }
}

// Horas trabajadas de un registro de asistencia (HH:MM)
export function workedHours(r) {
  const m = (s) => (/^\d{2}:\d{2}$/.test(s || '') ? +s.slice(0, 2) * 60 + +s.slice(3) : null)
  const a = m(r.in)
  const b = m(r.out)
  return a === null || b === null || b <= a ? 0 : Math.round(((b - a) / 60) * 100) / 100
}

// ---------- Finanzas ----------
export const EXPENSE_CATEGORIES = [
  { id: 'material', name: 'Material y componentes' },
  { id: 'renta', name: 'Renta' },
  { id: 'servicios', name: 'Luz, agua, internet' },
  { id: 'nomina', name: 'Nómina y comisiones' },
  { id: 'publicidad', name: 'Publicidad' },
  { id: 'envios', name: 'Envíos y paquetería' },
  { id: 'maquila', name: 'Corte / maquila' },
  { id: 'herramienta', name: 'Herramienta y equipo' },
  { id: 'comisiones', name: 'Comisiones de pago / marketplace' },
  { id: 'impuestos', name: 'Impuestos y contador' },
  { id: 'otros', name: 'Otros' }
]
export const expenseName = (id) => EXPENSE_CATEGORIES.find((c) => c.id === id)?.name || 'Otros'

export function normalizeExpense(x = {}) {
  return {
    date: isDate(x.date) ? x.date : new Date().toISOString().slice(0, 10),
    category: pick(EXPENSE_CATEGORIES, x.category, 'otros'),
    amount: money(x.amount),
    concept: text(x.concept, 120),
    supplier: text(x.supplier, 80),
    recurring: Boolean(x.recurring)
  }
}

// Estado de resultados de un mes (YYYY-MM)
// orders: con totals, payments y costo de material (materialCost opcional, se calcula fuera)
export function monthReport(month, { orders = [], expenses = [], employees = [], hr = HR_DEFAULTS, materialCost = () => 0 }) {
  const inMonth = (iso) => String(iso || '').slice(0, 7) === month
  const live = orders.filter((o) => o.status !== 'cancelado')
  const sold = live.filter((o) => inMonth(o.createdAt))
  const sales = sold.reduce((s, o) => s + (o.totals?.subtotal || 0), 0)
  const collected = orders.flatMap((o) => o.payments || []).filter((p) => inMonth(p.at || p.date)).reduce((s, p) => s + (p.amount || 0), 0)
  const materials = sold.reduce((s, o) => s + materialCost(o), 0)
  const byCategory = {}
  for (const x of expenses.filter((e) => inMonth(e.date))) byCategory[x.category] = (byCategory[x.category] || 0) + x.amount
  // Gastos fijos marcados como recurrentes cuentan cada mes desde que se registraron
  for (const x of expenses.filter((e) => e.recurring && e.date.slice(0, 7) < month)) byCategory[x.category] = (byCategory[x.category] || 0) + x.amount
  // Nómina estimada: solo personal activo que ya trabajaba ese mes
  const started = (e) => String(e.startDate || e.createdAt || '').slice(0, 7) <= month
  const payrollCost = byCategory.nomina ? 0 : employees.filter((e) => e.active && started(e)).reduce((s, e) => s + payroll(e, hr).monthlyCost, 0)
  const expensesTotal = Object.values(byCategory).reduce((a, b) => a + b, 0)
  // El material registrado como gasto sustituye al estimado para no contarlo doble
  const materialsUsed = byCategory.material ? 0 : materials
  const profit = sales - materialsUsed - expensesTotal - payrollCost
  return {
    month,
    orders: sold.length,
    sales: Math.round(sales),
    collected: Math.round(collected),
    materials: Math.round(materialsUsed),
    payroll: Math.round(payrollCost),
    expenses: Math.round(expensesTotal),
    byCategory,
    profit: Math.round(profit),
    marginPct: sales ? Math.round((profit / sales) * 100) : 0
  }
}

// Punto de equilibrio: cuántos letreros al mes para cubrir gastos fijos
export function breakEven(fixedMonthly, avgTicket, avgMaterial) {
  const unit = avgTicket - avgMaterial
  return unit > 0 ? Math.ceil(fixedMonthly / unit) : null
}

// ---------- Marketing ----------
export const LEAD_SOURCES = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'google', name: 'Google / Maps' },
  { id: 'recomendacion', name: 'Me lo recomendaron' },
  { id: 'mercadolibre', name: 'MercadoLibre' },
  { id: 'vi-letrero', name: 'Vi un letrero suyo' },
  { id: 'volante', name: 'Volante / visita' },
  { id: 'otro', name: 'Otro' }
]
export const sourceName = (id) => LEAD_SOURCES.find((s) => s.id === id)?.name || 'Sin dato'

export const CHANNELS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'whatsapp', name: 'WhatsApp (estados / difusión)' },
  { id: 'google', name: 'Google Business' },
  { id: 'ads', name: 'Anuncios pagados' },
  { id: 'mercadolibre', name: 'MercadoLibre' },
  { id: 'calle', name: 'Volanteo / visitas' }
]
export const POST_STATES = [
  { id: 'idea', name: 'Idea' },
  { id: 'programada', name: 'Programada' },
  { id: 'publicada', name: 'Publicada' }
]

export function normalizePost(p = {}) {
  return {
    date: isDate(p.date) ? p.date : new Date().toISOString().slice(0, 10),
    channel: pick(CHANNELS, p.channel, 'instagram'),
    title: text(p.title, 140),
    notes: text(p.notes, 1000),
    status: pick(POST_STATES, p.status, 'idea'),
    budget: money(p.budget),
    assignee: text(p.assignee, 64),
    orderId: text(p.orderId, 64)
  }
}

// Ideas de contenido que funcionan para letreros LED
export const CONTENT_IDEAS = [
  'Timelapse del armado: de la hoja al letrero encendido',
  'Antes y después: la fachada del cliente sin y con letrero',
  'Prueba de día vs. de noche del mismo letrero',
  '“Adivina el negocio” con el letrero apagado y luego encendido',
  'Cómo se ve por detrás: cableado, fuente y garantía',
  'Reseña del cliente con su foto (compra verificada)',
  'Diseña el tuyo en 1 minuto con el configurador (grabación de pantalla)',
  'Comparativa: LED de puntos vs. neón flex vs. lona',
  'Promo de temporada con cupón (Hot Sale, Buen Fin, aperturas)',
  'Letreros para eventos: bodas, XV años, baby shower'
]

// Cupones de descuento para el configurador
export function normalizeCoupon(c = {}) {
  const code = text(c.code, 20).toUpperCase().replace(/[^A-Z0-9-]/g, '')
  return {
    code,
    pct: Math.min(50, money(c.pct, 50)),
    amount: money(c.amount, 1e5),
    minTotal: money(c.minTotal),
    expires: isDate(c.expires) ? c.expires : '',
    maxUses: Math.round(money(c.maxUses, 1e5)),
    active: c.active !== false,
    note: text(c.note, 120)
  }
}

// ¿Aplica el cupón a este total? Devuelve { ok, discountPct, discountAmt, reason }
export function couponCheck(c, total, today = new Date().toISOString().slice(0, 10)) {
  if (!c || !c.active) return { ok: false, reason: 'Cupón no válido' }
  if (c.expires && c.expires < today) return { ok: false, reason: 'El cupón ya venció' }
  if (c.maxUses && (c.uses || 0) >= c.maxUses) return { ok: false, reason: 'El cupón ya se agotó' }
  if (c.minTotal && total < c.minTotal) return { ok: false, reason: `Aplica en compras desde $${c.minTotal.toLocaleString('es-MX')}` }
  return { ok: true, discountPct: c.pct, discountAmt: c.amount }
}
export const couponLabel = (c) => [c.pct ? `${c.pct} %` : '', c.amount ? `$${c.amount.toLocaleString('es-MX')}` : ''].filter(Boolean).join(' + ') + ' de descuento'

// Calendario comercial de México (fechas aproximadas; confírmalas cada año)
export const COMMERCIAL_CALENDAR = [
  { month: 1, name: 'Cuesta de enero: promos para aperturas y “año nuevo, imagen nueva”' },
  { month: 2, name: '14 de febrero: letreros para parejas, cafeterías y florerías' },
  { month: 4, name: 'Temporada de bodas y XV años: letreros para eventos' },
  { month: 5, name: 'Hot Sale (fin de mayo) y 10 de mayo' },
  { month: 6, name: 'Día del Padre: barberías, taquerías, talleres' },
  { month: 8, name: 'Regreso a clases: papelerías y escuelas' },
  { month: 9, name: 'Fiestas patrias: letreros tricolor y promos de septiembre' },
  { month: 11, name: 'El Buen Fin (mediados de noviembre)' },
  { month: 12, name: 'Navidad: regalos personalizados y fachadas de temporada' }
]

// ---------- Atención y garantía (expedientes) ----------
export const CASE_KINDS = [
  { id: 'consulta', name: 'Consulta o ayuda para diseñar' },
  { id: 'cotizacion', name: 'Duda de cotización o cobro' },
  { id: 'entrega', name: 'Entrega o instalación' },
  { id: 'incidencia', name: 'Problema con el letrero' },
  { id: 'garantia', name: 'Garantía' },
  { id: 'acceso', name: 'Recuperar acceso a la cuenta' }
]
export const CASE_PRIORITIES = [
  { id: 'urgente', name: 'Urgente', minutes: 30, note: 'Impide usar el pedido o incidente durante la instalación' },
  { id: 'alta', name: 'Alta', minutes: 120, note: 'Fecha comprometida incumplida o cobro por aclarar' },
  { id: 'normal', name: 'Normal', minutes: 240, note: 'Duda de material, diseño o cotización' }
]
export const CASE_STATES = [
  { id: 'abierto', name: 'Abierto' },
  { id: 'en_proceso', name: 'En proceso' },
  { id: 'esperando', name: 'Esperando al cliente' },
  { id: 'resuelto', name: 'Resuelto' }
]
export const WARRANTY_DECISIONS = [
  { id: 'pendiente', name: 'En revisión' },
  { id: 'aprobada', name: 'Aprobada' },
  { id: 'rechazada', name: 'No aplica' }
]
export const WARRANTY_REMEDIES = [
  { id: '', name: '—' },
  { id: 'reparacion', name: 'Reparación' },
  { id: 'reposicion', name: 'Reposición' },
  { id: 'devolucion', name: 'Devolución' }
]
export const caseKindName = (id) => CASE_KINDS.find((k) => k.id === id)?.name || 'Consulta'
// Prioridad sugerida según el motivo (el equipo la puede cambiar)
export const defaultPriority = (kind) => (kind === 'incidencia' ? 'urgente' : ['garantia', 'cotizacion', 'entrega'].includes(kind) ? 'alta' : 'normal')

// Horario de atención (México, UTC−6 todo el año): lunes a sábado de 9 a 19 h
const MX_OFFSET = -6
const OPEN_H = 9
const CLOSE_H = 19
// Fecha límite de primera respuesta: suma minutos solo dentro del horario de atención
export function slaDue(priority, from = new Date()) {
  const minutes = CASE_PRIORITIES.find((p) => p.id === priority)?.minutes || 240
  let t = new Date(from).getTime() + MX_OFFSET * 3600e3 // hora local como si fuera UTC
  let left = minutes
  for (let guard = 0; left > 0 && guard < 5000; guard++) {
    const d = new Date(t)
    const h = d.getUTCHours() + d.getUTCMinutes() / 60
    if (d.getUTCDay() === 0 || h >= CLOSE_H) {
      d.setUTCDate(d.getUTCDate() + 1)
      d.setUTCHours(OPEN_H, 0, 0, 0)
      t = d.getTime()
      continue
    }
    if (h < OPEN_H) {
      d.setUTCHours(OPEN_H, 0, 0, 0)
      t = d.getTime()
      continue
    }
    const untilClose = (CLOSE_H - h) * 60
    const step = Math.min(left, untilClose)
    t += step * 60e3
    left -= step
  }
  return new Date(t - MX_OFFSET * 3600e3).toISOString()
}

export function normalizeCase(c = {}) {
  const warranty = c.kind === 'garantia'
  return {
    title: text(c.title, 140),
    kind: pick(CASE_KINDS, c.kind, 'consulta'),
    priority: pick(CASE_PRIORITIES, c.priority, defaultPriority(c.kind)),
    status: pick(CASE_STATES, c.status, 'abierto'),
    owner: text(c.owner, 64),
    orderId: text(c.orderId, 64),
    folio: text(c.folio, 20).toUpperCase(),
    contact: { name: text(c.contact?.name, 80), phone: text(c.contact?.phone, 20), email: text(c.contact?.email, 120) },
    nextAction: text(c.nextAction, 200),
    resolution: text(c.resolution, 1000),
    warranty: warranty
      ? { decision: pick(WARRANTY_DECISIONS, c.warranty?.decision, 'pendiente'), remedy: pick(WARRANTY_REMEDIES, c.warranty?.remedy, '') }
      : null
  }
}
export const caseOverdue = (c, now = Date.now()) => c.status !== 'resuelto' && !c.firstResponseAt && c.dueAt && new Date(c.dueAt).getTime() < now
