// API de LetreroLab. La usan server/index.js (Node local / VPS) y api/index.js (Vercel).
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { normalizeDesign } from '../src/lib/design.js'
import { MATERIALS, EXTRAS, quote } from '../src/lib/pricing.js'
import { STATUS_IDS, PRINTED_STATUSES } from '../src/lib/status.js'
import { normalizeLedDesign } from '../src/lib/ledSign.js'
import { store } from './store.js'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
// Estable entre instancias serverless aunque no se defina ADMIN_SECRET
const ADMIN_SECRET =
  process.env.ADMIN_SECRET || crypto.createHash('sha256').update(`letreros:${ADMIN_PASSWORD}`).digest('hex')
const SESSION_HOURS = 12

const MATERIAL_IDS = MATERIALS.map((m) => m.id)
const EXTRA_IDS = EXTRAS.map((e) => e.id)

if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD no está definido; usando "admin123". Cámbialo en producción.')
}

// Cada tipo de letrero tiene su propio modelo y validación
const cleanDesign = (d) => (d?.kind === 'led' ? normalizeLedDesign(d) : normalizeDesign(d, MATERIAL_IDS, EXTRA_IDS))

// ---------- Datos ----------
async function loadDb() {
  const db = await store.load()
  // Asegura que los diseños guardados con versiones anteriores sigan siendo válidos
  for (const o of db.orders) o.design = cleanDesign(o.design)
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

// ---------- Sesiones de admin (token firmado, sin estado) ----------
const sign = (payload) => crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('base64url')

function createToken() {
  const payload = String(Date.now() + SESSION_HOURS * 3600 * 1000)
  return `${payload}.${sign(payload)}`
}

function verifyToken(token) {
  if (typeof token !== 'string') return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = sign(payload)
  if (sig.length !== expected.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  return Number(payload) > Date.now()
}

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!verifyToken(token)) return res.status(401).json({ error: 'Sesión inválida o expirada' })
  next()
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

// Express 4 no captura errores de funciones async
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// ---------- Rutas ----------
const api = express.Router()

api.get('/health', (req, res) => res.json({ status: 'ok' }))

api.get('/catalog', (req, res) => res.json({ materials: MATERIALS, extras: EXTRAS }))

// Crear pedido (público)
api.post('/orders', h(async (req, res) => {
  const { customer = {}, design, quantity } = req.body || {}
  const name = String(customer.name || '').trim().slice(0, 80)
  const phone = String(customer.phone || '').trim().slice(0, 30)
  const email = String(customer.email || '').trim().slice(0, 120)
  const notes = String(customer.notes || '').trim().slice(0, 1000)

  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' })
  if (!phone && !email) return res.status(400).json({ error: 'Deja un teléfono o correo de contacto' })

  const clean = cleanDesign(design)
  if (!clean.lines.some((l) => l.text.trim())) {
    return res.status(400).json({ error: 'El letrero no tiene texto' })
  }
  if (clean.kind === 'led' && !clean.dots.length) {
    return res.status(400).json({ error: 'El letrero no tiene puntos LED' })
  }

  const q = quote({ ...clean, quantity })
  const order = await mutate((db) => {
    const now = new Date().toISOString()
    db.seq += 1
    const o = {
      id: crypto.randomUUID(),
      folio: `LT-${String(db.seq).padStart(4, '0')}`,
      createdAt: now,
      updatedAt: now,
      status: 'nuevo',
      customer: { name, phone, email, notes },
      design: clean,
      quote: q,
      adminNotes: '',
      history: [{ status: 'nuevo', at: now }]
    }
    db.orders.unshift(o)
    return o
  })
  res.status(201).json({ folio: order.folio, total: q.total, status: order.status })
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
    history: order.history,
    design: order.design,
    total: order.quote.total,
    quantity: order.quote.quantity
  })
}))

// ----- Admin -----
api.post('/admin/login', (req, res) => {
  const { password } = req.body || {}
  if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }
  res.json({ token: createToken(), expiresInHours: SESSION_HOURS })
})

api.get('/admin/orders', requireAdmin, h(async (req, res) => res.json((await loadDb()).orders)))

api.get('/admin/stats', requireAdmin, h(async (req, res) => {
  const db = await loadDb()
  const byStatus = Object.fromEntries(STATUS_IDS.map((s) => [s, 0]))
  let revenue = 0
  let printedPieces = 0
  let printedM2 = 0
  for (const o of db.orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1
    if (o.status !== 'cancelado') revenue += o.quote.total
    if (PRINTED_STATUSES.includes(o.status)) {
      printedPieces += o.quote.quantity
      printedM2 += o.quote.areaM2 * o.quote.quantity
    }
  }
  res.json({
    total: db.orders.length,
    byStatus,
    revenue,
    printedPieces,
    printedM2: Math.round(printedM2 * 100) / 100
  })
}))

api.patch('/admin/orders/:id', requireAdmin, h(async (req, res) => {
  const { status, adminNotes } = req.body || {}
  if (status !== undefined && !STATUS_IDS.includes(status)) return res.status(400).json({ error: 'Estado inválido' })

  const order = await mutate((db) => {
    const o = db.orders.find((x) => x.id === req.params.id)
    if (!o) return { save: false, missing: true }
    const now = new Date().toISOString()
    if (status !== undefined && status !== o.status) {
      o.status = status
      o.history.push({ status, at: now })
      if (status === 'impreso' && !o.printedAt) o.printedAt = now
    }
    if (adminNotes !== undefined) o.adminNotes = String(adminNotes).slice(0, 2000)
    o.updatedAt = now
    return o
  })
  if (order.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  res.json(order)
}))

api.delete('/admin/orders/:id', requireAdmin, h(async (req, res) => {
  const result = await mutate((db) => {
    const before = db.orders.length
    db.orders = db.orders.filter((o) => o.id !== req.params.id)
    return db.orders.length === before ? { save: false, missing: true } : {}
  })
  if (result.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  res.status(204).end()
}))

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '600kb' }))
  app.use('/api', api)
  app.use('/api', (err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor, intenta de nuevo' })
  })
  return app
}
