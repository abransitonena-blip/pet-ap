import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FINISH_MATERIAL, HARDWARE_KIT, SUPPLIERS, SUPPLIER_CATEGORIES, partCategory } from '../src/lib/suppliers.js'
import { FINISHES, defaultLedDesign, normalizeLedDesign, planPower } from '../src/lib/ledSign.js'

test('cada material, pieza, corte o ensamble tiene al menos 5 proveedores', () => {
  for (const c of SUPPLIER_CATEGORIES.filter((x) => x.material)) {
    const n = SUPPLIERS.filter((s) => s.category === c.id).length
    assert.ok(n >= 5, `${c.name}: solo ${n} proveedores`)
  }
  for (const s of SUPPLIERS) assert.match(s.url, /^https?:\/\//, s.name)
})

test('cada renglón de materiales y cada acabado sabe dónde comprarse', () => {
  const d = normalizeLedDesign({ ...defaultLedDesign(), mount: 'bandera', animation: 'secuencial', halo: { on: true }, dots: [[10, 10, 0, 0], [20, 10, 0, 1]] })
  const flag = planPower(d).bom.map((b) => b.item)
  const halo = planPower({ ...d, mount: 'pared' }).bom.map((b) => b.item)
  for (const item of [...flag, ...halo]) assert.ok(partCategory(item), `sin proveedor: ${item}`)
  for (const f of FINISHES.filter((x) => x.id !== 'liso')) assert.ok(FINISH_MATERIAL[f.id], f.id)
  for (const k of HARDWARE_KIT) assert.ok(SUPPLIERS.some((s) => s.category === k.category), k.item)
})
