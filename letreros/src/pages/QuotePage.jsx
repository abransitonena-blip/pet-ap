import { useEffect, useState } from 'react'
import DesignPreview from '../components/DesignPreview'
import { Brand } from '../components/ApLogo'
import { api } from '../lib/api'
import { money } from '../lib/pricing'
import { ANIMATIONS, MOUNTS, POWER, SHAPES, boardMaterialById } from '../lib/ledSign'
import { materialById } from '../lib/pricing'
import { statusById } from '../lib/status'

const fmt = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
const wa = (phone, text) => {
  const d = (phone || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}

function specs(d) {
  if (d.kind === 'led') {
    return [
      ['Medida', `${d.widthCm} × ${d.heightCm} cm`],
      ['LED', `${d.dots.length} de ${d.ledMm} mm`],
      ['Placa', `${boardMaterialById(d.material).name} · ${SHAPES.find((s) => s.id === d.shape)?.name || ''}`],
      ['Montaje', MOUNTS.find((m) => m.id === d.mount)?.name || '—'],
      ['Encendido', ANIMATIONS.find((a) => a.id === d.animation)?.name || '—'],
      ['Alimentación', POWER.find((p) => p.id === d.power)?.name || '—'],
      ['Texto', d.lines.map((l) => l.text || (l.icon ? `ícono ${l.icon}` : '')).filter(Boolean).join(' / ')]
    ]
  }
  return [
    ['Medida', `${d.widthCm} × ${d.heightCm} cm`],
    ['Material', materialById(d.material).name],
    ['Texto', d.lines.map((l) => l.text).filter(Boolean).join(' / ')]
  ]
}

export default function QuotePage({ folio, token }) {
  const [doc, setDoc] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.quoteDoc(folio, token).then(setDoc).catch((e) => setError(e.message))
  }, [folio, token])

  const respond = async (accept) => {
    if (!accept && !confirm('¿Seguro que quieres rechazar este presupuesto?')) return
    setBusy(true)
    try {
      setDoc(await api.respondQuote(folio, token, accept))
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div className="quote-page">
        <div className="quote-doc empty-doc"><Brand /><p className="error">{error}</p><a href="#/">Ir al inicio</a></div>
      </div>
    )
  }
  if (!doc) return <div className="quote-page"><p className="muted center">Cargando presupuesto…</p></div>

  const b = doc.business
  const t = doc.totals
  const expired = new Date(doc.validUntil) < new Date() && doc.quoteState !== 'aceptada'
  const open = !expired && ['pendiente', 'enviada'].includes(doc.quoteState)
  const volume = doc.quote.discount > 0

  return (
    <div className="quote-page">
      <div className="quote-actions no-print">
        <a href="#/" className="brand-link"><Brand /></a>
        <div className="row">
          <button className="btn ghost sm" onClick={() => window.print()}>Descargar PDF</button>
          {b.whatsapp && (
            <a className="btn ghost sm" href={wa(b.whatsapp, `Hola, tengo una duda sobre mi presupuesto ${doc.folio}.`)} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <article className="quote-doc">
        <header className="qd-head">
          <div>
            <Brand sub="letreros" />
            <p className="muted small qd-contact">
              {[b.address, b.city].filter(Boolean).join(', ')}
              {b.whatsapp && <><br />WhatsApp {b.whatsapp}</>}
              {b.email && <><br />{b.email}</>}
            </p>
          </div>
          <div className="qd-title">
            <span>Presupuesto</span>
            <strong>{doc.folio}</strong>
            <em>{fmt(doc.createdAt)}</em>
          </div>
        </header>

        <section className="qd-meta">
          <div><span>Cliente</span><strong>{doc.customer.name}</strong></div>
          <div><span>Válido hasta</span><strong className={expired ? 'bad' : ''}>{fmt(doc.validUntil)}{expired ? ' (vencido)' : ''}</strong></div>
          <div><span>Entrega estimada</span><strong>{b.deliveryDays} días hábiles</strong></div>
          <div>
            <span>Estado</span>
            <strong className={`qstate ${doc.quoteState}`}>
              {{ pendiente: 'Por revisar', enviada: 'Por revisar', aceptada: 'Aceptado', rechazada: 'Rechazado' }[doc.quoteState]}
              {doc.quoteState === 'aceptada' && ` · ${statusById(doc.status).label}`}
            </strong>
          </div>
        </section>

        <section className="qd-design">
          <div className="qd-preview"><DesignPreview design={doc.design} night withMount /></div>
          <dl className="qd-specs">
            {specs(doc.design).map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>

        <table className="qd-table">
          <thead>
            <tr><th>Concepto</th><th>Importe</th></tr>
          </thead>
          <tbody>
            {doc.quote.lines.map((l, i) => (
              <tr key={i}><td>{l.label}{i === 0 && doc.quote.quantity > 1 ? ` · ${doc.quote.quantity} piezas` : ''}</td><td>{money(l.amount)}</td></tr>
            ))}
            {volume && (
              <tr className="minus"><td>Descuento por volumen ({Math.round(doc.quote.discountRate * 100)} %)</td><td>−{money(doc.quote.discount)}</td></tr>
            )}
            {doc.adjust.items.map((i, k) => (
              <tr key={`a${k}`} className={i.amount < 0 ? 'minus' : ''}><td>{i.label}</td><td>{i.amount < 0 ? '−' : ''}{money(Math.abs(i.amount))}</td></tr>
            ))}
            {t.discount > 0 && (
              <tr className="minus">
                <td>Descuento{doc.adjust.discountPct ? ` (${doc.adjust.discountPct} %)` : ''}</td>
                <td>−{money(t.discount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <section className="qd-totals">
          <div><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
          <div><span>IVA {t.ivaRate} %{t.ivaIncluded ? ' (incluido)' : ''}</span><span>{money(t.iva)}</span></div>
          <div className="grand"><span>Total</span><span>{money(t.total)}</span></div>
          {t.depositPct > 0 && t.depositPct < 100 && (
            <div className="deposit"><span>Anticipo para iniciar ({t.depositPct} %)</span><span>{money(t.deposit)}</span></div>
          )}
        </section>

        {doc.adjust.note && <p className="qd-note">{doc.adjust.note}</p>}

        {open && (
          <div className="qd-accept no-print">
            <p>¿Todo bien? Acepta el presupuesto y empezamos tu letrero.</p>
            <div className="row">
              <button className="btn primary" disabled={busy} onClick={() => respond(true)}>Aceptar presupuesto</button>
              <button className="link-btn" disabled={busy} onClick={() => respond(false)}>Rechazar</button>
            </div>
          </div>
        )}
        {doc.quoteState === 'aceptada' && (
          <div className="qd-ok">
            <span className="led" style={{ '--led': '#22c55e' }} /> Presupuesto aceptado. Te contactaremos para el anticipo
            {b.whatsapp && <> · <a href={wa(b.whatsapp, `Acepté el presupuesto ${doc.folio}. ¿Cómo pago el anticipo?`)} target="_blank" rel="noreferrer">escríbenos</a></>}.
          </div>
        )}

        <footer className="qd-foot">
          {b.bank && <p><strong>Datos para pago:</strong> {b.bank}</p>}
          <p className="terms">{b.terms}</p>
        </footer>
      </article>
    </div>
  )
}
