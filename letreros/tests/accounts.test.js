import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'letreros-cuentas-'))
process.env.DATA_DIR = dir
process.env.ADMIN_PASSWORD = 'clave-prueba'
process.env.ADMIN_SECRET = 'secreto-prueba'
process.env.GOOGLE_CLIENT_ID = 'cliente-prueba.apps.googleusercontent.com'

let server, base
before(async () => {
  const { createApp } = await import('../server/app.js')
  const { setGoogleVerifier } = await import('../server/accounts.js')
  // Sin red hacia Google: el “token” es el correo de prueba
  setGoogleVerifier(async (t) => {
    if (!String(t).startsWith('ok:')) throw new Error('Token de Google inválido')
    const email = t.slice(3)
    return { sub: `sub-${email}`, email, name: 'Google ' + email.split('@')[0], picture: '' }
  })
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
const design = { kind: 'led', widthCm: 30, heightCm: 15, lines: [{ text: 'HOLA' }], dots: [[10, 10, 0, 0], [20, 10, 0, 1]] }

test('cuentas de cliente: registro, pedidos propios y diseños guardados', async () => {
  assert.equal((await call('GET', '/public/settings')).body.googleClientId, 'cliente-prueba.apps.googleusercontent.com')
  assert.equal((await call('POST', '/auth/register', { name: 'Ana', email: 'mal', password: '12345678' })).status, 400)
  assert.equal((await call('POST', '/auth/register', { name: 'Ana', email: 'ana@correo.mx', password: '123' })).status, 400)
  const reg = await call('POST', '/auth/register', { name: 'Ana', email: 'Ana@Correo.mx', password: 'secreta123' })
  assert.equal(reg.status, 201)
  assert.equal(reg.body.account.email, 'ana@correo.mx')
  assert.equal(reg.body.account.pass, undefined, 'nunca se expone la contraseña')
  assert.equal((await call('POST', '/auth/register', { name: 'Otra', email: 'ana@correo.mx', password: 'secreta123' })).status, 400)
  assert.equal((await call('POST', '/auth/login', { email: 'ana@correo.mx', password: 'mala1234' })).status, 401)
  const { token } = (await call('POST', '/auth/login', { email: 'ana@correo.mx', password: 'secreta123' })).body

  // Pedido con sesión: aparece en su cuenta; uno sin sesión con su correo no (correo sin verificar)
  const customer = { name: 'Ana', phone: '5512345678', email: 'ana@correo.mx' }
  const mine = await call('POST', '/orders', { customer, design, quantity: 1 }, token)
  await call('POST', '/orders', { customer, design, quantity: 1 })
  const acc = await call('GET', '/account', null, token)
  assert.deepEqual(acc.body.orders.map((o) => o.folio), [mine.body.folio])
  assert.match(acc.body.orders[0].quoteUrl, /^#\/presupuesto\//)

  // Datos y diseños
  assert.equal((await call('PUT', '/account', { phone: '123' }, token)).status, 400)
  assert.equal((await call('PUT', '/account', { phone: '5599998888' }, token)).body.phone, '5599998888')
  const saved = await call('POST', '/account/designs', { name: 'Mi taquería', design }, token)
  assert.equal(saved.body.designs[0].name, 'Mi taquería')
  const left = await call('DELETE', `/account/designs/${saved.body.designs[0].id}`, null, token)
  assert.equal(left.body.designs.length, 0)

  // Un token de cliente no abre el panel
  assert.equal((await call('GET', '/admin/me', null, token)).status, 401)
  assert.equal((await call('GET', '/account')).status, 401)
})

test('Google: cuenta nueva o ligada por correo verificado, y acceso del equipo', async () => {
  assert.equal((await call('POST', '/auth/google', { credential: 'falso' })).status, 401)
  const g = await call('POST', '/auth/google', { credential: 'ok:beto@gmail.com' })
  assert.equal(g.body.account.google, true)
  // Con correo verificado ve también pedidos hechos antes sin sesión con ese correo
  await call('POST', '/orders', { customer: { name: 'Beto', phone: '5512345678', email: 'beto@gmail.com' }, design, quantity: 1 })
  assert.equal((await call('GET', '/account', null, g.body.token)).body.orders.length, 1)
  // Ligar Google a una cuenta con contraseña del mismo correo
  const again = await call('POST', '/auth/google', { credential: 'ok:ana@correo.mx' })
  assert.equal(again.body.account.name, 'Ana')

  // Equipo: sin correo ligado no entra; el dueño liga su correo y una persona el suyo
  assert.equal((await call('POST', '/admin/login/google', { credential: 'ok:dueno@gmail.com' })).status, 401)
  const owner = (await call('POST', '/admin/login', { username: 'admin', password: 'clave-prueba' })).body.token
  await call('PUT', '/admin/owner-google', { email: 'Dueno@gmail.com' }, owner)
  const ownerG = await call('POST', '/admin/login/google', { credential: 'ok:dueno@gmail.com' })
  assert.equal(ownerG.body.user.id, 'owner')
  await call('POST', '/admin/users', { name: 'Taller', username: 'taller', password: 'taller123', perms: ['produccion'], googleEmail: 'taller@gmail.com' }, owner)
  const staff = await call('POST', '/admin/login/google', { credential: 'ok:taller@gmail.com' })
  assert.deepEqual(staff.body.user.perms, ['produccion'])
  assert.equal((await call('GET', '/admin/owner-google', null, staff.body.token)).status, 403, 'solo el dueño')
  assert.equal((await call('GET', '/admin/system', null, owner)).body.storage, process.env.PGLITE ? 'postgres' : 'archivo')
})
