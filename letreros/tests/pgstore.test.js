import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPgStore, pgliteClient } from '../server/pgstore.js'

// Cuenta las escrituras para comprobar que solo se guardan las filas que cambian
function counting(client) {
  const stats = { writes: 0 }
  const wrap = (q) => ({
    query: (text, params) => {
      if (/^\s*(INSERT|DELETE)/i.test(text)) stats.writes++
      return q.query(text, params)
    }
  })
  return { stats, client: { query: client.query, tx: (fn) => client.tx((q) => fn(wrap(q))) } }
}

test('postgres: migra el JSON anterior, conserva el orden y guarda solo lo que cambia', async () => {
  const legacy = {
    load: async () => ({
      seq: 2,
      settings: { business: { name: 'Taller' } },
      orders: [{ id: 'b', folio: 'LT-0002' }, { id: 'a', folio: 'LT-0001' }],
      users: [{ id: 'u1', name: 'Ana' }]
    })
  }
  const { client, stats } = counting(await pgliteClient('memory'))
  const store = createPgStore(client, { legacy })

  const db = await store.load()
  assert.equal(db.seq, 2)
  assert.deepEqual(db.orders.map((o) => o.folio), ['LT-0002', 'LT-0001'])
  assert.equal(db.settings.business.name, 'Taller')

  // Pedido nuevo al inicio (como hace la app) y cambio en un usuario
  stats.writes = 0
  await store.transaction(async (tx) => {
    const d = await tx.load()
    d.orders.unshift({ id: 'c', folio: 'LT-0003' })
    d.seq = 3
    d.users[0].name = 'Ana María'
    await tx.save(d)
  })
  assert.equal(stats.writes, 3, 'pedido nuevo + usuario + folio; los demás pedidos no se reescriben')

  const again = await store.load()
  assert.deepEqual(again.orders.map((o) => o.id), ['c', 'b', 'a'])
  assert.equal(again.users[0].name, 'Ana María')

  // Al final de la lista, en medio y borrado
  await store.transaction(async (tx) => {
    const d = await tx.load()
    d.orders.push({ id: 'z' })
    d.orders.splice(1, 0, { id: 'm' })
    d.orders = d.orders.filter((o) => o.id !== 'a')
    await tx.save(d)
  })
  assert.deepEqual((await store.load()).orders.map((o) => o.id), ['c', 'm', 'b', 'z'])

  // Una transacción que falla no deja nada a medias
  await assert.rejects(
    store.transaction(async (tx) => {
      const d = await tx.load()
      d.orders.unshift({ id: 'x' })
      await tx.save(d)
      throw new Error('falla')
    })
  )
  assert.equal((await store.load()).orders.some((o) => o.id === 'x'), false)

  // Fotos en la base cuando no hay Blob
  await store.putPhoto('f1', Buffer.from('hola'), 'image/jpeg')
  assert.equal((await store.getPhoto('f1')).toString(), 'hola')
  await store.deletePhoto('f1')
  assert.equal(await store.getPhoto('f1'), null)
  assert.equal((await store.stats()).orders, 4)
})
