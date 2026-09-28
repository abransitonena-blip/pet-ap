// Pruebas de la API con una carpeta de datos temporal (no toca los pedidos reales)
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'letreros-test-'))
process.env.DATA_DIR = dir
process.env.ADMIN_PASSWORD = 'clave-prueba'
process.env.ADMIN_SECRET = 'secreto-prueba'

let server, base
before(async () => {
  const { createApp } = await import('../server/app.js')
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}/api`
})
after(() => {
  server.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

const call = async (method, url, body, token) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  })
  return { status: res.status, body: res.status === 204 ? null : await res.json() }
}
const login = async (username, password) => (await call('POST', '/admin/login', { username, password })).body.token

const ledOrder = {
  customer: { name: 'Cliente Prueba', phone: '5512345678', delivery: 'envio' },
  design: { kind: 'led', widthCm: 30, heightCm: 15, lines: [{ text: 'HOLA' }], dots: [[10, 10, 0, 0], [20, 10, 0, 1]] },
  quantity: 1
}

test('flujo completo: pedido, presupuesto público, aceptar y permisos', async () => {
  const bad = await call('POST', '/orders', { ...ledOrder, customer: { name: 'X', phone: '123' } })
  assert.equal(bad.status, 400)

  const created = await call('POST', '/orders', ledOrder)
  assert.equal(created.status, 201)
  const { folio, token } = created.body
  assert.match(folio, /^LT-\d{4}$/)

  assert.equal((await call('GET', `/quote/${folio}?t=otro`)).status, 404)
  const doc = await call('GET', `/quote/${folio}?t=${token}`)
  assert.equal(doc.body.customer.delivery, 'envio')
  assert.equal(doc.body.customer.phone, undefined, 'el presupuesto público no expone el teléfono')

  const accepted = await call('POST', `/quote/${folio}/respond`, { t: token, accept: true })
  assert.equal(accepted.body.quoteState, 'aceptada')
  assert.equal(accepted.body.status, 'aprobado')

  const owner = await login('', 'clave-prueba')
  assert.ok(owner)
  const made = await call('POST', '/admin/users', { name: 'Taller', username: 'taller', password: 'taller123', perms: ['produccion'] }, owner)
  assert.equal(made.status, 201)
  const taller = await login('taller', 'taller123')

  const orders = await call('GET', '/admin/orders', null, taller)
  assert.equal(orders.body[0].customer.phone, '', 'producción no ve teléfonos')
  assert.equal(orders.body[0].totals, null, 'producción no ve montos')
  const id = orders.body[0].id
  assert.equal((await call('PATCH', `/admin/orders/${id}`, { status: 'imprimiendo' }, taller)).status, 200)
  assert.equal((await call('PATCH', `/admin/orders/${id}`, { adjust: {} }, taller)).status, 403)
  assert.equal((await call('PUT', '/admin/settings/prices', {}, taller)).status, 403)
  assert.equal((await call('DELETE', `/admin/orders/${id}`, null, taller)).status, 403)

  const saved = await call('PUT', '/admin/settings/prices', { led: { assembly: 4 } }, owner)
  assert.equal(saved.body.prices.led.assembly, 4)
  assert.equal((await call('GET', '/public/settings')).body.prices.led.assembly, 4)

  const uid = made.body.id
  await call('PATCH', `/admin/users/${uid}`, { active: false }, owner)
  assert.equal((await call('GET', '/admin/me', null, taller)).status, 401, 'desactivar corta el acceso')
})

test('pagos: anticipo, saldo, permisos y galería pública', async () => {
  const owner = await login('admin', 'clave-prueba')
  const { folio } = (await call('POST', '/orders', ledOrder)).body
  const order = (await call('GET', '/admin/orders', null, owner)).body.find((o) => o.folio === folio)
  assert.equal(order.pay.state, 'sin_pago')
  const total = order.totals.total

  assert.equal((await call('POST', `/admin/orders/${order.id}/payments`, { amount: -5 }, owner)).status, 400)
  const paid = await call('POST', `/admin/orders/${order.id}/payments`, { amount: order.totals.deposit, method: 'transferencia' }, owner)
  assert.equal(paid.status, 201)
  assert.equal(paid.body.pay.state, 'anticipo')
  assert.equal(paid.body.pay.balance, total - order.totals.deposit)

  const stats = (await call('GET', '/admin/stats', null, owner)).body
  assert.ok(stats.collected >= order.totals.deposit)

  const pid = paid.body.payments[0].id
  const undone = await call('DELETE', `/admin/orders/${order.id}/payments/${pid}`, null, owner)
  assert.equal(undone.body.pay.paid, 0)

  assert.equal((await call('GET', '/public/gallery')).body.length, 0)
  await call('PATCH', `/admin/orders/${order.id}`, { showcase: true }, owner)
  const gallery = (await call('GET', '/public/gallery')).body
  assert.equal(gallery.length, 1)
  assert.equal(gallery[0].customer, undefined, 'la galería no expone datos del cliente')
  assert.equal(gallery[0].design.kind, 'led')
})

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

test('opiniones verificadas y fotos reales', async () => {
  const owner = await login('admin', 'clave-prueba')
  const { folio, token } = (await call('POST', '/orders', { ...ledOrder, customer: { ...ledOrder.customer, name: 'María López' } })).body
  const early = await call('POST', `/quote/${folio}/review`, { t: token, stars: 5, text: 'Excelente' })
  assert.equal(early.status, 400, 'no se puede opinar antes de terminar')

  const order = (await call('GET', '/admin/orders', null, owner)).body.find((o) => o.folio === folio)
  await call('PATCH', `/admin/orders/${order.id}`, { status: 'entregado' }, owner)

  const fake = 'data:image/png;base64,' + Buffer.from('<svg>no es png</svg>').toString('base64')
  assert.equal((await call('POST', `/admin/orders/${order.id}/photos`, { image: fake }, owner)).status, 400)
  const withPhoto = await call('POST', `/admin/orders/${order.id}/photos`, { image: PNG }, owner)
  assert.equal(withPhoto.status, 201)
  const pid = withPhoto.body.photos[0].id
  const img = await fetch(`${base}/photos/${pid}`)
  assert.equal(img.headers.get('content-type'), 'image/png')

  assert.equal((await call('POST', `/quote/${folio}/review`, { t: 'otro', stars: 5, text: 'Hola' })).status, 404)
  const sent = await call('POST', `/quote/${folio}/review`, { t: token, stars: 5, text: 'Quedó hermoso, muy buena atención', city: 'Puebla' })
  assert.equal(sent.status, 201)
  assert.equal(sent.body.review.status, 'pendiente')
  assert.equal((await call('GET', '/public/reviews')).body.count, 0, 'no se publica sin revisión')

  await call('PATCH', `/admin/orders/${order.id}`, { reviewStatus: 'publicada' }, owner)
  const pub = (await call('GET', '/public/reviews')).body
  assert.equal(pub.count, 1)
  assert.equal(pub.avg, 5)
  assert.equal(pub.items[0].name, 'María L.', 'solo nombre e inicial')
  assert.equal(pub.items[0].photo, pid)
  assert.equal(pub.items[0].phone, undefined)

  await call('DELETE', `/admin/orders/${order.id}/photos/${pid}`, null, owner)
  assert.equal((await fetch(`${base}/photos/${pid}`)).status, 404)
})

test('prospectos: permisos y embudo; envío cobrado en el pedido', async () => {
  const owner = await login('admin', 'clave-prueba')
  assert.equal((await call('GET', '/admin/leads')).status, 401)
  assert.equal((await call('POST', '/admin/leads', { giro: 'cafe' }, owner)).status, 400)
  const made = await call('POST', '/admin/leads', { name: 'Café Luna', giro: 'cafe', phone: '5512345678', status: 'raro' }, owner)
  assert.equal(made.status, 201)
  assert.equal(made.body.status, 'por_visitar')
  const upd = await call('PATCH', `/admin/leads/${made.body.id}`, { status: 'visitado' }, owner)
  assert.ok(upd.body.visitedAt, 'marca la fecha de visita')
  assert.equal(upd.body.name, 'Café Luna', 'no borra campos que no se mandan')
  assert.equal((await call('DELETE', `/admin/leads/${made.body.id}`, null, owner)).status, 204)

  const { folio } = (await call('POST', '/orders', ledOrder)).body
  const order = (await call('GET', '/admin/orders', null, owner)).body.find((o) => o.folio === folio)
  assert.equal(order.adjust.items[0]?.label, 'Envío a domicilio', 'pedido chico con envío paga envío')
})

test('pedido múltiple: un folio por letrero y descuento por volumen', async () => {
  const items = ['Centro', 'Norte', 'Sur'].map((text) => ({ design: { ...ledOrder.design, lines: [{ text }] } }))
  assert.equal((await call('POST', '/orders/batch', { customer: ledOrder.customer, items: items.slice(0, 1) })).status, 400)
  const res = await call('POST', '/orders/batch', { customer: ledOrder.customer, items })
  assert.equal(res.status, 201)
  assert.equal(res.body.orders.length, 3)
  const owner = await login('admin', 'clave-prueba')
  const orders = (await call('GET', '/admin/orders', null, owner)).body.filter((o) => res.body.orders.some((x) => x.folio === o.folio))
  assert.equal(new Set(orders.map((o) => o.group)).size, 1, 'comparten grupo')
  assert.equal(orders.filter((o) => o.adjust.items.some((i) => i.label === 'Envío a domicilio')).length, 1, 'envío una sola vez')
})

test('proveedores y costos: permisos', async () => {
  const owner = await login('admin', 'clave-prueba')
  const made = await call('POST', '/admin/suppliers', { name: 'LED Centro', category: 'led', url: 'javascript:alert(1)' }, owner)
  assert.equal(made.status, 201)
  assert.equal(made.body.url, '', 'solo enlaces https')
  const saved = await call('PUT', '/admin/settings/costs', { ledEach: 0.3 }, owner)
  assert.equal(saved.body.costs.ledEach, 0.3)
  await call('POST', '/admin/users', { name: 'Taller2', username: 'taller2', password: 'taller123', perms: ['produccion'] }, owner)
  const t = await login('taller2', 'taller123')
  assert.equal((await call('GET', '/admin/settings', null, t)).body.costs, undefined, 'producción no ve costos')
  assert.equal((await call('POST', '/admin/suppliers', { name: 'X' }, t)).status, 403)
  assert.equal((await call('GET', '/admin/suppliers', null, t)).status, 200)
})

test('límite de intentos de acceso', async () => {
  let last
  for (let i = 0; i < 12; i++) last = await call('POST', '/admin/login', { username: 'nadie', password: 'x' })
  assert.equal(last.status, 429)
})
