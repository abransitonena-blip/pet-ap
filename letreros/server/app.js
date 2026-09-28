// API de AP letreros. La usan server/index.js (Node local / VPS) y api/index.js (Vercel).
import express from 'express'
import cors from 'cors'
import crypto from 'node:crypto'
import { normalizeDesign } from '../src/lib/design.js'
import { MATERIALS, EXTRAS, quote } from '../src/lib/pricing.js'
import { STATUS_IDS, PRINTED_STATUSES } from '../src/lib/status.js'
import { FINISHES, normalizeLedDesign } from '../src/lib/ledSign.js'
import {
  PERM_IDS, computeTotals, mergeBusiness, mergePrices, normalizeAdjust, normalizePayment, paymentSummary, publicBusiness, shippingFor, volumeDiscount
} from '../src/lib/prices.js'
import { normalizeCustomer } from '../src/lib/customer.js'
import { GIRO_IDS, LEAD_STATE_IDS } from '../src/lib/prospects.js'
import { mergeCosts } from '../src/lib/costs.js'
import { SUPPLIER_CATEGORIES } from '../src/lib/suppliers.js'
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
  db.leads = db.leads || []
  db.suppliers = db.suppliers || []
  db.textures = db.textures && typeof db.textures === 'object' ? db.textures : {}
  db.settings = {
    prices: mergePrices(db.settings?.prices),
    business: mergeBusiness(db.settings?.business),
    costs: mergeCosts(db.settings?.costs),
    pricesUpdated: db.settings?.pricesUpdated
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
    o.photos = Array.isArray(o.photos) ? o.photos : []
    o.review = o.review || null
    o.group = o.group || null
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
  const textures = Object.fromEntries(
    Object.entries(db.textures).map(([finish, t]) => [finish, { url: `/api/photos/${t.photoId}`, tileCm: t.tileCm, source: t.source }])
  )
  res.json({ prices: db.settings.prices, business: publicBusiness(db.settings.business), textures })
}))

// Crear pedido (público)
// Valida un diseño recibido del público
function checkDesign(design) {
  const clean = cleanDesign(design)
  if (!clean.lines.some((l) => l.text.trim() || l.icon)) return { error: 'El letrero no tiene texto' }
  if (clean.kind === 'led' && !clean.dots.length) return { error: 'El letrero no tiene puntos LED' }
  return { clean }
}

// Crea un pedido dentro de mutate(): folio, presupuesto, envío y ajustes
function buildOrder(db, { clean, quantity, customer, ship = true, discountPct = 0, group = null }) {
  const q = quote({ ...clean, quantity }, db.settings.prices)
  const now = new Date().toISOString()
  db.seq = (db.seq || 0) + 1
  // Envío a domicilio: gratis desde el monto configurado
  const shipCost = ship ? shippingFor(customer.delivery, computeTotals(q, normalizeAdjust(), db.settings.business).total, db.settings.business) : 0
  const adjust = normalizeAdjust({
    items: shipCost ? [{ label: 'Envío a domicilio', amount: shipCost }] : [],
    discountPct,
    note: group ? `Pedido múltiple: ${group.size} letreros (${group.folios})` : ''
  })
  const o = {
    id: crypto.randomUUID(),
    folio: `LT-${String(db.seq).padStart(4, '0')}`,
    publicToken: crypto.randomBytes(8).toString('hex'),
    createdAt: now,
    updatedAt: now,
    status: 'nuevo',
    quoteState: 'pendiente',
    validUntil: addDays(now, db.settings.business.validityDays),
    customer,
    design: clean,
    quote: q,
    adjust,
    totals: computeTotals(q, adjust, db.settings.business),
    adminNotes: '',
    payments: [],
    showcase: false,
    photos: [],
    review: null,
    group: group?.id || null,
    history: [{ status: 'nuevo', at: now, by: 'Cliente (web)' }]
  }
  db.orders.unshift(o)
  return o
}

api.post('/orders', orderLimit, h(async (req, res) => {
  const { design, quantity } = req.body || {}
  const checked = normalizeCustomer(req.body?.customer)
  if (checked.error) return res.status(400).json({ error: checked.error })
  const d = checkDesign(design)
  if (d.error) return res.status(400).json({ error: d.error })
  const order = await mutate((db) => buildOrder(db, { clean: d.clean, quantity, customer: checked.customer }))
  res.status(201).json({ folio: order.folio, total: order.totals.total, status: order.status, token: order.publicToken })
}))

// Pedido múltiple (sucursales, mesas, puertas): un folio por letrero, descuento por volumen del total
api.post('/orders/batch', orderLimit, h(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  if (items.length < 2 || items.length > 30) return res.status(400).json({ error: 'Manda de 2 a 30 letreros' })
  const checked = normalizeCustomer(req.body?.customer)
  if (checked.error) return res.status(400).json({ error: checked.error })
  const cleans = []
  for (const [i, it] of items.entries()) {
    const d = checkDesign(it?.design)
    if (d.error) return res.status(400).json({ error: `Letrero ${i + 1}: ${d.error}` })
    cleans.push(d.clean)
  }
  const orders = await mutate((db) => {
    const rate = volumeDiscount(cleans.length, db.settings.prices)
    const first = String((db.seq || 0) + 1).padStart(4, '0')
    const last = String((db.seq || 0) + cleans.length).padStart(4, '0')
    const group = { id: crypto.randomUUID(), size: cleans.length, folios: `LT-${first} a LT-${last}` }
    // El envío se cobra una sola vez (en el primero) y solo si el total no llega al envío gratis
    const estimate = cleans.reduce((a, c) => a + quote({ ...c, quantity: 1 }, db.settings.prices).total, 0) * (1 - rate)
    const ship = shippingFor(checked.customer.delivery, estimate, db.settings.business) > 0
    return cleans.map((clean, i) =>
      buildOrder(db, { clean, quantity: 1, customer: checked.customer, ship: ship && i === 0, discountPct: Math.round(rate * 100), group })
    )
  })
  res.status(201).json({
    orders: orders.map((o) => ({ folio: o.folio, total: o.totals.total, token: o.publicToken, text: o.design.lines.map((l) => l.text).join(' ') })),
    total: orders.reduce((a, o) => a + o.totals.total, 0)
  })
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

// ---------- Fotos y opiniones reales ----------
const IMAGE_TYPES = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] }
const MAX_PHOTO = 2.5 * 1024 * 1024
const REVIEWABLE = ['impreso', 'entregado']

// data:image/...;base64 → Buffer, validando tipo por su firma y tamaño
function decodeImage(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''))
  if (!m) return { error: 'La foto debe ser JPG, PNG o WebP' }
  const buffer = Buffer.from(m[2], 'base64')
  if (buffer.length > MAX_PHOTO) return { error: 'La foto pesa demasiado (máx. 2.5 MB)' }
  if (!IMAGE_TYPES[m[1]].every((b, i) => buffer[i] === b)) return { error: 'El archivo no es una imagen válida' }
  return { buffer, type: m[1] }
}

async function savePhoto(dataUrl, extra) {
  const img = decodeImage(dataUrl)
  if (img.error) return img
  const id = crypto.randomBytes(16).toString('hex')
  await store.putPhoto(id, img.buffer, img.type)
  return { photo: { id, type: img.type, at: new Date().toISOString(), ...extra } }
}

const clean = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max)
// "María López" → "María L."
const shortName = (name) => {
  const [first, last] = clean(name, 60).split(' ')
  return last ? `${first} ${last[0].toUpperCase()}.` : first || 'Cliente'
}

function publicReview(o) {
  const r = o.review
  return {
    id: o.id.slice(0, 8),
    stars: r.stars,
    text: r.text,
    name: shortName(r.name || o.customer.name),
    business: r.business,
    city: r.city,
    at: r.at,
    photo: r.photoId || o.photos[0]?.id || null,
    design: o.design
  }
}

// Las fotos tienen id aleatorio de 128 bits: el enlace funciona como llave
api.get('/photos/:id', h(async (req, res) => {
  if (!/^[a-f0-9]{32}$/.test(req.params.id)) return res.status(404).end()
  const db = await loadDb()
  const meta = [...db.orders.flatMap((o) => o.photos), ...Object.values(db.textures).map((t) => ({ id: t.photoId, type: t.type }))].find((p) => p.id === req.params.id)
  const buffer = meta && (await store.getPhoto(meta.id))
  if (!buffer) return res.status(404).end()
  res.set({ 'Content-Type': meta.type, 'Cache-Control': 'public, max-age=604800, immutable' })
  res.send(buffer)
}))

// Galería pública "Hecho por AP": trabajos que el negocio decide mostrar (sin datos del cliente)
api.get('/public/gallery', h(async (req, res) => {
  const db = await loadDb()
  const items = db.orders
    .filter((o) => o.showcase && o.status !== 'cancelado')
    .slice(0, 24)
    .map((o) => ({
      id: o.id.slice(0, 8),
      design: o.design,
      at: o.printedAt || o.updatedAt,
      photos: o.photos.map((p) => p.id),
      review: o.review?.status === 'publicada' ? { stars: o.review.stars, text: o.review.text, name: shortName(o.review.name || o.customer.name) } : null
    }))
  res.json(items)
}))

// Opiniones verificadas: solo clientes con pedido terminado, publicadas tras revisión
api.get('/public/reviews', h(async (req, res) => {
  const db = await loadDb()
  const list = db.orders.filter((o) => o.review?.status === 'publicada')
  const count = list.length
  const avg = count ? Math.round((list.reduce((a, o) => a + o.review.stars, 0) / count) * 10) / 10 : 0
  const items = list.sort((a, b) => b.review.at.localeCompare(a.review.at)).slice(0, 30).map(publicReview)
  res.json({ count, avg, items })
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
    canReview: REVIEWABLE.includes(o.status),
    review: o.review ? { stars: o.review.stars, text: o.review.text, status: o.review.status, photoId: o.review.photoId || null } : null,
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

const reviewLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 8, message: 'Demasiados intentos. Espera unos minutos.' })

api.post('/quote/:folio/review', reviewLimit, h(async (req, res) => {
  const { t, stars, text, name, business, city, image } = req.body || {}
  const n = Math.round(Number(stars))
  if (!(n >= 1 && n <= 5)) return res.status(400).json({ error: 'Elige de 1 a 5 estrellas' })
  if (clean(text, 600).length < 3) return res.status(400).json({ error: 'Cuéntanos un poco cómo te fue' })
  const db0 = await loadDb()
  const found = findByToken(db0, req.params.folio, t)
  if (!found) return res.status(404).json({ error: 'Presupuesto no encontrado' })
  if (!REVIEWABLE.includes(found.status)) return res.status(400).json({ error: 'Podrás opinar cuando tu letrero esté terminado' })
  let photo = null
  if (image) {
    const saved = await savePhoto(image, { by: 'Cliente', source: 'cliente' })
    if (saved.error) return res.status(400).json({ error: saved.error })
    photo = saved.photo
  }
  const result = await mutate((db) => {
    const o = findByToken(db, req.params.folio, t)
    if (!o) return { save: false, missing: true }
    const now = new Date().toISOString()
    if (photo) o.photos.push(photo)
    o.review = {
      stars: n,
      text: clean(text, 600),
      name: clean(name, 60) || o.customer.name,
      business: clean(business, 60),
      city: clean(city, 40),
      photoId: photo?.id || o.review?.photoId || null,
      status: 'pendiente',
      at: now
    }
    o.history.push({ status: o.status, at: now, by: 'Cliente', note: `Dejó su opinión (${n}★)` })
    o.updatedAt = now
    return { doc: quoteDocument(o, db.settings.business) }
  })
  if (result.missing) return res.status(404).json({ error: 'Presupuesto no encontrado' })
  res.status(201).json(result.doc)
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
  const { status, adminNotes, adjust, quoteState, showcase, reviewStatus } = req.body || {}
  const u = req.user
  if (reviewStatus !== undefined && !['pendiente', 'publicada', 'oculta'].includes(reviewStatus)) {
    return res.status(400).json({ error: 'Estado de opinión inválido' })
  }
  if ((showcase !== undefined || reviewStatus !== undefined) && !can(u, 'editar')) {
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
    if (reviewStatus !== undefined && o.review && o.review.status !== reviewStatus) {
      o.review.status = reviewStatus
      o.history.push({ status: o.status, at: now, by: u.name, note: `Opinión ${reviewStatus}` })
    }
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

// Fotos del trabajo terminado (las sube el taller)
api.post('/admin/orders/:id/photos', requireUser, need('editar', 'produccion'), h(async (req, res) => {
  if (!req.db.orders.some((o) => o.id === req.params.id)) return res.status(404).json({ error: 'Pedido no encontrado' })
  const saved = await savePhoto(req.body?.image, { by: req.user.name, source: 'taller' })
  if (saved.error) return res.status(400).json({ error: saved.error })
  const order = await mutate((db) => {
    const o = db.orders.find((x) => x.id === req.params.id)
    if (!o) return { save: false, missing: true }
    if (o.photos.length >= 12) return { save: false, full: true }
    o.photos.push(saved.photo)
    o.updatedAt = saved.photo.at
    return o
  })
  if (order.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  if (order.full) {
    await store.deletePhoto(saved.photo.id)
    return res.status(400).json({ error: 'Máximo 12 fotos por pedido' })
  }
  res.status(201).json(viewOrder(order, req.user))
}))

api.delete('/admin/orders/:id/photos/:pid', requireUser, need('editar', 'produccion'), h(async (req, res) => {
  const order = await mutate((db) => {
    const o = db.orders.find((x) => x.id === req.params.id)
    if (!o?.photos.some((p) => p.id === req.params.pid)) return { save: false, missing: true }
    o.photos = o.photos.filter((p) => p.id !== req.params.pid)
    if (o.review?.photoId === req.params.pid) o.review.photoId = null
    return o
  })
  if (order.missing) return res.status(404).json({ error: 'Foto no encontrada' })
  await store.deletePhoto(req.params.pid)
  res.json(viewOrder(order, req.user))
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
    const o = db.orders.find((x) => x.id === req.params.id)
    if (!o) return { save: false, missing: true }
    db.orders = db.orders.filter((x) => x !== o)
    return { photos: o.photos.map((p) => p.id) }
  })
  if (result.missing) return res.status(404).json({ error: 'Pedido no encontrado' })
  await Promise.all(result.photos.map((id) => store.deletePhoto(id)))
  res.status(204).end()
}))

// Ajustes: precios y datos del negocio
// Los costos solo los ven quienes manejan precios o ventas
api.get('/admin/settings', requireUser, (req, res) => {
  const { costs, ...rest } = req.db.settings
  res.json(can(req.user, 'precios', 'ventas') ? { ...rest, costs } : rest)
})

api.put('/admin/settings/costs', requireUser, need('precios'), h(async (req, res) => {
  const settings = await mutate((db) => {
    db.settings.costs = mergeCosts(req.body)
    return db.settings
  })
  res.json(settings)
}))

// Texturas reales: foto de la muestra del material para cada acabado
const FINISH_IDS = FINISHES.map((f) => f.id).filter((id) => id !== 'liso')
api.post('/admin/textures/:finish', requireUser, need('precios'), h(async (req, res) => {
  if (!FINISH_IDS.includes(req.params.finish)) return res.status(400).json({ error: 'Acabado inválido' })
  const tileCm = Math.round(Math.min(300, Math.max(5, Number(req.body?.tileCm) || 60)))
  const saved = await savePhoto(req.body?.image, { by: req.user.name, source: 'textura' })
  if (saved.error) return res.status(400).json({ error: saved.error })
  const old = await mutate((db) => {
    const prev = db.textures[req.params.finish]
    db.textures[req.params.finish] = {
      photoId: saved.photo.id,
      type: saved.photo.type,
      tileCm,
      source: String(req.body?.source || '').trim().slice(0, 120),
      at: saved.photo.at,
      by: req.user.name
    }
    return { prev: prev?.photoId }
  })
  if (old.prev) await store.deletePhoto(old.prev)
  res.status(201).json({ ok: true })
}))

api.delete('/admin/textures/:finish', requireUser, need('precios'), h(async (req, res) => {
  const old = await mutate((db) => {
    const prev = db.textures[req.params.finish]
    if (!prev) return { save: false, missing: true }
    delete db.textures[req.params.finish]
    return { prev: prev.photoId }
  })
  if (old.missing) return res.status(404).json({ error: 'Sin textura' })
  await store.deletePhoto(old.prev)
  res.status(204).end()
}))

// Proveedores propios (además del directorio de fábrica)
const CATEGORY_IDS = SUPPLIER_CATEGORIES.map((c) => c.id)
function cleanSupplier(b = {}) {
  const t = (k, max) => String(b[k] || '').trim().slice(0, max)
  const url = t('url', 300)
  return {
    name: t('name', 80),
    category: CATEGORY_IDS.includes(b.category) ? b.category : 'otro',
    contact: t('contact', 80),
    phone: t('phone', 20).replace(/[^\d+ ]/g, ''),
    url: /^https:\/\/[^\s"'<>]+$/.test(url) ? url : '',
    what: t('what', 200),
    price: t('price', 120),
    note: t('note', 300)
  }
}

api.get('/admin/suppliers', requireUser, need('precios', 'produccion'), (req, res) => res.json(req.db.suppliers))

api.post('/admin/suppliers', requireUser, need('precios'), h(async (req, res) => {
  const data = cleanSupplier(req.body)
  if (!data.name) return res.status(400).json({ error: 'Escribe el nombre del proveedor' })
  const sup = await mutate((db) => {
    if (db.suppliers.length >= 300) return { save: false, full: true }
    const x = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString(), by: req.user.name }
    db.suppliers.unshift(x)
    return x
  })
  if (sup.full) return res.status(400).json({ error: 'Límite de proveedores alcanzado' })
  res.status(201).json(sup)
}))

api.delete('/admin/suppliers/:id', requireUser, need('precios'), h(async (req, res) => {
  const result = await mutate((db) => {
    const before = db.suppliers.length
    db.suppliers = db.suppliers.filter((x) => x.id !== req.params.id)
    return db.suppliers.length === before ? { save: false, missing: true } : {}
  })
  if (result.missing) return res.status(404).json({ error: 'Proveedor no encontrado' })
  res.status(204).end()
}))

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

// Prospectos (visitas a negocios)
function cleanLead(b, prev = {}) {
  const pick = (k, max) => (b[k] !== undefined ? String(b[k] || '').trim().slice(0, max) : prev[k] || '')
  return {
    name: pick('name', 60),
    contact: pick('contact', 60),
    phone: pick('phone', 20).replace(/[^\d+ ]/g, ''),
    zone: pick('zone', 60),
    note: pick('note', 400),
    giro: GIRO_IDS.includes(b.giro) ? b.giro : prev.giro || 'otro',
    status: LEAD_STATE_IDS.includes(b.status) ? b.status : prev.status || 'por_visitar'
  }
}

api.get('/admin/leads', requireUser, need('ventas'), (req, res) => res.json(req.db.leads))

api.post('/admin/leads', requireUser, need('ventas'), h(async (req, res) => {
  const data = cleanLead(req.body || {})
  if (!data.name) return res.status(400).json({ error: 'Escribe el nombre del negocio' })
  const lead = await mutate((db) => {
    if (db.leads.length >= 2000) return { save: false, full: true }
    const now = new Date().toISOString()
    const l = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now, by: req.user.name, visitedAt: data.status !== 'por_visitar' ? now : null }
    db.leads.unshift(l)
    return l
  })
  if (lead.full) return res.status(400).json({ error: 'Límite de prospectos alcanzado' })
  res.status(201).json(lead)
}))

api.patch('/admin/leads/:id', requireUser, need('ventas'), h(async (req, res) => {
  const lead = await mutate((db) => {
    const l = db.leads.find((x) => x.id === req.params.id)
    if (!l) return { save: false, missing: true }
    const wasPending = l.status === 'por_visitar'
    Object.assign(l, cleanLead(req.body || {}, l), { updatedAt: new Date().toISOString() })
    if (wasPending && l.status !== 'por_visitar' && !l.visitedAt) l.visitedAt = l.updatedAt
    return l
  })
  if (lead.missing) return res.status(404).json({ error: 'Prospecto no encontrado' })
  res.json(lead)
}))

api.delete('/admin/leads/:id', requireUser, need('ventas'), h(async (req, res) => {
  const result = await mutate((db) => {
    const before = db.leads.length
    db.leads = db.leads.filter((l) => l.id !== req.params.id)
    return db.leads.length === before ? { save: false, missing: true } : {}
  })
  if (result.missing) return res.status(404).json({ error: 'Prospecto no encontrado' })
  res.status(204).end()
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
  app.use(express.json({ limit: '4mb' }))
  app.use('/api', api)
  app.use('/api', (err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor, intenta de nuevo' })
  })
  return app
}
