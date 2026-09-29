// Áreas del negocio en la API: tareas (delegar), RRHH (personal, asistencia, nómina),
// finanzas (gastos) y marketing (calendario de contenido y cupones).
import crypto from 'node:crypto'
import {
  CASE_PRIORITIES, caseKindName, normalizeCase, slaDue,
  mergeHr, normalizeCoupon, normalizeEmployee, normalizeExpense, normalizePost, normalizeTask, couponCheck, couponLabel
} from '../src/lib/business.js'

// Fecha y hora en México (el servidor puede estar en otra zona)
export const mxNow = () => {
  const s = new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' })
  return { date: s.slice(0, 10), time: s.slice(11, 16) }
}

export function loadBusiness(db) {
  for (const k of ['tasks', 'employees', 'attendance', 'expenses', 'coupons', 'posts', 'cases']) db[k] = Array.isArray(db[k]) ? db[k] : []
  db.settings.hr = mergeHr(db.settings.hr)
}

// Crea un expediente de atención con folio corto (C-0001), fecha límite de respuesta e historial
export function newCase(db, fields, by) {
  const now = new Date().toISOString()
  db.caseSeq = (db.caseSeq || 0) + 1
  const c = {
    id: crypto.randomUUID(),
    code: `C-${String(db.caseSeq).padStart(4, '0')}`,
    ...normalizeCase(fields),
    source: fields.source === 'cliente' ? 'cliente' : 'equipo',
    createdAt: now,
    updatedAt: now,
    firstResponseAt: null,
    resolvedAt: null,
    events: [{ at: now, by, text: fields.message ? String(fields.message).slice(0, 1500) : 'Expediente abierto' }]
  }
  c.dueAt = slaDue(c.priority, now)
  if (!c.title) c.title = caseKindName(c.kind)
  db.cases.unshift(c)
  return c
}

// Cupón válido para un total: { coupon, discountPct, discountAmt } o { error }
export function applyCoupon(db, code, total) {
  if (!code) return {}
  const c = db.coupons.find((x) => x.code === String(code).trim().toUpperCase())
  const r = couponCheck(c, total, mxNow().date)
  return r.ok ? { coupon: c, discountPct: r.discountPct, discountAmt: r.discountAmt } : { error: r.reason }
}

export function registerBusiness(api, { requireUser, need, can, mutate, h, owner }) {
  const people = (db) => [owner, ...db.users.filter((u) => u.active !== false)]
  const personIds = (db) => people(db).map((u) => u.id)

  // Lista mínima de personas para asignar (cualquier usuario con sesión)
  api.get('/admin/people', requireUser, (req, res) =>
    res.json(people(req.db).map((u) => ({ id: u.id, name: u.name, area: u.area || 'direccion', role: u.role })))
  )

  // CRUD genérico para las colecciones de las áreas
  function collection(path, key, normalize, { read, write, validate = () => null, onCreate = () => {}, canEdit = () => true, filter = (list) => list }) {
    api.get(`/admin/${path}`, requireUser, need(...read), (req, res) => res.json(filter(req.db[key], req)))
    api.post(`/admin/${path}`, requireUser, need(...write), h(async (req, res) => {
      const clean = normalize(req.body)
      const err = validate(clean, req)
      if (err) return res.status(400).json({ error: err })
      const item = await mutate((db) => {
        const x = { id: crypto.randomUUID(), ...clean, createdAt: new Date().toISOString(), createdBy: req.user.id }
        const bad = onCreate(x, db, req)
        if (bad) return { save: false, error: bad }
        db[key].unshift(x)
        return x
      })
      if (item.error) return res.status(400).json({ error: item.error })
      res.status(201).json(item)
    }))
    api.patch(`/admin/${path}/:id`, requireUser, need(...write), h(async (req, res) => {
      const result = await mutate((db) => {
        const x = db[key].find((i) => i.id === req.params.id)
        if (!x) return { save: false, missing: true }
        if (!canEdit(x, req)) return { save: false, forbidden: true }
        const clean = normalize({ ...x, ...req.body })
        const err = validate(clean, req, x)
        if (err) return { save: false, error: err }
        Object.assign(x, clean, { updatedAt: new Date().toISOString() })
        return x
      })
      if (result.missing) return res.status(404).json({ error: 'No encontrado' })
      if (result.forbidden) return res.status(403).json({ error: 'No tienes permiso para esta acción' })
      if (result.error) return res.status(400).json({ error: result.error })
      res.json(result)
    }))
    api.delete(`/admin/${path}/:id`, requireUser, need(...write), h(async (req, res) => {
      const result = await mutate((db) => {
        const x = db[key].find((i) => i.id === req.params.id)
        if (!x) return { save: false, missing: true }
        if (!canEdit(x, req)) return { save: false, forbidden: true }
        db[key] = db[key].filter((i) => i !== x)
        return {}
      })
      if (result.missing) return res.status(404).json({ error: 'No encontrado' })
      if (result.forbidden) return res.status(403).json({ error: 'No tienes permiso para esta acción' })
      res.status(204).end()
    }))
  }

  // ---------- Tareas: cualquiera ve y crea las suyas; delegar = asignar y ver todas ----------
  const ALL = [] // sin permiso especial: cualquier usuario con sesión
  const tasksOf = (list, req) => (can(req.user, 'delegar') ? list : list.filter((t) => t.assignee === req.user.id || t.createdBy === req.user.id))
  collection('tasks', 'tasks', normalizeTask, {
    read: ALL,
    write: ALL,
    filter: tasksOf,
    validate: (t, req, prev) => {
      if (!t.title) return 'Escribe la tarea'
      if (!t.assignee) t.assignee = req.user.id
      if (!personIds(req.db).includes(t.assignee)) return 'Esa persona no existe'
      const reassigned = prev ? prev.assignee !== t.assignee : t.assignee !== req.user.id
      if (reassigned && !can(req.user, 'delegar')) return 'Solo quien puede delegar asigna tareas a otros'
      // Fecha en que se terminó
      if (!prev || prev.status !== t.status) t.doneAt = t.status === 'hecha' ? new Date().toISOString() : ''
      return null
    },
    canEdit: (t, req) => can(req.user, 'delegar') || t.assignee === req.user.id || t.createdBy === req.user.id
  })

  // ---------- RRHH ----------
  collection('employees', 'employees', normalizeEmployee, {
    read: ['rrhh', 'finanzas'],
    write: ['rrhh'],
    validate: (e) => (e.name ? null : 'El nombre es obligatorio')
  })

  api.put('/admin/settings/hr', requireUser, need('rrhh'), h(async (req, res) => {
    const hr = await mutate((db) => (db.settings.hr = mergeHr(req.body)))
    res.json(hr)
  }))

  // Asistencia: RRHH ve y corrige todo; cada quien checa su entrada y salida
  api.get('/admin/attendance', requireUser, need('rrhh'), (req, res) => {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : mxNow().date.slice(0, 7)
    res.json(req.db.attendance.filter((a) => a.date.startsWith(month)))
  })
  const hhmm = (v) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v || '') ? v : '')
  api.post('/admin/attendance', requireUser, need('rrhh'), h(async (req, res) => {
    const { employeeId, date, in: tin, out, note } = req.body || {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'Fecha inválida' })
    const rec = await mutate((db) => {
      if (!db.employees.some((e) => e.id === employeeId)) return { save: false, error: 'Empleado no encontrado' }
      let r = db.attendance.find((a) => a.employeeId === employeeId && a.date === date)
      if (!r) db.attendance.push((r = { id: crypto.randomUUID(), employeeId, date }))
      Object.assign(r, { in: hhmm(tin), out: hhmm(out), note: String(note || '').slice(0, 200), by: req.user.name })
      if (!r.in && !r.out && !r.note) db.attendance = db.attendance.filter((a) => a !== r)
      return r
    })
    if (rec.error) return res.status(400).json({ error: rec.error })
    res.json(rec)
  }))

  // Mi día: mi ficha (sin sueldo), mi asistencia de hoy y mis tareas abiertas
  api.get('/admin/myday', requireUser, (req, res) => {
    const emp = req.db.employees.find((e) => e.userId === req.user.id && e.active)
    const today = mxNow().date
    res.json({
      user: { id: req.user.id, name: req.user.name, area: req.user.area || 'direccion' },
      employee: emp ? { id: emp.id, name: emp.name, position: emp.position, area: emp.area } : null,
      today: emp ? req.db.attendance.find((a) => a.employeeId === emp.id && a.date === today) || null : null,
      openTasks: req.db.tasks.filter((t) => t.assignee === req.user.id && t.status !== 'hecha').length
    })
  })

  api.post('/admin/clock', requireUser, h(async (req, res) => {
    const { date, time } = mxNow()
    const rec = await mutate((db) => {
      const emp = db.employees.find((e) => e.userId === req.user.id && e.active)
      if (!emp) return { save: false, error: 'Tu usuario no está ligado a una ficha de empleado (pídelo a RRHH)' }
      let r = db.attendance.find((a) => a.employeeId === emp.id && a.date === date)
      if (!r) {
        r = { id: crypto.randomUUID(), employeeId: emp.id, date, in: time, out: '', note: '', by: req.user.name }
        db.attendance.push(r)
      } else if (!r.out) r.out = time
      else return { save: false, error: 'Ya registraste tu entrada y salida de hoy' }
      return r
    })
    if (rec.error) return res.status(400).json({ error: rec.error })
    res.json(rec)
  }))

  // ---------- Atención y garantía ----------
  const CASE_PERMS = ['atencion', 'pedidos']
  api.get('/admin/cases', requireUser, need(...CASE_PERMS), (req, res) => res.json(req.db.cases))
  api.post('/admin/cases', requireUser, need(...CASE_PERMS), h(async (req, res) => {
    const c = await mutate((db) => {
      const o = req.body?.orderId ? db.orders.find((x) => x.id === req.body.orderId) : null
      return newCase(db, { ...req.body, folio: o?.folio || req.body?.folio, contact: o ? { name: o.customer.name, phone: o.customer.phone } : req.body?.contact }, req.user.name)
    })
    res.status(201).json(c)
  }))
  api.patch('/admin/cases/:id', requireUser, need(...CASE_PERMS), h(async (req, res) => {
    const b = req.body || {}
    const r = await mutate((db) => {
      const c = db.cases.find((x) => x.id === req.params.id)
      if (!c) return { save: false, missing: true }
      const now = new Date().toISOString()
      const next = normalizeCase({ ...c, ...b, warranty: b.warranty ? { ...(c.warranty || {}), ...b.warranty } : c.warranty })
      // No se cierra solo porque alguien respondió: resolver exige describir la resolución
      if (next.status === 'resuelto' && !next.resolution) return { save: false, error: 'Escribe cómo se resolvió antes de cerrar' }
      if (next.owner && ![owner.id, ...db.users.map((u) => u.id)].includes(next.owner)) return { save: false, error: 'Esa persona no existe' }
      const log = []
      if (next.status !== c.status) log.push(`Estado: ${next.status}`)
      if (next.priority !== c.priority) {
        log.push(`Prioridad: ${next.priority}`)
        if (!c.firstResponseAt) c.dueAt = slaDue(next.priority, c.createdAt)
      }
      if (next.owner !== c.owner) log.push(`Responsable: ${[owner, ...db.users].find((u) => u.id === next.owner)?.name || 'sin asignar'}`)
      if (c.warranty && next.warranty && next.warranty.decision !== c.warranty.decision) log.push(`Garantía: ${next.warranty.decision}`)
      const note = String(b.note || '').trim().slice(0, 1500)
      if (note) log.push(note)
      // Primera respuesta del equipo: una nota o sacar el caso de "abierto"
      if (!c.firstResponseAt && (note || next.status !== 'abierto')) c.firstResponseAt = now
      if (next.status === 'resuelto' && c.status !== 'resuelto') c.resolvedAt = now
      if (next.status !== 'resuelto') c.resolvedAt = null
      Object.assign(c, next, { updatedAt: now })
      if (log.length) c.events.push({ at: now, by: req.user.name, text: log.join(' · ') })
      return c
    })
    if (r.missing) return res.status(404).json({ error: 'Expediente no encontrado' })
    if (r.error) return res.status(400).json({ error: r.error })
    res.json(r)
  }))

  // ---------- Finanzas ----------
  collection('expenses', 'expenses', normalizeExpense, {
    read: ['finanzas'],
    write: ['finanzas'],
    validate: (x) => (x.amount > 0 ? null : 'Escribe el monto')
  })

  // ---------- Marketing ----------
  collection('posts', 'posts', normalizePost, {
    read: ['marketing'],
    write: ['marketing'],
    validate: (p) => (p.title ? null : 'Escribe de qué trata la publicación')
  })
  collection('coupons', 'coupons', (c) => ({ ...normalizeCoupon(c), uses: Math.max(0, Math.round(Number(c?.uses) || 0)) }), {
    read: ['marketing', 'ventas'],
    write: ['marketing'],
    validate: (c, req, prev) => {
      if (prev && req.db.coupons.some((x) => x.code === c.code && x.id !== prev.id)) return 'Ese código ya existe'
      if (c.code.length < 3) return 'El código debe tener al menos 3 letras o números'
      if (!c.pct && !c.amount) return 'Pon un % o un monto de descuento'
      return null
    },
    onCreate: (c, db) => {
      c.uses = 0
      return db.coupons.some((x) => x.code === c.code) ? 'Ese código ya existe' : null
    }
  })
}

// Público: “Necesito ayuda” crea un expediente (con pedido si da folio y los 4 últimos dígitos de su WhatsApp)
export function registerPublicHelp(api, { mutate, h, limit, countEvent, normalizePhone }) {
  api.post('/public/help', limit, h(async (req, res) => {
    const b = req.body || {}
    const name = String(b.name || '').trim().slice(0, 80)
    const phone = normalizePhone(b.phone)
    const message = String(b.message || '').trim().slice(0, 1500)
    if (!name) return res.status(400).json({ error: 'Escribe tu nombre', field: 'name' })
    if (phone.error) return res.status(400).json({ error: phone.error, field: 'phone' })
    if (message.length < 5) return res.status(400).json({ error: 'Cuéntanos en qué te ayudamos', field: 'message' })
    const kind = ['consulta', 'cotizacion', 'entrega', 'incidencia', 'garantia'].includes(b.kind) ? b.kind : 'consulta'
    const c = await mutate((db) => {
      const folio = String(b.folio || '').trim().toUpperCase()
      const o = folio ? db.orders.find((x) => x.folio === folio && String(x.customer?.phone || '').replace(/\D/g, '').endsWith(phone.phone.replace(/\D/g, '').slice(-4))) : null
      countEvent(db, 'support_opened')
      return newCase(db, { kind, source: 'cliente', message, orderId: o?.id || '', folio: o ? o.folio : '', contact: { name, phone: phone.phone } }, `Cliente · ${name}`)
    })
    res.status(201).json({ code: c.code, dueAt: c.dueAt, priority: CASE_PRIORITIES.find((p) => p.id === c.priority).name })
  }))
}

// Versión pública (necesita la base cargada sin sesión)
export function registerPublicCoupon(api, { loadDb, h }) {
  api.get('/public/coupon/:code', h(async (req, res) => {
    const db = await loadDb()
    const r = applyCoupon(db, req.params.code, Number(req.query.total) || 0)
    if (r.error) return res.status(400).json({ error: r.error })
    if (!r.coupon) return res.status(404).json({ error: 'Cupón no válido' })
    const c = r.coupon
    res.json({ code: c.code, pct: c.pct, amount: c.amount, minTotal: c.minTotal, label: couponLabel(c) })
  }))
}
