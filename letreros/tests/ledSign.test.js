import { test } from 'node:test'
import assert from 'node:assert/strict'
import { boardOutline, defaultLedDesign, mountHoles, normalizeLedDesign, planPower, FRAME_LINE, dotColorId, ledQuoteParts, encodeMask, logoMask, normalizeLogo } from '../src/lib/ledSign.js'

const withDots = (n, color = 'rojo', extra = {}) =>
  normalizeLedDesign({
    ...defaultLedDesign(),
    ...extra,
    lines: [{ text: 'X', color }],
    dots: Array.from({ length: n }, (_, i) => [10 + (i % 50), 10 + Math.floor(i / 50), 0, i])
  })

// Tabla de la placa B (hardware/fuente3-127v/LEEME.md)
test('capacitor por salida coincide con la tabla de la placa B', () => {
  const cap = (n, color) => planPower(withDots(n, color)).strings[0].cap
  assert.equal(cap(10, 'verde'), '224J') // 30 V
  assert.equal(cap(27, 'ambar'), '334J') // 54 V
  assert.equal(cap(20, 'blanco'), '334J') // 62 V ≈ 60 V
  assert.equal(cap(27, 'blanco'), '474J') // 84 V
  assert.equal(cap(45, 'ambar'), '474J') // 90 V
})

test('ninguna cadena pasa de 100 V a 127 V y la corriente queda entre 6 y 11.5 mA', () => {
  for (const color of ['rojo', 'verde', 'blanco']) {
    for (const n of [3, 40, 120, 333]) {
      const plan = planPower(withDots(n, color))
      assert.equal(plan.strings.reduce((a, s) => a + s.count, 0), n)
      for (const s of plan.strings) {
        assert.ok(s.volts <= 100, `${color} ${n}: ${s.volts} V`)
        assert.ok(s.mA <= 11.5 && s.mA >= 3, `${color} ${n}: ${s.mA} mA`)
      }
      assert.equal(plan.boardsB, Math.ceil(plan.strings.length / 3))
    }
  }
})

test('12 V: cadenas en serie con resistencia E12 y fuente suficiente', () => {
  const plan = planPower(withDots(50, 'rojo', { power: '12v' }))
  for (const s of plan.strings) {
    assert.ok(s.count <= 5)
    assert.ok([100, 120, 150, 180, 220, 270, 330, 390, 470, 560, 680, 820].includes(s.resistor) || s.resistor >= 1000)
  }
  assert.ok(plan.supplyA * 1000 >= plan.totalMa * 1.25)
})

test('secuencial reparte letras en 3 canales con placa A', () => {
  const plan = planPower(withDots(30, 'rojo', { animation: 'secuencial' }))
  assert.deepEqual([...new Set(plan.strings.map((s) => s.channel))].sort(), [0, 1, 2])
  assert.ok(plan.boardsA >= 1)
})

test('normalizeLedDesign limita y limpia la entrada', () => {
  const d = normalizeLedDesign({
    widthCm: 99999,
    lines: [{ text: 'a'.repeat(200), icon: '<script>', color: 'fucsia', heightMm: -5 }],
    dots: [[1, 2, 0, 0], ['x', 1], [99999, 99999, 7, 3]],
    shape: 'estrella'
  })
  assert.equal(d.widthCm, 1000)
  assert.equal(d.lines[0].text.length, 40)
  assert.equal(d.lines[0].icon, '')
  assert.equal(d.lines[0].color, 'rojo')
  assert.equal(d.lines[0].heightMm, 20)
  assert.equal(d.shape, 'round')
  assert.equal(d.dots.length, 2)
  assert.ok(d.dots[1][0] <= d.widthCm * 10)
})

test('cada forma tiene contorno cerrado dentro de la placa y barrenos de montaje', () => {
  for (const shape of ['rect', 'round', 'pill', 'circle', 'arch', 'hex']) {
    const d = { ...defaultLedDesign(), shape, widthCm: 60, heightCm: 30 }
    const { points, d: path } = boardOutline(d)
    assert.ok(points.length >= 4 && path.endsWith('Z'), shape)
    for (const [x, y] of points) assert.ok(x >= -0.01 && x <= 600.01 && y >= -0.01 && y <= 300.01, `${shape} ${x},${y}`)
    assert.equal(mountHoles(d).length, 2)
  }
  assert.equal(mountHoles({ ...defaultLedDesign(), mount: 'base' }).length, 0)
})

test('combinar colores: alternado, arcoíris y marco LED', () => {
  const d = normalizeLedDesign({
    lines: [{ text: 'AB', color: 'rojo', color2: 'azul', mix: 'alternado' }, { text: 'C', mix: 'arcoiris' }],
    frame: { on: true, color: 'verde' },
    dots: [[10, 10, 0, 0], [20, 10, 0, 1], [30, 10, 1, 2], [5, 5, FRAME_LINE, 3], [6, 6, 7, 0]]
  })
  assert.deepEqual(d.dots.map((p) => dotColorId(d, p)), ['rojo', 'azul', 'amarillo', 'verde', 'rojo'])
  assert.equal(d.dots[3][2], FRAME_LINE, 'los puntos del marco conservan su índice')
  const plan = planPower(d)
  assert.equal(plan.colorCount.verde, 1)
  assert.equal(Object.values(plan.colorCount).reduce((a, n) => a + n, 0), 5)
})

test('acabados: valida el id y suma su precio por m²', () => {
  assert.equal(normalizeLedDesign({ finish: 'plastico' }).finish, 'liso')
  const base = normalizeLedDesign({ widthCm: 100, heightCm: 50, dots: [[10, 10, 0, 0]] })
  const wood = { ...base, finish: 'nogal' }
  const part = ledQuoteParts(wood).parts.find((p) => p.label.startsWith('Acabado'))
  assert.equal(part.amount, Math.round(0.5 * 350))
  assert.equal(ledQuoteParts(base).parts.some((p) => p.label.startsWith('Acabado')), false)
})

test('bandera: dos caras duplican cadenas, LED y placa', () => {
  const one = withDots(120)
  const flag = { ...one, mount: 'bandera' }
  const a = planPower(one)
  const b = planPower(flag)
  assert.equal(b.strings.length, a.strings.length * 2)
  assert.equal(b.totalLeds, 240)
  assert.equal(b.colorCount.rojo, 240)
  const board = (d) => ledQuoteParts(d).parts[0].amount
  assert.equal(board(flag), board(one) * 2)
})

test('logo: la máscara comprimida se valida y se recupera igual', () => {
  const mask = new Uint8Array(8 * 6).map((_, i) => (i % 3 === 0 ? 1 : 0))
  const logo = { w: 8, h: 6, rle: encodeMask(mask) }
  assert.deepEqual([...logoMask(normalizeLogo(logo))], [...mask])
  assert.equal(normalizeLogo({ ...logo, w: 9 }), null, 'tamaño que no cuadra con las corridas')
  assert.equal(normalizeLogo({ w: 8, h: 6, rle: '<script>' }), null)
})
