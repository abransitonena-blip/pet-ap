// Almacenamiento de pedidos.
//  - Local / VPS: archivo server/data/orders.json
//  - Vercel: blob privado en Vercel Blob (el disco de las funciones no es persistente)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'orders.json')
const BLOB_PATH = 'letreros/orders.json'
const empty = () => ({ seq: 0, orders: [] })

export const usingBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

const fileStore = {
  async load() {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
    } catch {
      return empty()
    }
  },
  async save(db) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    const tmp = `${DB_FILE}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2))
    fs.renameSync(tmp, DB_FILE)
  }
}

const blobStore = {
  async load() {
    const { get } = await import('@vercel/blob')
    const result = await get(BLOB_PATH, { access: 'private', useCache: false }).catch((err) => {
      if (err?.name === 'BlobNotFoundError') return null
      throw err
    })
    if (!result || result.statusCode !== 200 || !result.stream) return empty()
    return JSON.parse(await new Response(result.stream).text())
  },
  async save(db) {
    const { put } = await import('@vercel/blob')
    await put(BLOB_PATH, JSON.stringify(db), {
      access: 'private',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 60
    })
  }
}

export const store = usingBlob ? blobStore : fileStore
