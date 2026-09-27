import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCustomer } from '../src/lib/customer.js'

test('valida nombre, WhatsApp y correo', () => {
  assert.match(normalizeCustomer({}).error, /nombre/)
  assert.match(normalizeCustomer({ name: 'Ana' }).error, /WhatsApp o correo/)
  assert.match(normalizeCustomer({ name: 'Ana', phone: '12345' }).error, /10 dígitos/)
  assert.match(normalizeCustomer({ name: 'Ana', email: 'no-es-correo' }).error, /correo/)
  const ok = normalizeCustomer({ name: ' Ana ', phone: '55 1234 5678', delivery: 'dron', date: '2026-10-01' })
  assert.equal(ok.customer.name, 'Ana')
  assert.equal(ok.customer.delivery, 'recoger')
  assert.equal(ok.customer.date, '2026-10-01')
  assert.equal(normalizeCustomer({ name: 'A', email: 'a@b.mx', date: 'mañana' }).customer.date, '')
})
