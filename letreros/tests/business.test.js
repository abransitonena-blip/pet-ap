import { test } from 'node:test'
import assert from 'node:assert/strict'
import { couponCheck, monthReport, normalizeCoupon, normalizeEmployee, payroll, vacationDays, workedHours, breakEven } from '../src/lib/business.js'
import { netFromSale, SALES_CHANNELS, PAYMENT_FEES, weeklyHoursFor } from '../src/lib/commerce.js'

test('vacaciones dignas por antigüedad (LFT art. 76)', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 10, 11, 16].map(vacationDays), [12, 14, 16, 18, 20, 22, 22, 24, 26])
  assert.equal(vacationDays(0), 0)
})

test('nómina: periodo, costo patronal y salario mínimo', () => {
  const e = normalizeEmployee({ name: 'Ana', salaryMonthly: 12000, payPeriod: 'quincenal', commissionPct: 3, startDate: '2020-01-01' })
  const p = payroll(e, undefined, { commissionBase: 10000 })
  assert.equal(p.salary, 6000)
  assert.equal(p.commission, 300)
  assert.equal(p.monthlyCost, 16200)
  assert.equal(p.aguinaldo, 6000)
  assert.equal(p.belowMinimum, false)
  assert.equal(payroll(normalizeEmployee({ name: 'X', salaryMonthly: 8000 })).belowMinimum, true)
  assert.equal(workedHours({ in: '09:00', out: '18:30' }), 9.5)
  assert.equal(weeklyHoursFor(2026), 48)
  assert.equal(weeklyHoursFor(2028), 44)
  assert.equal(weeklyHoursFor(2031), 40)
})

test('cupones: vigencia, mínimo y usos', () => {
  const c = { ...normalizeCoupon({ code: 'buen fin15', pct: 15, minTotal: 1000, expires: '2026-11-17', maxUses: 2 }), uses: 0 }
  assert.equal(c.code, 'BUENFIN15')
  assert.equal(couponCheck(c, 1500, '2026-11-14').ok, true)
  assert.match(couponCheck(c, 500, '2026-11-14').reason, /desde/)
  assert.match(couponCheck(c, 1500, '2026-11-18').reason, /venció/)
  assert.match(couponCheck({ ...c, uses: 2 }, 1500, '2026-11-14').reason, /agotó/)
})

test('estado de resultados del mes y punto de equilibrio', () => {
  const orders = [
    { createdAt: '2026-09-03T10:00:00Z', status: 'entregado', totals: { subtotal: 1000 }, payments: [{ amount: 1160, at: '2026-09-04T00:00:00Z' }] },
    { createdAt: '2026-09-10T10:00:00Z', status: 'cancelado', totals: { subtotal: 5000 }, payments: [] },
    { createdAt: '2026-08-10T10:00:00Z', status: 'entregado', totals: { subtotal: 700 }, payments: [] }
  ]
  const expenses = [
    { date: '2026-09-01', category: 'renta', amount: 3000, recurring: true },
    { date: '2026-08-01', category: 'servicios', amount: 500, recurring: true },
    { date: '2026-09-15', category: 'publicidad', amount: 200 }
  ]
  const employees = [normalizeEmployee({ name: 'A', salaryMonthly: 10000 })]
  const r = monthReport('2026-09', { orders, expenses, employees, materialCost: () => 300 })
  assert.equal(r.orders, 1)
  assert.equal(r.sales, 1000)
  assert.equal(r.collected, 1160)
  assert.equal(r.materials, 300)
  assert.equal(r.expenses, 3700)
  assert.equal(r.payroll, 13500)
  assert.equal(r.profit, 1000 - 300 - 3700 - 13500)
  assert.equal(breakEven(10000, 1500, 500), 10)
  assert.equal(breakEven(10000, 400, 500), null)
})

test('canales: lo que queda de una venta', () => {
  const web = SALES_CHANNELS.find((c) => c.id === 'web')
  const ml = SALES_CHANNELS.find((c) => c.id === 'mercadolibre')
  const mp = PAYMENT_FEES.find((p) => p.id === 'mp')
  const spei = PAYMENT_FEES.find((p) => p.id === 'spei')
  assert.equal(netFromSale(1000, web, spei).net, 1000)
  const r = netFromSale(1000, ml, mp)
  assert.equal(r.channel, 130)
  assert.equal(r.payment, Math.round((34.9 + 4) * 1.16 * 100) / 100)
  assert.ok(r.net < 850)
})
