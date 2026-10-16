import { Router } from 'express'
import multer from 'multer'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const WORK_DIR = path.join(os.tmpdir(), 'petap-audio')
fs.mkdirSync(WORK_DIR, { recursive: true })

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 500)
const TTL_MS = 60 * 60 * 1000 // los archivos se borran tras 1 hora

const FORMATS = {
  mp3: { ext: 'mp3', mime: 'audio/mpeg', args: ['-c:a', 'libmp3lame'], lossy: true },
  wav: { ext: 'wav', mime: 'audio/wav', args: ['-c:a', 'pcm_s16le'], lossy: false },
  m4a: { ext: 'm4a', mime: 'audio/mp4', args: ['-c:a', 'aac'], lossy: true },
  aac: { ext: 'aac', mime: 'audio/aac', args: ['-c:a', 'aac', '-f', 'adts'], lossy: true },
  ogg: { ext: 'ogg', mime: 'audio/ogg', args: ['-c:a', 'libvorbis'], lossy: true },
  opus: { ext: 'opus', mime: 'audio/ogg', args: ['-c:a', 'libopus'], lossy: true },
  flac: { ext: 'flac', mime: 'audio/flac', args: ['-c:a', 'flac'], lossy: false },
}
const BITRATES = new Set(['64k', '96k', '128k', '192k', '256k', '320k'])

// id -> { source, outputs: { fmt: path }, name, createdAt }
const jobs = new Map()

const upload = multer({
  storage: multer.diskStorage({
    destination: WORK_DIR,
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).slice(0, 8)}`),
  }),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
})

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args])
    let err = ''
    proc.stderr.on('data', d => (err += d))
    proc.on('error', e => reject(new Error(`No se pudo ejecutar ffmpeg: ${e.message}`)))
    proc.on('close', code =>
      code === 0 ? resolve() : reject(new Error(err.trim().split('\n').pop() || 'ffmpeg falló'))
    )
  })
}

async function convert(job, format, bitrate) {
  const f = FORMATS[format]
  const out = path.join(WORK_DIR, `${randomUUID()}.${f.ext}`)
  const args = ['-i', job.source, '-vn', ...f.args]
  if (f.lossy) args.push('-b:a', bitrate)
  await ffmpeg([...args, out])
  return out
}

function cleanup() {
  const now = Date.now()
  for (const [id, job] of jobs) {
    if (now - job.createdAt < TTL_MS) continue
    for (const p of [job.source, ...Object.values(job.outputs), job.speech].filter(Boolean)) {
      fs.rm(p, { force: true }, () => {})
    }
    jobs.delete(id)
  }
}
setInterval(cleanup, 10 * 60 * 1000).unref()

const router = Router()

router.get('/audio/formats', (_req, res) => {
  res.json({ formats: Object.keys(FORMATS), bitrates: [...BITRATES], maxUploadMb: MAX_UPLOAD_MB })
})

// Sube un video y lo convierte al formato pedido
router.post('/audio/convert', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Falta el archivo de video' })
  const format = String(req.body.format || 'mp3').toLowerCase()
  const bitrate = BITRATES.has(req.body.bitrate) ? req.body.bitrate : '192k'
  if (!FORMATS[format]) {
    fs.rm(req.file.path, { force: true }, () => {})
    return res.status(400).json({ error: `Formato no soportado: ${format}` })
  }

  const id = randomUUID()
  const job = {
    source: req.file.path,
    name: path.parse(req.file.originalname).name || 'audio',
    outputs: {},
    createdAt: Date.now(),
  }
  try {
    job.outputs[format] = await convert(job, format, bitrate)
    jobs.set(id, job)
    res.json({
      id,
      format,
      filename: `${job.name}.${FORMATS[format].ext}`,
      size: fs.statSync(job.outputs[format]).size,
    })
  } catch (e) {
    fs.rm(job.source, { force: true }, () => {})
    res.status(422).json({ error: `No se pudo extraer el audio: ${e.message}` })
  }
})

// Convierte el mismo video a otro formato sin volver a subirlo
router.post('/audio/:id/convert', async (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Archivo expirado o inexistente' })
  const format = String(req.body.format || '').toLowerCase()
  const bitrate = BITRATES.has(req.body.bitrate) ? req.body.bitrate : '192k'
  if (!FORMATS[format]) return res.status(400).json({ error: `Formato no soportado: ${format}` })
  try {
    job.outputs[format] ||= await convert(job, format, bitrate)
    res.json({
      id: req.params.id,
      format,
      filename: `${job.name}.${FORMATS[format].ext}`,
      size: fs.statSync(job.outputs[format]).size,
    })
  } catch (e) {
    res.status(422).json({ error: `No se pudo convertir: ${e.message}` })
  }
})

router.get('/audio/:id/download/:format', (req, res) => {
  const job = jobs.get(req.params.id)
  const file = job?.outputs[req.params.format]
  if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })
  const f = FORMATS[req.params.format]
  res.type(f.mime)
  res.download(file, `${job.name}.${f.ext}`)
})

// Audio compacto (mono, 16 kHz) para respetar el límite de 25 MB de la API de transcripción
async function speechFile(job) {
  if (!job.speech) {
    const out = path.join(WORK_DIR, `${randomUUID()}.mp3`)
    await ffmpeg(['-i', job.source, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', out])
    job.speech = out
  }
  return job.speech
}

router.post('/audio/:id/transcribe', async (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Archivo expirado o inexistente' })
  const key = process.env.OPENAI_API_KEY
  if (!key) return res.status(501).json({ error: 'Falta OPENAI_API_KEY en el servidor para transcribir' })
  try {
    const file = await speechFile(job)
    if (fs.statSync(file).size > 25 * 1024 * 1024) {
      return res.status(413).json({ error: 'El audio supera 25 MB tras comprimirlo (video de más de ~70 min)' })
    }
    const form = new FormData()
    form.append('file', new Blob([fs.readFileSync(file)], { type: 'audio/mpeg' }), 'audio.mp3')
    form.append('model', process.env.TRANSCRIBE_MODEL || 'whisper-1')
    if (req.body.language) form.append('language', String(req.body.language))
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'Error de transcripción' })
    job.transcript = data.text
    res.json({ transcript: data.text })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const SCRIPT_STYLES = {
  youtube: 'un guion para video de YouTube con gancho inicial, desarrollo por secciones y cierre con llamada a la acción',
  short: 'un guion para video corto vertical (TikTok/Reels/Shorts) de máximo 60 segundos, con gancho en los primeros 3 segundos',
  podcast: 'un guion de episodio de podcast con introducción, segmentos y cierre',
  resumen: 'un resumen ejecutivo estructurado con puntos clave',
  articulo: 'un artículo de blog con título, subtítulos y conclusión',
}

router.post('/script', async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(501).json({ error: 'Falta ANTHROPIC_API_KEY en el servidor para generar guiones' })
  const transcript = String(req.body.transcript || '').trim()
  if (!transcript) return res.status(400).json({ error: 'Falta la transcripción' })
  const style = SCRIPT_STYLES[req.body.style] ? req.body.style : 'youtube'
  const notes = String(req.body.notes || '').slice(0, 1000)
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.SCRIPT_MODEL || 'claude-sonnet-5-5',
        max_tokens: 4096,
        system:
          'Eres un guionista profesional. Escribes en el mismo idioma que la transcripción, salvo que se indique otro. Usa solo la información de la transcripción; no inventes datos.',
        messages: [
          {
            role: 'user',
            content: `Con base en esta transcripción, escribe ${SCRIPT_STYLES[style]}.${
              notes ? `\n\nIndicaciones adicionales: ${notes}` : ''
            }\n\n<transcripcion>\n${transcript}\n</transcripcion>`,
          },
        ],
      }),
    })
    const data = await r.json()
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'Error al generar el guion' })
    res.json({ script: data.content.map(b => b.text || '').join('') })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Errores de multer (p. ej. archivo demasiado grande)
router.use((err, _req, res, _next) => {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 500
  res.status(status).json({
    error: err.code === 'LIMIT_FILE_SIZE' ? `El video supera ${MAX_UPLOAD_MB} MB` : err.message,
  })
})

export default router
