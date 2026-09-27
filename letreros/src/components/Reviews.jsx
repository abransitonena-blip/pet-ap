import { useEffect, useState } from 'react'
import LedPreview from './LedPreview'
import { api } from '../lib/api'
import { fileToJpeg, photoUrl } from '../lib/image'

export function Stars({ value, onChange, size = 18 }) {
  return (
    <span className={`stars ${onChange ? 'input' : ''}`} style={{ fontSize: size }} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" className={n <= value ? 'on' : ''} onClick={() => onChange(n)} aria-label={`${n} estrellas`}>★</button>
        ) : (
          <i key={n} className={n <= Math.round(value) ? 'on' : ''}>★</i>
        )
      )}
    </span>
  )
}

// El cliente opina desde su enlace privado cuando su letrero ya está terminado
export function ReviewForm({ doc, token, onSaved }) {
  const mine = doc.review
  const [stars, setStars] = useState(mine?.stars || 0)
  const [text, setText] = useState(mine?.text || '')
  const [business, setBusiness] = useState('')
  const [city, setCity] = useState('')
  const [image, setImage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(!mine)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setImage(await fileToJpeg(file))
    } catch (err) {
      setError(err.message)
    }
  }
  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!stars) return setError('Elige cuántas estrellas')
    setBusy(true)
    try {
      onSaved(await api.sendReview(doc.folio, { t: token, stars, text, name: doc.customer.name, business, city, image: image || undefined }))
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <section className="review-box no-print">
        <h3>¡Gracias por tu opinión!</h3>
        <p className="muted small">
          <Stars value={mine.stars} size={15} /> {mine.status === 'publicada' ? 'Ya aparece en nuestra página.' : 'La publicaremos en cuanto la revisemos.'}
        </p>
        {mine.stars >= 4 && doc.business.googleReviewUrl && (
          <a className="btn primary sm google-btn" href={doc.business.googleReviewUrl} target="_blank" rel="noreferrer">
            ¿Nos ayudas también con una reseña en Google?
          </a>
        )}
        <button className="link-btn" onClick={() => setEditing(true)}>Editar mi opinión</button>
      </section>
    )
  }
  return (
    <form className="review-box no-print" onSubmit={submit}>
      <h3>¿Cómo quedó tu letrero?</h3>
      <p className="muted small">Tu opinión y una foto ayudan a otros negocios a decidirse. Solo mostramos tu nombre y la inicial del apellido.</p>
      <Stars value={stars} onChange={setStars} size={30} />
      <textarea className="input" rows="3" maxLength={600} placeholder="Cuéntanos cómo te fue: atención, calidad, tiempo de entrega…" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row wrap">
        <input className="input grow" placeholder="Tu negocio (opcional)" maxLength={60} value={business} onChange={(e) => setBusiness(e.target.value)} />
        <input className="input grow" placeholder="Ciudad (opcional)" maxLength={40} value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="row">
        <label className="btn ghost sm file-btn">
          <input type="file" accept="image/*" onChange={pick} />
          {image ? 'Cambiar foto' : '📷 Agregar foto de tu letrero'}
        </label>
        {image && <img className="review-thumb" src={image} alt="Tu foto" />}
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar opinión'}</button>
    </form>
  )
}

// Opiniones públicas (solo las verificadas y aprobadas). Si aún no hay, no se muestra nada.
export function ReviewsSection() {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(null)
  useEffect(() => {
    api.reviews().then(setData).catch(() => {})
  }, [])
  if (!data?.count) return null
  return (
    <section className="reviews">
      <div className="reviews-head">
        <div>
          <h2>Lo que dicen nuestros clientes</h2>
          <span className="muted small">Opiniones de clientes con pedido entregado · compra verificada</span>
        </div>
        <div className="reviews-score">
          <strong>{data.avg.toFixed(1)}</strong>
          <Stars value={data.avg} size={16} />
          <span className="muted small">{data.count} {data.count === 1 ? 'opinión' : 'opiniones'}</span>
        </div>
      </div>
      <div className="reviews-strip">
        {data.items.map((r) => (
          <article key={r.id} className="review-card">
            <button className="review-media" onClick={() => r.photo && setOpen(r.photo)} disabled={!r.photo}>
              {r.photo ? <img src={photoUrl(r.photo)} alt={`Letrero de ${r.business || r.name}`} loading="lazy" /> : <LedPreview design={r.design} night />}
            </button>
            <div className="review-body">
              <Stars value={r.stars} size={14} />
              <p>“{r.text}”</p>
              <footer>
                <strong>{r.name}</strong>
                <span className="muted small">{[r.business, r.city].filter(Boolean).join(' · ')}</span>
                <span className="verified">✓ Compra verificada</span>
              </footer>
            </div>
          </article>
        ))}
      </div>
      {open && (
        <div className="lightbox" onClick={() => setOpen(null)}>
          <img src={photoUrl(open)} alt="Trabajo terminado" />
        </div>
      )}
    </section>
  )
}
