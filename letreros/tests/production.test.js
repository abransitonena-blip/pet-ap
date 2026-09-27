import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dxf, gcode, planTiles, pointsCsv } from '../src/lib/production.js'
import { defaultLedDesign, normalizeLedDesign } from '../src/lib/ledSign.js'

const design = normalizeLedDesign({
  ...defaultLedDesign(),
  widthCm: 60,
  heightCm: 30,
  shape: 'pill',
  dots: [[100, 100, 0, 0], [120, 100, 0, 0], [140, 100, 0, 1]]
})
const order = { folio: 'LT-TEST', design }

test('DXF: contorno, 3 barrenos LED y 2 de montaje', () => {
  const out = dxf(design)
  assert.ok(out.includes('$INSUNITS') && out.trim().endsWith('EOF'))
  const circles = out.split('\n').filter((l, i, a) => l === 'CIRCLE' && a[i - 1] === '0')
  assert.equal(circles.length, 5)
  assert.ok(out.includes('MONTAJE'))
})

test('G-code GRBL: milímetros, puntos marcados y contorno cerrado', () => {
  const out = gcode(order)
  assert.ok(out.includes('G21') && out.includes('$32=1'))
  assert.equal((out.match(/; punto \d+/g) || []).length, 3)
  assert.ok(out.trim().endsWith('M2'))
  // Y invertida: el punto a 100 mm desde arriba queda a 200 mm desde abajo en una placa de 300 mm
  assert.ok(out.includes('G0 X100 Y200'))
})

test('CSV con cadena y salida por punto', () => {
  const rows = pointsCsv(design).trim().split('\n')
  assert.equal(rows.length, 4)
  assert.match(rows[0], /cadena,salida/)
})

test('hojas 1:1: menos hojas eligiendo orientación', () => {
  const plan = planTiles({ ...design, widthCm: 60, heightCm: 90 }, 'carta')
  assert.equal(plan.count, plan.cols * plan.rows)
  assert.ok(plan.count <= 16)
  assert.equal(planTiles({ ...design, widthCm: 15, heightCm: 10 }, 'carta').count, 1)
})
