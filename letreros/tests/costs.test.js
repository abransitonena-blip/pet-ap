import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_COSTS, costEstimate, margin, mergeCosts } from '../src/lib/costs.js'
import { defaultLedDesign, normalizeLedDesign } from '../src/lib/ledSign.js'

const sign = (extra = {}) =>
  normalizeLedDesign({ ...defaultLedDesign(), widthCm: 60, heightCm: 25, ...extra, dots: Array.from({ length: 200 }, (_, i) => [10 + (i % 50), 10, 0, i]) })

test('costos: valores inválidos vuelven al de fábrica', () => {
  const c = mergeCosts({ ledEach: -3, sheets: { acrilico: 'x', pvc: 800 }, extra: 1 })
  assert.equal(c.ledEach, DEFAULT_COSTS.ledEach)
  assert.equal(c.sheets.acrilico, DEFAULT_COSTS.sheets.acrilico)
  assert.equal(c.sheets.pvc, 800)
  assert.equal(c.extra, undefined)
})

test('costo: LED, placa, mano de obra; la bandera cuesta más y el acabado suma vinil', () => {
  const base = costEstimate(sign())
  assert.ok(base.total > 200 * DEFAULT_COSTS.ledEach)
  assert.ok(base.parts.some((p) => p.label.startsWith('Mano de obra')))
  assert.ok(costEstimate(sign({ mount: 'bandera' })).total > base.total)
  assert.ok(costEstimate(sign({ finish: 'nogal' })).parts.some((p) => p.label === 'Vinil de acabado'))
  assert.deepEqual(margin(1000, 400), { profit: 600, pct: 60 })
})

test('inventario: consumo por letrero', async () => {
  const { consumption, lowStock, normalizeInventory } = await import('../src/lib/inventory.js')
  const d = normalizeLedDesign({ kind: 'led', widthCm: 40, heightCm: 20, material: 'pvc', lines: [{ text: 'A', color: 'azul' }], dots: Array.from({ length: 40 }, (_, i) => [10 + i * 5, 50, 0, 0]), halo: { on: true, color: 'blanco' } })
  const m = consumption(d, 2)
  assert.equal(m.get('led-azul'), 84)
  assert.ok(Math.abs(m.get('hoja-pvc') - 0.4 * 0.2 * 1.15 * 2) < 0.01)
  assert.ok(m.get('tira') > 0)
  assert.equal(m.get('separador'), 8)
  assert.equal(m.get('caja'), 2)
  const inv = normalizeInventory({ caja: { qty: 1, min: 5 } })
  assert.ok(lowStock(inv).some((i) => i.key === 'caja'))
})
