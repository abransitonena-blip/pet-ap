// Servidor Node para local o VPS: API + frontend compilado (dist/)
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 5001
const DIST_DIR = path.join(__dirname, '..', 'dist')

const app = createApp()

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`🪧 Letreros API en http://localhost:${PORT}`)
})
