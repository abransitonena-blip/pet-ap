// Cuentas de clientes (correo + contraseña o Google) e inicio de sesión del equipo con Google.
import crypto from 'node:crypto'
import { paymentSummary } from '../src/lib/prices.js'

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const CUSTOMER_HOURS = 24 * 30
const MAX_DESIGNS = 30

// ---------- Google: verifica el token (JWT RS256) con las llaves públicas de Google ----------
let certs = { keys: [], until: 0 }
async function googleKeys(force = false) {
  if (!force && Date.now() < certs.until) return certs.keys
  const res = await fetch('https://www.googleapis.com/oauth2/v3/certs')
  if (!res.ok) throw new Error('No se pudo contactar a Google')
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600)
  certs = { keys: (await res.json()).keys || [], until: Date.now() + maxAge * 1000 }
  return certs.keys
}

async function verifyGoogleToken(idToken, clientId = GOOGLE_CLIENT_ID) {
  if (!clientId) throw new Error('El inicio con Google no está configurado')
  const parts = String(idToken || '').split('.')
  if (parts.length !== 3) throw new Error('Token de Google inválido')
  const [h, p, s] = parts
  const header = JSON.parse(Buffer.from(h, 'base64url').toString())
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString())
  if (header.alg !== 'RS256') throw new Error('Token de Google inválido')
  let jwk = (await googleKeys()).find((k) => k.kid === header.kid)
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid)
  if (!jwk) throw new Error('Token de Google inválido')
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), crypto.createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'))
  if (!ok) throw new Error('Token de Google inválido')
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) throw new Error('Token de Google inválido')
  if (payload.aud !== clientId) throw new Error('Token de Google de otra aplicación')
  if (!(payload.exp * 1000 > Date.now())) throw new Error('El inicio con Google expiró, intenta de nuevo')
  if (!payload.email || payload.email_verified === false) throw new Error('Tu correo de Google no está verificado')
  return { sub: payload.sub, email: String(payload.email).toLowerCase(), name: payload.name || '', picture: payload.picture || '' }
}

// Las pruebas usan un verificador falso (no hay red hacia Google)
let verifier = verifyGoogleToken
export const setGoogleVerifier = (fn) => (verifier = fn || verifyGoogleToken)
export const verifyGoogle = (token) => verifier(token)

// ---------- Utilidades ----------
const clean = (v, max) => String(v ?? '').trim().slice(0, max)
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
export const publicAccount = (c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone || '',
  picture: c.picture || '',
  google: Boolean(c.googleSub),
  designs: (c.designs || []).map(({ id, name, design, savedAt }) => ({ id, name, design, savedAt }))
})

// Lo que el cliente ve de cada pedido suyo
const accountOrder = (o) => ({
  id: o.id,
  folio: o.folio,
  createdAt: o.createdAt,
  status: o.status,
  quoteState: o.quoteState,
  design: o.design,
  quantity: o.quote?.quantity || 1,
  total: o.totals?.total || 0,
  pay: paymentSummary(o.totals, o.payments),
  quoteUrl: `#/presupuesto/${o.folio}/${o.publicToken}`,
  history: (o.history || []).map(({ status, at }) => ({ status, at }))
})

export function registerAccounts(api, ctx) {
  const { mutate, h, hashPassword, checkPassword, createToken, readToken, loadDb, authLimit, requireUser, need, newCase } = ctx

  // Sesión de cliente: token firmado con uid "c:<id>"
  const customerFrom = async (req) => {
    const data = readToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''))
    if (!data || !String(data.u).startsWith('c:')) return null
    const db = await loadDb()
    const c = db.customers.find((x) => x.id === data.u.slice(2))
    return c ? { c, db } : null
  }
  const requireCustomer = h(async (req, res, next) => {
    const found = await customerFrom(req)
    if (!found) return res.status(401).json({ error: 'Inicia sesión para continuar' })
    req.customer = found.c
    req.db = found.db
    next()
  })
  const session = (c) => ({ token: createToken(`c:${c.id}`, CUSTOMER_HOURS), account: publicAccount(c) })

  api.post('/auth/register', authLimit, h(async (req, res) => {
    const name = clean(req.body?.name, 80)
    const email = clean(req.body?.email, 120).toLowerCase()
    const phone = clean(req.body?.phone, 30)
    const password = String(req.body?.password || '')
    if (!name) return res.status(400).json({ error: 'Escribe tu nombre' })
    if (!emailOk(email)) return res.status(400).json({ error: 'El correo no es válido' })
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    const r = await mutate((db) => {
      if (db.customers.some((c) => c.email === email)) return { save: false, error: 'Ya hay una cuenta con ese correo. Inicia sesión.' }
      const c = { id: crypto.randomUUID(), name, email, phone, pass: hashPassword(password), createdAt: new Date().toISOString(), designs: [] }
      db.customers.unshift(c)
      return { c }
    })
    if (r.error) return res.status(400).json({ error: r.error })
    res.status(201).json(session(r.c))
  }))

  api.post('/auth/login', authLimit, h(async (req, res) => {
    const email = clean(req.body?.email, 120).toLowerCase()
    const db = await loadDb()
    const c = db.customers.find((x) => x.email === email)
    if (!c || !c.pass || !checkPassword(req.body?.password, c.pass)) {
      return res.status(401).json({ error: c && !c.pass ? 'Esta cuenta entra con Google' : 'Correo o contraseña incorrectos' })
    }
    res.json(session(c))
  }))

  // Google: crea la cuenta o la liga por correo (Google ya verificó el correo)
  api.post('/auth/google', authLimit, h(async (req, res) => {
    let g
    try {
      g = await verifyGoogle(req.body?.credential)
    } catch (err) {
      return res.status(401).json({ error: err.message })
    }
    const c = await mutate((db) => {
      let x = db.customers.find((y) => y.googleSub === g.sub) || db.customers.find((y) => y.email === g.email)
      if (!x) {
        x = { id: crypto.randomUUID(), name: g.name || g.email.split('@')[0], email: g.email, phone: '', createdAt: new Date().toISOString(), designs: [] }
        db.customers.unshift(x)
      }
      Object.assign(x, { googleSub: g.sub, emailVerified: true, picture: g.picture || x.picture || '', lastLogin: new Date().toISOString() })
      return x
    })
    res.json(session(c))
  }))

  api.get('/account', requireCustomer, (req, res) => {
    const c = req.customer
    // Sus pedidos: los hechos con su sesión y, si su correo está verificado (Google), los hechos con ese correo
    const mine = req.db.orders.filter(
      (o) => o.customerId === c.id || (c.emailVerified && o.customer?.email && o.customer.email.toLowerCase() === c.email)
    )
    res.json({ account: publicAccount(c), orders: mine.map(accountOrder) })
  })

  api.put('/account', requireCustomer, h(async (req, res) => {
    const phone = clean(req.body?.phone, 30)
    if (phone && phone.replace(/\D/g, '').length < 10) return res.status(400).json({ error: 'El WhatsApp debe tener 10 dígitos' })
    const c = await mutate((db) => {
      const x = db.customers.find((y) => y.id === req.customer.id)
      if (req.body?.name !== undefined) x.name = clean(req.body.name, 80) || x.name
      if (req.body?.phone !== undefined) x.phone = phone
      return x
    })
    res.json(publicAccount(c))
  }))

  // Diseños guardados en la cuenta (se abren en el configurador)
  api.post('/account/designs', requireCustomer, h(async (req, res) => {
    const design = req.body?.design
    if (!design || typeof design !== 'object' || JSON.stringify(design).length > 300000) return res.status(400).json({ error: 'Diseño inválido' })
    const c = await mutate((db) => {
      const x = db.customers.find((y) => y.id === req.customer.id)
      x.designs = [{ id: crypto.randomUUID(), name: clean(req.body?.name, 60) || 'Mi letrero', design, savedAt: new Date().toISOString() }, ...(x.designs || [])].slice(0, MAX_DESIGNS)
      return x
    })
    res.status(201).json(publicAccount(c))
  }))

  api.delete('/account/designs/:id', requireCustomer, h(async (req, res) => {
    const c = await mutate((db) => {
      const x = db.customers.find((y) => y.id === req.customer.id)
      x.designs = (x.designs || []).filter((d) => d.id !== req.params.id)
      return x
    })
    res.json(publicAccount(c))
  }))

  // ---------- Recuperar acceso (asistido) ----------
  // Sin servicio de correo configurado: la solicitud abre un expediente y el equipo manda un enlace de un solo uso
  // (válido 1 hora) por WhatsApp o correo. La respuesta es la misma exista o no la cuenta.
  const sha = (t) => crypto.createHash('sha256').update(String(t)).digest('hex')
  api.post('/auth/forgot', authLimit, h(async (req, res) => {
    const email = clean(req.body?.email, 120).toLowerCase()
    if (!emailOk(email)) return res.status(400).json({ error: 'El correo no es válido' })
    await mutate((db) => {
      const c = db.customers.find((x) => x.email === email)
      if (!c) return { save: false }
      if (!c.pass && c.googleSub) return { save: false } // entra con Google
      if (c.resetRequestedAt && Date.now() - new Date(c.resetRequestedAt).getTime() < 15 * 60e3) return { save: false }
      c.resetRequestedAt = new Date().toISOString()
      newCase(db, { kind: 'acceso', source: 'cliente', message: `Pide recuperar el acceso a su cuenta (${email}).`, contact: { name: c.name, phone: c.phone || '', email }, customerId: c.id }, `Cliente · ${c.name}`)
      return {}
    })
    res.json({ ok: true, message: 'Si hay una cuenta con ese correo, te contactamos para restablecer tu contraseña. Si entras con Google, usa ese botón.' })
  }))

  api.post('/admin/customers/reset-link', requireUser, need('atencion', 'pedidos'), h(async (req, res) => {
    const email = clean(req.body?.email, 120).toLowerCase()
    const token = crypto.randomBytes(24).toString('base64url')
    const r = await mutate((db) => {
      const c = db.customers.find((x) => x.email === email)
      if (!c) return { save: false, missing: true }
      c.reset = { hash: sha(token), until: Date.now() + 3600e3, by: req.user.name }
      return { c }
    })
    if (r.missing) return res.status(404).json({ error: 'No hay una cuenta con ese correo' })
    res.json({ path: `#/cuenta/restablecer/${token}`, until: new Date(Date.now() + 3600e3).toISOString(), name: r.c.name, phone: r.c.phone || '' })
  }))

  api.post('/auth/reset', authLimit, h(async (req, res) => {
    const password = String(req.body?.password || '')
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    const hash = sha(req.body?.token || '')
    const r = await mutate((db) => {
      const c = db.customers.find((x) => x.reset && x.reset.hash === hash)
      if (!c || c.reset.until < Date.now()) return { save: false, invalid: true }
      c.pass = hashPassword(password)
      delete c.reset
      delete c.resetRequestedAt
      return { c }
    })
    if (r.invalid) return res.status(400).json({ error: 'El enlace ya no es válido. Pide uno nuevo.' })
    res.json(session(r.c))
  }))

  return { customerFrom }
}
