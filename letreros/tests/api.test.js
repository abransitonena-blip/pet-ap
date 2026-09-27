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

test('límite de intentos de acceso', async () => {
  let last
  for (let i = 0; i < 12; i++) last = await call('POST', '/admin/login', { username: 'nadie', password: 'x' })
  assert.equal(last.status, 429)
})
