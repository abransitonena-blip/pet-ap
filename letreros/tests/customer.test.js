import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addBusinessDays, customerErrors, normalizeCustomer, normalizePhone } from '../src/lib/customer.js'

test('valida nombre, WhatsApp obligatorio y correo', () => {
  assert.match(normalizeCustomer({}).error, /nombre/)
  assert.match(normalizeCustomer({ name: 'Ana' }).error, /WhatsApp/)
  assert.match(normalizeCustomer({ name: 'Ana', email: 'a@b.mx' }).error, /WhatsApp/, 'el WhatsApp es obligatorio')
  assert.match(normalizeCustomer({ name: 'Ana', phone: '12345' }).error, /10 dígitos/)
  assert.match(normalizeCustomer({ name: 'Ana', phone: '5512345678', email: 'no-es-correo' }).error, /correo/)
  const ok = normalizeCustomer({ name: ' Ana ', phone: '55 1234 5678', delivery: 'dron', date: '2026-10-01' })
  assert.equal(ok.customer.name, 'Ana')
  assert.equal(ok.customer.phone, '5512345678')
  assert.equal(ok.customer.delivery, 'recoger')
  assert.equal(ok.customer.date, '2026-10-01')
  assert.equal(normalizeCustomer({ name: 'A', phone: '5512345678', date: 'mañana' }).customer.date, '')
})

test('teléfono: México y formato internacional', () => {
  assert.equal(normalizePhone('+52 1 55 1234 5678').phone, '5512345678')
  assert.equal(normalizePhone('52 55 1234 5678').phone, '5512345678')
  assert.equal(normalizePhone('+1 415 555 0100').phone, '+14155550100')
  assert.match(normalizePhone('55 1234 5678 999').error, /10 dígitos/)
})

test('envío e instalación piden código postal y domicilio', () => {
  const e = customerErrors({ name: 'Ana', phone: '5512345678', delivery: 'instalacion', cp: '123' })
  assert.ok(e.cp && e.address)
  const ok = normalizeCustomer({ name: 'Ana', phone: '5512345678', delivery: 'envio', cp: '06700', address: 'Álvaro Obregón 120, Roma Nte.' })
  assert.equal(ok.customer.cp, '06700')
  // Al recoger no se guarda domicilio
  assert.equal(normalizeCustomer({ name: 'Ana', phone: '5512345678', cp: '06700', address: 'x calle 1 col' }).customer.address, '')
})

test('días hábiles (sin domingo)', () => {
  assert.equal(addBusinessDays('2026-09-26', 1), '2026-09-28', 'sábado + 1 hábil = lunes')
  assert.equal(addBusinessDays('2026-09-28', 7), '2026-10-06')
})
