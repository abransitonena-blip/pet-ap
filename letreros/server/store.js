// Almacenamiento de pedidos y fotos de trabajos terminados.
//  - Local / VPS: archivo server/data/orders.json
//  - Vercel: blob privado en Vercel Blob (el disco de las funciones no es persistente)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// DATA_DIR permite usar otra carpeta (p. ej. en las pruebas automáticas)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'orders.json')
const BLOB_PATH = 'letreros/orders.json'
const empty = () => ({ seq: 0, orders: [] })

export const usingBlob = !process.env.DATA_DIR && Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

const PHOTO_DIR = path.join(DATA_DIR, 'fotos')
const photoKey = (id) => `letreros/fotos/${id}`

const fileStore = {
  async putPhoto(id, buffer) {
    fs.mkdirSync(PHOTO_DIR, { recursive: true })
    fs.writeFileSync(path.join(PHOTO_DIR, id), buffer)
  },
  async getPhoto(id) {
    try {
      return fs.readFileSync(path.join(PHOTO_DIR, id))
    } catch {
      return null
    }
  },
  async deletePhoto(id) {
    fs.rmSync(path.join(PHOTO_DIR, id), { force: true })
  },
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
  async putPhoto(id, buffer, contentType) {
    const { put } = await import('@vercel/blob')
    await put(photoKey(id), buffer, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType })
  },
  async getPhoto(id) {
    const { get } = await import('@vercel/blob')
    const result = await get(photoKey(id), { access: 'private' }).catch(() => null)
    if (!result || result.statusCode !== 200 || !result.stream) return null
    return Buffer.from(await new Response(result.stream).arrayBuffer())
  },
  async deletePhoto(id) {
    const { del } = await import('@vercel/blob')
    await del(photoKey(id)).catch(() => {})
  },
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
