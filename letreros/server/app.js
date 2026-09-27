// API de AP letreros. La usan server/index.js (Node local / VPS) y api/index.js (Vercel).
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { normalizeDesign } from '../src/lib/design.js'
import { MATERIALS, EXTRAS, quote } from '../src/lib/pricing.js'
import { STATUS_IDS, PRINTED_STATUSES } from '../src/lib/status.js'
import { normalizeLedDesign } from '../src/lib/ledSign.js'
import {
  PERM_IDS, computeTotals, mergeBusiness, mergePrices, normalizeAdjust, normalizePayment, paymentSummary, publicBusiness
} from '../src/lib/prices.js'
import { normalizeCustomer } from '../src/lib/customer.js'
import { store } from './store.js'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
// Estable entre instancias serverless aunque no se defina ADMIN_SECRET
const ADMIN_SECRET =
  process.env.ADMIN_SECRET || crypto.createHash('sha256').update(`letreros:${ADMIN_PASSWORD}`).digest('hex')
const SESSION_HOURS = 12
const QUOTE_STATES = ['pendiente', 'enviada', 'aceptada', 'rechazada']

const MATERIAL_IDS = MATERIALS.map((m) => m.id)
const EXTRA_IDS = EXTRAS.map((e) => e.id)

if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD no está definido; usando "admin123". Cámbialo en producción.')
}

// Cada tipo de letrero tiene su propio modelo y validación
const cleanDesign = (d) => (d?.kind === 'led' ? normalizeLedDesign(d) : normalizeDesign(d, MATERIAL_IDS, EXTRA_IDS))

const addDays = (iso, days) => new Date(new Date(iso).getTime() + days * 86400000).toISOString()

// ---------- Datos ----------
async function loadDb() {
  const db = await store.load()
  db.orders = db.orders || []
  db.users = db.users || []
  db.settings = {
    prices: mergePrices(db.settings?.prices),
    business: mergeBusiness(db.settings?.business)
  }
  // Pedidos de versiones anteriores: diseño válido, token público y totales
  for (const o of db.orders) {
    o.design = cleanDesign(o.design)
    o.publicToken = o.publicToken || crypto.randomBytes(8).toString('hex')
    o.adjust = normalizeAdjust(o.adjust)
    o.quoteState = QUOTE_STATES.includes(o.quoteState) ? o.quoteState : 'pendiente'
    o.validUntil = o.validUntil || addDays(o.createdAt, db.settings.business.validityDays)
    o.totals = o.totals || computeTotals(o.quote, o.adjust, db.settings.business)
    o.payments = Array.isArray(o.payments) ? o.payments : []
    o.showcase = Boolean(o.showcase)
  }
  return db
}

// Serializa las escrituras dentro de la misma instancia
let queue = Promise.resolve()
function mutate(fn) {
  const run = queue.then(async () => {
    const db = await loadDb()
    const result = await fn(db)
    if (result?.save !== false) await store.save(db)
    return result
  })
  queue = run.catch(() => {})
  return run
}

// ---------- Contraseñas y sesiones ----------
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(String(password), salt, 32).toString('hex')}`
}

function checkPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(String(password), salt, 32)
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'))
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

const sign = (payload) => crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url')

function createToken(uid) {
  const payload = Buffer.from(JSON.stringify({ u: uid, e: Date.now() + SESSION_HOURS * 3600 * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function readToken(token) {
  if (typeof token !== 'string') return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.e > Date.now() ? data : null
  } catch {
    return null
  }
}

const OWNER = { id: 'owner', name: 'Dueño', username: 'admin', role: 'dueño', perms: PERM_IDS }
const publicUser = (u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, perms: u.perms, active: u.active !== false })

// Carga la base y el usuario de la sesión (permisos al día: revocar surte efecto de inmediato)
async function requireUser(req, res, next) {
  try {
    const data = readToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''))
    if (!data) return res.status(401).json({ error: 'Sesión inválida o expirada' })
    const db = await loadDb()
    const user = data.u === 'owner' ? OWNER : db.users.find((u) => u.id === data.u && u.active !== false)
    if (!user) return res.status(401).json({ error: 'Usuario desactivado' })
    req.db = db
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

const can = (user, ...perms) => perms.some((p) => user.perms.includes(p))
const need = (...perms) => (req, res, next) =>
  can(req.user, ...perms) ? next() : res.status(403).json({ error: 'No tienes permiso para esta acción' })

// Quita datos que el usuario no debe ver
function viewOrder(o, user) {
  const out = { ...o }
  if (!can(user, 'pedidos')) out.customer = { name: o.customer.name, phone: '', email: '', notes: o.customer.notes }
  if (!can(user, 'ventas', 'presupuestos')) {
    out.quote = { ...o.quote, lines: [], total: 0, unitPrice: 0, subtotal: 0, discount: 0 }
    out.totals = null
    out.payments = []
  } else {
    out.pay = paymentSummary(o.totals, o.payments)
  }
  return out
}

// Límite de intentos por IP (memoria de la instancia): frena fuerza bruta y spam
function rateLimit({ windowMs, max, message }) {
  const hits = new Map()
  return (req, res, next) => {
    const now = Date.now()
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?'
    const list = (hits.get(ip) || []).filter((t) => now - t < windowMs)
    if (list.length >= max) {
      res.set('Retry-After', String(Math.ceil(windowMs / 1000)))
      return res.status(429).json({ error: message })
    }
    list.push(now)
    hits.set(ip, list)
    if (hits.size > 5000) hits.clear()
    next()
  }
}
const loginLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, message: 'Demasiados intentos. Espera unos minutos.' })
const orderLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 15, message: 'Demasiados pedidos seguidos. Intenta más tarde.' })

// Express 4 no captura errores de funciones async
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ---------- Rutas ----------
const api = express.Router()

api.get('/health', (req, res) => res.json({ status: 'ok' }))

// Precios y datos públicos del negocio (el editor los usa para cotizar en vivo)
api.get('/public/settings', h(async (req, res) => {
  const db = await loadDb()
  res.json({ prices: db.settings.prices, business: publicBusiness(db.settings.business) })
}))

// Crear pedido (público)
api.post('/orders', orderLimit, h(async (req, res) => {
  const { design, quantity } = req.body || {}
  const checked = normalizeCustomer(req.body?.customer)
  if (checked.error) return res.status(400).json({ error: checked.error })

  const clean = cleanDesign(design)
  if (!clean.lines.some((l) => l.text.trim() || l.icon)) {
    return res.status(400).json({ error: 'El letrero no tiene texto' })
  }
  if (clean.kind === 'led' && !clean.dots.length) {
    return res.status(400).json({ error: 'El letrero no tiene puntos LED' })
  }

  const order = await mutate((db) => {
    const q = quote({ ...clean, quantity }, db.settings.prices)
    const now = new Date().toISOString()
    db.seq = (db.seq || 0) + 1
    const adjust = normalizeAdjust()
    const o = {
      id: crypto.randomUUID(),
      folio: `LT-${String(db.seq).padStart(4, '0')}`,
      publicToken: crypto.randomBytes(8).toString('hex'),
      createdAt: now,
      updatedAt: now,
      status: 'nuevo',
      quoteState: 'pendiente',
      validUntil: addDays(now, db.settings.business.validityDays),
      customer: checked.customer,
      design: clean,
      quote: q,
      adjust,
      totals: computeTotals(q, adjust, db.settings.business),
      adminNotes: '',
      payments: [],
      showcase: false,
      history: [{ status: 'nuevo', at: now, by: 'Cliente (web)' }]
    }
    db.orders.unshift(o)
    return o
  })
  res.status(201).json({ folio: order.folio, total: order.totals.total, status: order.status, token: order.publicToken })
}))

// Seguimiento público por folio (solo datos no sensibles)
api.get('/track/:folio', h(async (req, res) => {
  const folio = String(req.params.folio).trim().toUpperCase()
  const db = await loadDb()
  const order = db.orders.find((o) => o.folio === folio)
  if (!order) return res.status(404).json({ error: 'No encontramos ese folio' })
  res.json({
    folio: order.folio,
    status: order.status,
    createdAt: order.createdAt,
    history: order.history.map(({ status, at }) => ({ status, at })),
    design: order.design,
    total: order.totals.total,
    quantity: order.quote.quantity
  })
}))

// Galería pública "Hecho por AP": solo el diseño de los trabajos que el negocio decide mostrar
api.get('/public/gallery', h(async (req, res) => {
  const db = await loadDb()
  const items = db.orders
    .filter((o) => o.showcase && o.status !== 'cancelado')
    .slice(0, 24)
    .map((o) => ({ id: o.id.slice(0, 8), design: o.design, at: o.printedAt || o.updatedAt }))
  res.json(items)
}))

// Presupuesto público (enlace privado con token)
function findByToken(db, folio, token) {
  const o = db.orders.find((x) => x.folio === String(folio).toUpperCase())
  if (!o || typeof token !== 'string' || !safeEqual(token, o.publicToken)) return null
  return o
}

function quoteDocument(o, business) {
  return {
    folio: o.folio,
    createdAt: o.createdAt,
    validUntil: o.validUntil,
    status: o.status,
    quoteState: o.quoteState,
    customer: { name: o.customer.name, delivery: o.customer.delivery || 'recoger', date: o.customer.date || '' },
    design: o.design,
    quote: o.quote,
    adjust: { items: o.adjust.items, note: o.adjust.note, discountPct: o.adjust.discountPct, discountAmt: o.adjust.discountAmt },
    totals: o.totals,
    pay: paymentSummary(o.totals, o.payments),
    business: { ...publicBusiness(business), bank: business.bank, terms: business.terms }
  }
}

api.get('/quote/:folio', h(async (req, res) => {
  const db = await loadDb()
  const o = findByToken(db, req.params.folio, req.query.t)
  if (!o) return res.status(404).json({ error: 'Presupuesto no encontrado' })
  res.json(quoteDocument(o, db.settings.business))
}))

api.post('/quote/:folio/respond', h(async (req, res) => {
  const { t, accept } = req.body || {}
  const result = await mutate((db) => {
    const o = findByToken(db, req.params.folio, t)
    if (!o) return { save: false, missing: true }
    if (o.quoteState === 'aceptada') return { save: false, doc: quoteDocument(o, db.settings.business) }
    const now = new Date().toISOString()
    o.quoteState = accept ? 'aceptada' : 'rechazada'
    o.history.push({ status: o.status, at: now, by: 'Cliente', note: accept ? 'Aceptó el presupuesto' : 'Rechazó el presupuesto' })
    if (accept && ['nuevo', 'en_diseno'].includes(o.status)) {
      o.status = 'aprobado'
      o.history.push({ status: 'aprobado', at: now, by: 'Cliente' })
    }
    o.updatedAt = now
    return { doc: quoteDocument(o, db.settings.business) }
  })
  if (result.missing) return res.status(404).json({ error: 'Presupuesto no encontrado' })
  res.json(result.doc)
}))

// ----- Admin -----
api.post('/admin/login', loginLimit, h(async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!password) return res.status(401).json({ error: 'Escribe tu contraseña' })
  if (!username || username === 'admin' || username === 'dueño') {
    if (!safeEqual(password, ADMIN_PASSWORD)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    return res.json({ token: createToken('owner'), expiresInHours: SESSION_HOURS })
  }
  const db = await loadDb()
  const user = db.users.find((u) => u.username === username && u.active !== false)
  if (!user || !checkPassword(password, user.pass)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  res.json({ token: createToken(user.id), expiresInHours: SESSION_HOURS })
}))

api.get('/admin/me', requireUser, (req, res) => res.json(publicUser(req.user)))

api.get('/admin/orders', requireUser, need('pedidos', 'produccion', 'presupuestos'), (req, res) =>
  res.json(req.db.orders.map((o) => viewOrder(o, req.user)))
)

api.get('/admin/stats', requireUser, (req, res) => {
  const { orders } = req.db
  const byStatus = Object.fromEntries(STATUS_IDS.map((s) => [s, 0]))
  let revenue = 0
  let collected = 0
  let receivable = 0
  let printedPieces = 0
  let printedM2 = 0
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1
    if (o.status !== 'cancelado') {
      const pay = paymentSummary(o.totals, o.payments)
      revenue += o.totals.total
      collected += pay.paid
      receivable += pay.balance
    }
    if (PRINTED_STATUSES.includes(o.status)) {
      printedPieces += o.quote.quantity
      printedM2 += o.quote.areaM2 * o.quote.quantity
    }
  }
  const quotes = Object.fromEntries(QUOTE_STATES.map((s) => [s, orders.filter((o) => o.quoteState === s).length]))
  res.json({
    total: orders.length,
    byStatus,
    quotes,
    revenue: can(req.user, 'ventas') ? revenue : null,
    collected: can(req.user, 'ventas') ? Math.round(collected) : null,
    receivable: can(req.user, 'ventas') ? Math.round(receivable) : null,
    printedPieces,
    printedM2: Math.round(printedM2 * 100) / 100
  })
})

api.patch('/admin/orders/:id', requireUser, h(async (req, res) => {
  const { status, adminNotes, adjust, quoteState, showcase } = req.body || {}
  const u = req.user
  if (showcase !== undefined && !can(u, 'editar')) {
    return res.status(403).json({ error: 'No tienes permiso para publicar en la galería' })
  }
  if ((status !== undefined || adminNotes !== undefined) && !can(u, 'editar', 'produccion')) {
    return res.status(403).json({ error: 'No tienes permiso para cambiar el estado' })
  }
  if ((adjust !== undefined || quoteState !== undefined) && !can(u, 'presupuestos')) {
    return res.status(403).json({ error: 'No tienes permiso para editar presupuestos' })
  }
  if (status !== undefined && !STATUS_IDS.includes(status)) return res.status(400).json({ error: 'Estado inválido' })
  if (quoteState !== undefined && !QUOTE_STATES.includes(quoteState)) return res.status(400).json({ error: 'Estado de presupuesto inválido' })

  const order = await mutate((db) => {
    const o = db.orders.find((x) => x.id === req.params.id)
    if (!o) return { save: false, missing: true }
    const now = new Date().toISOString()
    if (status !== undefined && status !== o.status) {
      o.status = status
      o.history.push({ status, at: now, by: u.name })
      if (status === 'impreso' && !o.printedAt) o.printedAt = now
    }
    if (showcase !== undefined) o.showcase = Boolean(showcase)
    if (adminNotes !== undefined) o.adminNotes = String(adminNotes).slice(0, 2000)
    if (adjust !== undefined) {
      o.adjust = normalizeAdjust(adjust)
      o.totals = computeTotals(o.quote, o.adjust, db.settings.business)
      o.validUntil = addDays(now, db.settings.business.validityDays)
      o.history.push({ status: o.status, at: now, by: u.name, note: `Presupuesto ajustado: total ${o.totals.total}` })
    }
    if (quoteState !== undefined && quoteState !== o.quoteState) {
      o.quoteState = quoteState
      o.history.push({ status: o.status, at: now, by: u.name, note: `Presupuesto ${quoteState}` })
    }
    o.updatedAt = now
    return o
  })
  if (order.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  res.json(viewOrder(order, u))
}))

// Pagos y anticipos
api.post('/admin/orders/:id/payments', requireUser, need('ventas', 'presupuestos'), h(async (req, res) => {
  const checked = normalizePayment(req.body)
  if (checked.error) return res.status(400).json({ error: checked.error })
  const u = req.user
  const order = await mutate((db) => {
    const o = db.orders.find((x) => x.id === req.params.id)
    if (!o) return { save: false, missing: true }
    const now = new Date().toISOString()
    o.payments.push({ id: crypto.randomUUID(), ...checked.payment, at: now, by: u.name })
    const pay = paymentSummary(o.totals, o.payments)
    o.history.push({ status: o.status, at: now, by: u.name, note: `Pago de $${checked.payment.amount} (${checked.payment.method}) · saldo $${pay.balance}` })
    o.updatedAt = now
    return o
  })
  if (order.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  res.status(201).json(viewOrder(order, u))
}))

api.delete('/admin/orders/:id/payments/:pid', requireUser, need('ventas', 'presupuestos'), h(async (req, res) => {
  const u = req.user
  const order = await mutate((db) => {
    const o = db.orders.find((x) => x.id === req.params.id)
    const p = o?.payments.find((x) => x.id === req.params.pid)
    if (!p) return { save: false, missing: true }
    const now = new Date().toISOString()
    o.payments = o.payments.filter((x) => x !== p)
    o.history.push({ status: o.status, at: now, by: u.name, note: `Pago de $${p.amount} eliminado` })
    o.updatedAt = now
    return o
  })
  if (order.missing) return res.status(404).json({ error: 'Pago no encontrado' })
  res.json(viewOrder(order, u))
}))

api.delete('/admin/orders/:id', requireUser, need('eliminar'), h(async (req, res) => {
  const result = await mutate((db) => {
    const before = db.orders.length
    db.orders = db.orders.filter((o) => o.id !== req.params.id)
    return db.orders.length === before ? { save: false, missing: true } : {}
  })
  if (result.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  res.status(204).end()
}))

// Ajustes: precios y datos del negocio
api.get('/admin/settings', requireUser, (req, res) => res.json(req.db.settings))

api.put('/admin/settings/prices', requireUser, need('precios'), h(async (req, res) => {
  const settings = await mutate((db) => {
    db.settings.prices = mergePrices(req.body)
    db.settings.pricesUpdated = { at: new Date().toISOString(), by: req.user.name }
    return db.settings
  })
  res.json(settings)
}))

api.put('/admin/settings/business', requireUser, need('ajustes'), h(async (req, res) => {
  const settings = await mutate((db) => {
    db.settings.business = mergeBusiness(req.body)
    return db.settings
  })
  res.json(settings)
}))

// Equipo: usuarios con permisos
const cleanUsername = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30)

api.get('/admin/users', requireUser, need('equipo'), (req, res) => res.json(req.db.users.map(publicUser)))

api.post('/admin/users', requireUser, need('equipo'), h(async (req, res) => {
  const { name, username, password, role, perms } = req.body || {}
  const uname = cleanUsername(username)
  if (!String(name || '').trim() || !uname) return res.status(400).json({ error: 'Nombre y usuario son obligatorios' })
  if (['admin', 'dueño', 'owner'].includes(uname)) return res.status(400).json({ error: 'Ese usuario está reservado' })
  if (String(password || '').length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  const result = await mutate((db) => {
    if (db.users.some((u) => u.username === uname)) return { save: false, error: 'Ese usuario ya existe' }
    const user = {
      id: crypto.randomUUID(),
      name: String(name).trim().slice(0, 60),
      username: uname,
      role: String(role || 'personalizado').slice(0, 30),
      perms: (Array.isArray(perms) ? perms : []).filter((p) => PERM_IDS.includes(p)),
      pass: hashPassword(password),
      active: true,
      createdAt: new Date().toISOString()
    }
    db.users.push(user)
    return { user }
  })
  if (result.error) return res.status(400).json({ error: result.error })
  res.status(201).json(publicUser(result.user))
}))

api.patch('/admin/users/:id', requireUser, need('equipo'), h(async (req, res) => {
  const { name, role, perms, active, password } = req.body || {}
  if (password !== undefined && String(password).length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }
  const result = await mutate((db) => {
    const u = db.users.find((x) => x.id === req.params.id)
    if (!u) return { save: false, missing: true }
    if (name !== undefined) u.name = String(name).trim().slice(0, 60) || u.name
    if (role !== undefined) u.role = String(role).slice(0, 30)
    if (perms !== undefined) u.perms = (Array.isArray(perms) ? perms : []).filter((p) => PERM_IDS.includes(p))
    if (active !== undefined) u.active = Boolean(active)
    if (password !== undefined) u.pass = hashPassword(password)
    return { user: u }
  })
  if (result.missing) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(publicUser(result.user))
}))

api.delete('/admin/users/:id', requireUser, need('equipo'), h(async (req, res) => {
  const result = await mutate((db) => {
    const before = db.users.length
    db.users = db.users.filter((u) => u.id !== req.params.id)
    return db.users.length === before ? { save: false, missing: true } : {}
  })
  if (result.missing) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.status(204).end()
}))

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' })
    next()
  })
  app.use(cors())
  app.use(express.json({ limit: '600kb' }))
  app.use('/api', api)
  app.use('/api', (err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor, intenta de nuevo' })
  })
  return app
}
