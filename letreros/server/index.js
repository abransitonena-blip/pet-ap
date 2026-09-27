import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeDesign } from '../src/lib/design.js'
import { MATERIALS, EXTRAS, quote } from '../src/lib/pricing.js'
import { STATUS_IDS, PRINTED_STATUSES } from '../src/lib/status.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5001
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const ADMIN_SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString('hex')
const SESSION_HOURS = 12
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'orders.json')
const DIST_DIR = path.join(__dirname, '..', 'dist')

const MATERIAL_IDS = MATERIALS.map((m) => m.id)
const EXTRA_IDS = EXTRAS.map((e) => e.id)

if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  ADMIN_PASSWORD no está definido; usando "admin123". Cámbialo en producción.')
}

// ---------- Persistencia en archivo JSON ----------
function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } catch {
    return { seq: 0, orders: [] }
  }
}

let db = loadDb()

function saveDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = `${DB_FILE}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
  fs.renameSync(tmp, DB_FILE)
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

// ---------- App ----------
const app = express()
app.use(cors())
app.use(express.json({ limit: '200kb' }))

const api = express.Router()

api.get('/health', (req, res) => res.json({ status: 'ok' }))

api.get('/catalog', (req, res) => res.json({ materials: MATERIALS, extras: EXTRAS }))

// Crear pedido (público)
api.post('/orders', (req, res) => {
  const { customer = {}, design, quantity } = req.body || {}
  const name = String(customer.name || '').trim().slice(0, 80)
  const phone = String(customer.phone || '').trim().slice(0, 30)
  const email = String(customer.email || '').trim().slice(0, 120)
  const notes = String(customer.notes || '').trim().slice(0, 1000)

  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' })
  if (!phone && !email) return res.status(400).json({ error: 'Deja un teléfono o correo de contacto' })

  const cleanDesign = normalizeDesign(design, MATERIAL_IDS, EXTRA_IDS)
  if (!cleanDesign.lines.some((l) => l.text.trim())) {
    return res.status(400).json({ error: 'El letrero no tiene texto' })
  }

  const q = quote({ ...cleanDesign, quantity })
  const now = new Date().toISOString()
  db.seq += 1
  const order = {
    id: crypto.randomUUID(),
    folio: `LT-${String(db.seq).padStart(4, '0')}`,
    createdAt: now,
    updatedAt: now,
    status: 'nuevo',
    customer: { name, phone, email, notes },
    design: cleanDesign,
    quote: q,
    adminNotes: '',
    history: [{ status: 'nuevo', at: now }]
  }
  db.orders.unshift(order)
  saveDb()
  res.status(201).json({ folio: order.folio, total: q.total, status: order.status })
})

// Seguimiento público por folio (solo datos no sensibles)
api.get('/track/:folio', (req, res) => {
  const folio = String(req.params.folio).trim().toUpperCase()
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
})

// ----- Admin -----
api.post('/admin/login', (req, res) => {
  const { password } = req.body || {}
  if (!password || !safeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }
  res.json({ token: createToken(), expiresInHours: SESSION_HOURS })
})

api.get('/admin/orders', requireAdmin, (req, res) => res.json(db.orders))

api.get('/admin/stats', requireAdmin, (req, res) => {
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
})

api.patch('/admin/orders/:id', requireAdmin, (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id)
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
  const { status, adminNotes } = req.body || {}
  const now = new Date().toISOString()

  if (status !== undefined) {
    if (!STATUS_IDS.includes(status)) return res.status(400).json({ error: 'Estado inválido' })
    if (status !== order.status) {
      order.status = status
      order.history.push({ status, at: now })
      if (status === 'impreso' && !order.printedAt) order.printedAt = now
    }
  }
  if (adminNotes !== undefined) order.adminNotes = String(adminNotes).slice(0, 2000)
  order.updatedAt = now
  saveDb()
  res.json(order)
})

api.delete('/admin/orders/:id', requireAdmin, (req, res) => {
  const before = db.orders.length
  db.orders = db.orders.filter((o) => o.id !== req.params.id)
  if (db.orders.length === before) return res.status(404).json({ error: 'Pedido no encontrado' })
  saveDb()
  res.status(204).end()
})

app.use('/api', api)

// En producción servimos el frontend compilado
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`🪧 Letreros API en http://localhost:${PORT}`)
})
