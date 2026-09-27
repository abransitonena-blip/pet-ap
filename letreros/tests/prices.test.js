import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PRICES, computeTotals, mergeBusiness, mergePrices, normalizeAdjust, volumeDiscount } from '../src/lib/prices.js'
import { quote } from '../src/lib/pricing.js'
import { defaultDesign } from '../src/lib/design.js'
import { defaultLedDesign, normalizeLedDesign } from '../src/lib/ledSign.js'

const led120 = () =>
  normalizeLedDesign({ ...defaultLedDesign(), dots: Array.from({ length: 120 }, (_, i) => [10 + i, 20, 0, 0]) })

test('mergePrices ignora claves desconocidas y valores inválidos', () => {
  const p = mergePrices({ led: { assembly: -3, boardB: 'abc', hack: 1 }, extra: 5 })
  assert.equal(p.led.assembly, 0)
  assert.equal(p.led.boardB, DEFAULT_PRICES.led.boardB)
  assert.equal(p.led.hack, undefined)
  assert.equal(p.extra, undefined)
  assert.deepEqual(mergePrices(undefined), DEFAULT_PRICES)
})

test('descuento por volumen según los escalones', () => {
  assert.equal(volumeDiscount(1), 0)
  assert.equal(volumeDiscount(5), 0.05)
  assert.equal(volumeDiscount(49), 0.12)
  assert.equal(volumeDiscount(60), 0.2)
  assert.equal(volumeDiscount(3, mergePrices({ volume: [[2, 30]] })), 0.3)
})

test('cotización con precios de fábrica (valores de referencia)', () => {
  assert.equal(quote({ ...led120(), quantity: 1 }).total, 920)
  assert.equal(quote({ ...defaultDesign(), quantity: 2 }).total, 5236)
})

test('los precios del panel cambian la cotización', () => {
  const base = quote({ ...led120(), quantity: 1 }).total
  const more = quote({ ...led120(), quantity: 1 }, mergePrices({ led: { assembly: 5 } })).total
  assert.equal(more - base, 120 * 3)
})

test('totales: IVA incluido, IVA aparte, descuentos y anticipo', () => {
  const inc = computeTotals({ total: 1160 }, {}, mergeBusiness({}))
  assert.equal(inc.total, 1160)
  assert.equal(inc.subtotal, 1000)
  assert.equal(inc.iva, 160)
  assert.equal(inc.deposit, 580)

  const sep = computeTotals({ total: 1000 }, { items: [{ label: 'Flete', amount: 200 }], discountPct: 10 }, mergeBusiness({ ivaIncluded: false, depositPct: 30 }))
  assert.equal(sep.discount, 120)
  assert.equal(sep.subtotal, 1080)
  assert.equal(sep.total, Math.round(1080 * 1.16))
  assert.equal(sep.deposit, Math.round(sep.total * 0.3))

  const capped = computeTotals({ total: 100 }, { discountAmt: 999 }, mergeBusiness({}))
  assert.equal(capped.total, 0)
})

test('normalizeAdjust descarta conceptos vacíos o absurdos', () => {
  const a = normalizeAdjust({ items: [{ label: '', amount: 5 }, { label: 'Flete', amount: 300 }, { label: 'X', amount: 9e9 }], discountPct: 500 })
  assert.deepEqual(a.items, [{ label: 'Flete', amount: 300 }])
  assert.equal(a.discountPct, 100)
})
