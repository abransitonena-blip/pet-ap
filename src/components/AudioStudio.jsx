import { useState } from 'react'
import './AudioStudio.css'

const FORMATS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'flac']
const LOSSLESS = ['wav', 'flac']
const STYLES = {
  youtube: 'Video de YouTube',
  short: 'Video corto (Reels/TikTok)',
  podcast: 'Podcast',
  resumen: 'Resumen ejecutivo',
  articulo: 'Artículo de blog',
}

const mb = bytes => `${(bytes / 1024 / 1024).toFixed(2)} MB`

async function api(url, options) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

const postJson = (url, body) =>
  api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

function AudioStudio() {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('mp3')
  const [bitrate, setBitrate] = useState('192k')
  const [job, setJob] = useState(null) // { id }
  const [results, setResults] = useState([]) // [{ format, filename, size }]
  const [transcript, setTranscript] = useState('')
  const [style, setStyle] = useState('youtube')
  const [notes, setNotes] = useState('')
  const [script, setScript] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const run = async (label, fn) => {
    setBusy(label)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy('')
    }
  }

  const addResult = r => setResults(prev => [...prev.filter(x => x.format !== r.format), r])

  const convert = () =>
    run('Convirtiendo…', async () => {
      if (job) {
        addResult(await postJson(`/api/audio/${job.id}/convert`, { format, bitrate }))
        return
      }
      const body = new FormData()
      body.append('video', file)
      body.append('format', format)
      body.append('bitrate', bitrate)
      const r = await api('/api/audio/convert', { method: 'POST', body })
      setJob({ id: r.id })
      setResults([r])
    })

  const transcribe = () =>
    run('Transcribiendo…', async () => {
      const r = await postJson(`/api/audio/${job.id}/transcribe`, {})
      setTranscript(r.transcript)
    })

  const generate = () =>
    run('Generando guion…', async () => {
      const r = await postJson('/api/script', { transcript, style, notes })
      setScript(r.script)
    })

  const onFile = f => {
    setFile(f)
    setJob(null)
    setResults([])
    setTranscript('')
    setScript('')
    setError('')
  }

  return (
    <section className="studio">
      <h2>🎬 Video → Audio → Guion</h2>

      <div className="studio-card">
        <h3>1. Sube tu video</h3>
        <input
          type="file"
          accept="video/*,audio/*"
          onChange={e => e.target.files[0] && onFile(e.target.files[0])}
        />
        {file && <p className="muted">{file.name} · {mb(file.size)}</p>}

        <div className="row">
          <label>
            Formato
            <select value={format} onChange={e => setFormat(e.target.value)}>
              {FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </label>
          <label>
            Calidad
            <select
              value={bitrate}
              onChange={e => setBitrate(e.target.value)}
              disabled={LOSSLESS.includes(format)}
            >
              {['64k', '96k', '128k', '192k', '256k', '320k'].map(b => <option key={b}>{b}</option>)}
            </select>
          </label>
          <button className="primary" onClick={convert} disabled={!file || busy}>
            {job ? 'Convertir a este formato' : 'Extraer audio'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="studio-card">
          <h3>2. Descarga</h3>
          <ul className="downloads">
            {results.map(r => (
              <li key={r.format}>
                <span>{r.filename} <span className="muted">· {mb(r.size)}</span></span>
                <a className="primary" href={`/api/audio/${job.id}/download/${r.format}`} download>
                  ⬇ Descargar
                </a>
              </li>
            ))}
          </ul>
          <p className="muted">Puedes elegir otro formato arriba y convertir sin volver a subir el video.</p>
        </div>
      )}

      {job && (
        <div className="studio-card">
          <h3>3. Transcribe y crea el guion</h3>
          <button className="primary" onClick={transcribe} disabled={busy}>
            📝 Transcribir audio
          </button>
          <textarea
            placeholder="La transcripción aparecerá aquí (puedes editarla o pegar la tuya)"
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            rows={8}
          />
          <div className="row">
            <label>
              Tipo de guion
              <select value={style} onChange={e => setStyle(e.target.value)}>
                {Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="grow">
              Indicaciones (opcional)
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Tono, duración, público…"
              />
            </label>
            <button className="primary" onClick={generate} disabled={!transcript.trim() || busy}>
              ✨ Generar guion
            </button>
          </div>
          {script && (
            <>
              <textarea value={script} onChange={e => setScript(e.target.value)} rows={14} />
              <button onClick={() => navigator.clipboard?.writeText(script)}>📋 Copiar guion</button>
            </>
          )}
        </div>
      )}

      {busy && <p className="status">{busy}</p>}
      {error && <p className="status error">⚠️ {error}</p>}
    </section>
  )
}

export default AudioStudio
