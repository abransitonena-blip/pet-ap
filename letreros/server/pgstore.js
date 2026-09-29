// Base de datos real: PostgreSQL (Neon, Supabase, Vercel Postgres o local).
// Cada registro es una fila; ajustes y contadores van en una tabla clave → valor.
// Todo cambio corre en una transacción con candado, así dos instancias nunca se pisan,
// y solo se escriben las filas que cambiaron.
import crypto from 'node:crypto'

// Listas del negocio: una fila por elemento
export const COLLECTIONS = [
  'orders', 'users', 'customers', 'leads', 'suppliers', 'tasks', 'employees', 'attendance', 'expenses', 'coupons', 'posts', 'cases'
]
const LOCK_ID = 727274 // candado de escritura (cualquier número fijo)

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS records (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    ord DOUBLE PRECISION NOT NULL DEFAULT 0,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (collection, id)
  );
  CREATE INDEX IF NOT EXISTS records_order ON records (collection, ord);
  CREATE INDEX IF NOT EXISTS records_folio ON records ((data->>'folio')) WHERE collection = 'orders';
  CREATE INDEX IF NOT EXISTS records_email ON records ((lower(data->>'email'))) WHERE collection = 'customers';
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL DEFAULT 'image/jpeg',
    data BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`

// Lo que se leyó de la base en cada carga, para guardar solo lo que cambió
const snapshots = new WeakMap()

// Posición de cada elemento sin reescribir toda la lista cuando se agrega uno al inicio o al final
function assignOrd(list, oldOrd) {
  const out = []
  let prev = -Infinity
  for (let i = 0; i < list.length; i++) {
    const old = oldOrd.get(list[i].id)
    if (old !== undefined && old > prev) {
      out.push(old)
      prev = old
      continue
    }
    let next = Infinity
    for (let j = i + 1; j < list.length; j++) {
      const o = oldOrd.get(list[j].id)
      if (o !== undefined && o > prev) {
        next = o
        break
      }
    }
    const ord = Number.isFinite(next) ? (Number.isFinite(prev) ? (prev + next) / 2 : next - 1) : Number.isFinite(prev) ? prev + 1 : 0
    out.push(ord)
    prev = ord
  }
  return out
}

// client: { query(text, params) → { rows }, tx(fn(q)) }
export function createPgStore(client, { legacy = null, photoStore = null } = {}) {
  let ready = null
  const init = () =>
    (ready ||= (async () => {
      for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) await client.query(stmt)
      // Primera vez: copia lo que había en Vercel Blob o en el archivo JSON
      if (legacy) {
        await client.tx(async (q) => {
          await q.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID])
          const { rows } = await q.query("SELECT (SELECT count(*) FROM kv) + (SELECT count(*) FROM records) AS n")
          if (Number(rows[0].n) > 0) return
          const old = await legacy.load()
          if (!old || (!old.orders?.length && !old.seq && !old.settings)) return
          await writeDiff(q, old, { kv: new Map(), rec: new Map() })
          await q.query("INSERT INTO kv (key, value) VALUES ('migratedAt', $1) ON CONFLICT (key) DO NOTHING", [JSON.stringify(new Date().toISOString())])
        })
      }
    })().catch((err) => {
      ready = null
      throw err
    }))

  async function read(q) {
    const db = {}
    const snap = { kv: new Map(), rec: new Map() }
    const kv = await q.query('SELECT key, value FROM kv')
    for (const { key, value } of kv.rows) {
      const v = value // el driver ya convierte jsonb a objeto
      db[key] = v
      snap.kv.set(key, JSON.stringify(v))
    }
    for (const c of COLLECTIONS) db[c] = []
    const rec = await q.query('SELECT collection, id, ord, data FROM records ORDER BY collection, ord')
    for (const { collection, id, ord, data } of rec.rows) {
      const v = data
      ;(db[collection] ||= []).push(v)
      snap.rec.set(`${collection}\u0000${id}`, { json: JSON.stringify(v), ord: Number(ord) })
    }
    delete db.migratedAt
    snapshots.set(db, snap)
    return db
  }

  async function writeDiff(q, db, snap) {
    const seen = new Set()
    for (const c of COLLECTIONS) {
      const list = Array.isArray(db[c]) ? db[c] : []
      for (const item of list) if (!item.id) item.id = crypto.randomUUID()
      const oldOrd = new Map()
      for (const item of list) {
        const s = snap.rec.get(`${c}\u0000${item.id}`)
        if (s) oldOrd.set(item.id, s.ord)
      }
      const ords = assignOrd(list, oldOrd)
      for (const [i, item] of list.entries()) {
        const k = `${c}\u0000${item.id}`
        if (seen.has(k)) continue // id repetido: gana el primero
        seen.add(k)
        const json = JSON.stringify(item)
        const s = snap.rec.get(k)
        if (s && s.json === json && s.ord === ords[i]) continue
        await q.query(
          `INSERT INTO records (collection, id, ord, data) VALUES ($1, $2, $3, $4::jsonb)
           ON CONFLICT (collection, id) DO UPDATE SET ord = EXCLUDED.ord, data = EXCLUDED.data, updated_at = now()`,
          [c, String(item.id), ords[i], json]
        )
      }
    }
    for (const k of snap.rec.keys()) {
      if (seen.has(k)) continue
      const [c, id] = k.split('\u0000')
      await q.query('DELETE FROM records WHERE collection = $1 AND id = $2', [c, id])
    }
    const keys = Object.keys(db).filter((k) => !COLLECTIONS.includes(k) && db[k] !== undefined)
    for (const key of keys) {
      const json = JSON.stringify(db[key])
      if (snap.kv.get(key) === json) continue
      await q.query(
        'INSERT INTO kv (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()',
        [key, json]
      )
    }
    for (const key of snap.kv.keys()) if (!keys.includes(key) && key !== 'migratedAt') await q.query('DELETE FROM kv WHERE key = $1', [key])
  }

  const store = {
    kind: 'postgres',
    async load() {
      await init()
      return read(client)
    },
    // Fuera de transacción (compatibilidad): guarda contra lo último leído
    async save(db) {
      await init()
      await client.tx(async (q) => {
        await q.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID])
        await writeDiff(q, db, snapshots.get(db) || { kv: new Map(), rec: new Map() })
      })
    },
    // Leer → cambiar → guardar dentro de una transacción con candado
    async transaction(fn) {
      await init()
      return client.tx(async (q) => {
        await q.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID])
        return fn({
          load: () => read(q),
          save: (db) => writeDiff(q, db, snapshots.get(db) || { kv: new Map(), rec: new Map() })
        })
      })
    },
    async putPhoto(id, buffer, contentType = 'image/jpeg') {
      if (photoStore) return photoStore.putPhoto(id, buffer, contentType)
      await init()
      await client.query(
        'INSERT INTO photos (id, content_type, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, content_type = EXCLUDED.content_type',
        [id, contentType, buffer]
      )
    },
    async getPhoto(id) {
      if (photoStore) return photoStore.getPhoto(id)
      await init()
      const { rows } = await client.query('SELECT data FROM photos WHERE id = $1', [id])
      return rows[0] ? Buffer.from(rows[0].data) : null
    },
    async deletePhoto(id) {
      if (photoStore) return photoStore.deletePhoto(id)
      await init()
      await client.query('DELETE FROM photos WHERE id = $1', [id])
    },
    // Resumen para el panel: cuántas filas hay por lista
    async stats() {
      await init()
      const { rows } = await client.query('SELECT collection, count(*)::int AS n FROM records GROUP BY collection')
      return Object.fromEntries(rows.map((r) => [r.collection, r.n]))
    }
  }
  return store
}

// Conexión con node-postgres (producción)
export async function pgClient(connectionString) {
  const { default: pg } = await import('pg')
  const local = /localhost|127\.0\.0\.1/.test(connectionString)
  const pool = new pg.Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10000,
    ssl: local || /sslmode=disable/.test(connectionString) ? false : { rejectUnauthorized: false }
  })
  return {
    query: (text, params) => pool.query(text, params),
    async tx(fn) {
      const c = await pool.connect()
      try {
        await c.query('BEGIN')
        const out = await fn({ query: (text, params) => c.query(text, params) })
        await c.query('COMMIT')
        return out
      } catch (err) {
        await c.query('ROLLBACK').catch(() => {})
        throw err
      } finally {
        c.release()
      }
    }
  }
}

// Postgres en memoria o en carpeta (pruebas y desarrollo sin servidor)
export async function pgliteClient(dataDir) {
  const { PGlite } = await import('@electric-sql/pglite')
  const db = new PGlite(dataDir && dataDir !== 'memory' ? dataDir : undefined)
  let chain = Promise.resolve()
  return {
    query: (text, params) => db.query(text, params),
    // PGlite es una sola conexión: las transacciones van en fila
    tx(fn) {
      const run = chain.then(() => db.transaction((t) => fn({ query: (text, params) => t.query(text, params) })))
      chain = run.catch(() => {})
      return run
    }
  }
}
