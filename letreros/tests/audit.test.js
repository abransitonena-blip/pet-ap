// Pruebas de aceptación de la auditoría (Destello AP · 28-sep-2026)
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { deliveryCharges, DEFAULT_BUSINESS, DEFAULT_PRICES, computeTotals } from '../src/lib/prices.js'
import { quote } from '../src/lib/pricing.js'
import { normalizeLedDesign } from '../src/lib/ledSign.js'
import { slaDue } from '../src/lib/business.js'

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'letreros-auditoria-'))
process.env.DATA_DIR = dir
process.env.ADMIN_PASSWORD = 'clave-prueba'
process.env.ADMIN_SECRET = 'secreto-prueba'

let server, base, owner
before(async () => {
  const { createApp } = await import('../server/app.js')
  server = createApp().listen(0)
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}/api`
  owner = (await call('POST', '/admin/login', { username: 'admin', password: 'clave-prueba' })).body.token
})
after(() => {
  server.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

async function call(method, url, body, token, headers = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined
  })
  return { status: res.status, body: res.status === 204 ? null : await res.json() }
}
const design = { kind: 'led', widthCm: 30, heightCm: 15, lines: [{ text: 'HOLA' }], dots: [[10, 10, 0, 0], [20, 10, 0, 1]] }
const customer = (delivery = 'recoger', extra = {}) => ({ name: 'Ana Ruiz', phone: '5512345678', delivery, ...(delivery === 'recoger' ? {} : { cp: '06700', address: 'Álvaro Obregón 120, Roma Norte' }), ...extra })
const orderOf = async (folio) => (await call('GET', '/admin/orders', null, owner)).body.find((o) => o.folio === folio)

test('CPQ-03: la forma de recibir gobierna envío e instalación (sin cobros dobles ni contradicciones)', async () => {
  const d = normalizeLedDesign({ ...design, extras: ['instalacion'] })
  assert.deepEqual(d.extras, [], 'la instalación ya no es parte del diseño')
  const q = quote({ ...d, quantity: 1 }, DEFAULT_PRICES)
  assert.equal(q.lines.some((l) => /Instalación/.test(l.label)), false)
  const total = computeTotals(q, {}, DEFAULT_BUSINESS).total
  assert.deepEqual(deliveryCharges('recoger', total, DEFAULT_BUSINESS), [])
  assert.equal(deliveryCharges('instalacion', total, DEFAULT_BUSINESS, DEFAULT_PRICES)[0].amount, DEFAULT_PRICES.led.installation)
  assert.equal(deliveryCharges('envio', 5000, DEFAULT_BUSINESS).length, 0, 'envío gratis desde el umbral')

  // Mismo desglose en el servidor: recoger sin cargos; instalar con un solo cargo
  const pick = await call('POST', '/orders', { customer: customer('recoger'), design, quantity: 1 })
  const inst = await call('POST', '/orders', { customer: customer('instalacion'), design, quantity: 1 })
  assert.equal(inst.body.total - pick.body.total, DEFAULT_PRICES.led.installation)
  const o = await orderOf(inst.body.folio)
  assert.equal(o.adjust.items.filter((i) => /Instalación/.test(i.label)).length, 1)
  assert.equal(o.customer.cp, '06700')
  // Envío o instalación sin código postal: error claro
  const bad = await call('POST', '/orders', { customer: { ...customer('envio'), cp: '' }, design, quantity: 1 })
  assert.equal(bad.status, 400)
  assert.match(bad.body.error, /postal/)
})

test('CPQ-04: versión nueva exige nueva aprobación; vencido no se acepta; producción con versión aprobada', async () => {
  const { folio, token } = (await call('POST', '/orders', { customer: customer(), design, quantity: 1 })).body
  const doc = await call('GET', `/quote/${folio}?t=${token}`)
  assert.equal(doc.body.version, 1)
  await call('POST', `/quote/${folio}/respond`, { t: token, accept: true })
  const o = await orderOf(folio)
  assert.equal(o.acceptedVersion, 1)
  // El taller ajusta: versión 2, vuelve a “enviada”
  await call('PATCH', `/admin/orders/${o.id}`, { adjust: { items: [{ label: 'Cambio de color', amount: 100 }] } }, owner)
  const v2 = await call('GET', `/quote/${folio}?t=${token}`)
  assert.equal(v2.body.version, 2)
  assert.equal(v2.body.quoteState, 'enviada')
  assert.equal(v2.body.acceptedVersion, 1)
  assert.match(v2.body.next, /acepta/)
  // Con anticipo pagado pero versión sin aprobar, no se fabrica
  const o2 = await orderOf(folio)
  await call('POST', `/admin/orders/${o.id}/payments`, { amount: o2.totals.deposit, method: 'transferencia', reference: 'ABC-1' }, owner)
  const gate = await call('PATCH', `/admin/orders/${o.id}`, { status: 'imprimiendo' }, owner)
  assert.equal(gate.status, 409)
  assert.match(gate.body.error, /aprobación/)
  await call('POST', `/quote/${folio}/respond`, { t: token, accept: true })
  assert.equal((await call('PATCH', `/admin/orders/${o.id}`, { status: 'imprimiendo' }, owner)).status, 200)
  const done = await orderOf(folio)
  assert.equal(done.versions.length, 2)
  assert.deepEqual(done.acceptances.map((a) => a.v), [1, 2])
})

test('ENG-01 / OPS-03: reintentos sin duplicar pedidos ni pagos', async () => {
  const body = { customer: customer(), design, quantity: 1 }
  const k = { 'Idempotency-Key': 'prueba-123' }
  const a = await call('POST', '/orders', body, null, k)
  const b = await call('POST', '/orders', body, null, k)
  assert.equal(a.status, 201)
  assert.equal(b.body.folio, a.body.folio, 'misma clave = mismo pedido')
  assert.equal((await call('POST', '/orders', { ...body, quantity: 2 }, null, k)).status, 409, 'misma clave con otros datos se rechaza')
  const o = await orderOf(a.body.folio)
  const pay = { amount: 100, method: 'transferencia', reference: 'SPEI 998877' }
  assert.equal((await call('POST', `/admin/orders/${o.id}/payments`, pay, owner, { 'Idempotency-Key': 'pago-1' })).status, 201)
  assert.equal((await call('POST', `/admin/orders/${o.id}/payments`, pay, owner, { 'Idempotency-Key': 'pago-1' })).status, 200)
  assert.equal((await call('POST', `/admin/orders/${o.id}/payments`, pay, owner)).status, 409, 'la misma referencia no suma dos veces')
  assert.equal((await orderOf(a.body.folio)).payments.length, 1)
})

test('CX-03: el seguimiento no se abre solo con el folio consecutivo', async () => {
  const { folio } = (await call('POST', '/orders', { customer: customer(), design, quantity: 1 })).body
  assert.equal((await call('GET', `/track/${folio}`)).status, 404)
  assert.equal((await call('GET', `/track/${folio}?tel=0000`)).status, 404)
  const ok = await call('GET', `/track/${folio}?tel=5678`)
  assert.equal(ok.status, 200)
  assert.ok(ok.body.next)
})

test('CX-01/02: expediente con responsable, fecha límite y resolución obligatoria', async () => {
  const bad = await call('POST', '/public/help', { name: 'Luis', phone: '123', message: 'Hola' })
  assert.equal(bad.body.field, 'phone')
  const { folio } = (await call('POST', '/orders', { customer: customer(), design, quantity: 1 })).body
  const help = await call('POST', '/public/help', { name: 'Ana', phone: '55 1234 5678', message: 'No prende la mitad del letrero', kind: 'garantia', folio })
  assert.equal(help.status, 201)
  assert.match(help.body.code, /^C-\d{4}$/)
  const c = (await call('GET', '/admin/cases', null, owner)).body.find((x) => x.code === help.body.code)
  assert.equal(c.folio, folio, 'ligado al pedido con folio + últimos dígitos')
  assert.equal(c.priority, 'alta')
  assert.equal(c.warranty.decision, 'pendiente')
  assert.equal((await call('PATCH', `/admin/cases/${c.id}`, { status: 'resuelto' }, owner)).status, 400, 'no se cierra sin resolución')
  const upd = await call('PATCH', `/admin/cases/${c.id}`, { owner: 'owner', note: 'Te marcamos hoy', warranty: { decision: 'aprobada', remedy: 'reparacion' } }, owner)
  assert.ok(upd.body.firstResponseAt)
  assert.equal(upd.body.warranty.remedy, 'reparacion')
  const closed = await call('PATCH', `/admin/cases/${c.id}`, { status: 'resuelto', resolution: 'Se cambió la fuente' }, owner)
  assert.ok(closed.body.resolvedAt)
  const metrics = (await call('GET', '/admin/metrics', null, owner)).body
  assert.ok(Object.values(metrics).some((d) => d.support_opened >= 1))
})

test('SLA: la fecha límite corre solo en horario de atención', () => {
  // Sábado 18:30 (México) + 2 h hábiles → lunes 10:30
  assert.equal(slaDue('alta', new Date('2026-09-26T18:30:00-06:00')), new Date('2026-09-28T10:30:00-06:00').toISOString())
  // Martes 10:00 + 30 min
  assert.equal(slaDue('urgente', new Date('2026-09-29T10:00:00-06:00')), new Date('2026-09-29T10:30:00-06:00').toISOString())
})

test('22: recuperar contraseña con enlace de un solo uso', async () => {
  await call('POST', '/auth/register', { name: 'Rosa', email: 'rosa@correo.mx', password: 'secreta123' })
  const f = await call('POST', '/auth/forgot', { email: 'rosa@correo.mx' })
  assert.equal(f.status, 200)
  assert.equal((await call('POST', '/auth/forgot', { email: 'nadie@correo.mx' })).body.message, f.body.message, 'no revela si la cuenta existe')
  assert.ok((await call('GET', '/admin/cases', null, owner)).body.some((c) => c.kind === 'acceso' && c.contact.email === 'rosa@correo.mx'))
  const link = await call('POST', '/admin/customers/reset-link', { email: 'rosa@correo.mx' }, owner)
  const token = link.body.path.split('/').pop()
  assert.equal((await call('POST', '/auth/reset', { token, password: 'corta' })).status, 400)
  const r = await call('POST', '/auth/reset', { token, password: 'nueva-clave-1' })
  assert.ok(r.body.token)
  assert.equal((await call('POST', '/auth/reset', { token, password: 'otra-clave-2' })).status, 400, 'un solo uso')
  assert.equal((await call('POST', '/auth/login', { email: 'rosa@correo.mx', password: 'nueva-clave-1' })).status, 200)
})
