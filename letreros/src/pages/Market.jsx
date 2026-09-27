import { useMemo, useState } from 'react'
import { ACTIONS, COMPETITORS, MARKET_FACTS, MARKET_UPDATED, REFERENCE_SIGNS, RISKS, SOURCES, STRENGTHS } from '../lib/market'
import { FRAME_LINE, defaultLedDesign, normalizeLedDesign } from '../lib/ledSign'
import { computeTotals } from '../lib/prices'
import { money, quote } from '../lib/pricing'

const DONE_KEY = 'ap_market_done'
const readDone = () => {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) || '[]')
  } catch {
    return []
  }
}
const SCALE_MAX = 2400
const pct = (v) => `${Math.min(100, (v / SCALE_MAX) * 100)}%`
const Src = ({ id }) => (
  <a className="src" href={SOURCES[id].url} target="_blank" rel="noreferrer" title={SOURCES[id].name}>fuente</a>
)

// Tu precio actual (con la tabla de precios del panel) para letreros típicos
function referencePrice(ref, settings) {
  const dots = Array.from({ length: ref.leds }, (_, i) => [10 + (i % 60) * 5, 10 + Math.floor(i / 60) * 5, 0, i])
  const frame = Array.from({ length: ref.frame || 0 }, (_, i) => [5, 5, FRAME_LINE, i % 6])
  const design = normalizeLedDesign({
    ...defaultLedDesign(),
    widthCm: ref.widthCm,
    heightCm: ref.heightCm,
    frame: { on: Boolean(ref.frame), color: 'blanco' },
    lines: [{ text: 'X', color: 'rojo' }],
    dots: [...dots, ...frame]
  })
  const q = quote({ ...design, quantity: 1 }, settings.prices)
  return computeTotals(q, {}, settings.business).total
}

export default function Market({ settings }) {
  const [done, setDone] = useState(readDone)
  const toggle = (id) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]
    setDone(next)
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify(next))
    } catch {
      /* sin almacenamiento */
    }
  }
  const refs = useMemo(() => (settings ? REFERENCE_SIGNS.map((r) => ({ ...r, price: referencePrice(r, settings) })) : []), [settings])

  return (
    <div className="market">
      <p className="muted small">Investigación de {MARKET_UPDATED} con precios públicos en línea y datos oficiales. Los precios de la competencia cambian: revisa cada 3 meses.</p>

      <div className="facts">
        {MARKET_FACTS.map((f) => (
          <div className="fact" key={f.label}>
            <strong>{f.value}</strong>
            <span>{f.label}</span>
            <em>{f.note} · <Src id={f.source} /></em>
          </div>
        ))}
      </div>

      <section className="card">
        <h2>¿Dónde está tu precio?</h2>
        <p className="muted small">Rangos de la competencia (MXN, IVA incl.) y tu precio actual calculado con tu tabla de <b>Precios</b>.</p>
        <div className="price-map">
          <div className="pm-axis">{[0, 500, 1000, 1500, 2000].map((v) => <span key={v} style={{ left: pct(v) }}>{money(v)}</span>)}</div>
          {COMPETITORS.map((c) => (
            <div className="pm-row" key={c.segment}>
              <span className="pm-label">{c.segment}</span>
              <div className="pm-track"><i style={{ left: pct(c.price[0]), width: `calc(${pct(c.price[1])} - ${pct(c.price[0])})` }} /></div>
            </div>
          ))}
          {refs.map((r) => (
            <div className="pm-row ours" key={r.name}>
              <span className="pm-label">AP · {r.name}</span>
              <div className="pm-track"><b style={{ left: pct(r.price) }} title={money(r.price)} /><em style={{ left: pct(r.price) }}>{money(r.price)}</em></div>
            </div>
          ))}
        </div>
        {refs[0] && (
          <p className="pm-verdict">
            {refs[0].price < 690
              ? 'Tu letrero chico está al nivel del Radox genérico: puedes subirlo, el tuyo es a la medida.'
              : refs[0].price <= 999
                ? 'Tu letrero chico está en la zona ideal: arriba del genérico y debajo del neón flex.'
                : 'Tu letrero chico ya cuesta como un neón flex: justifica el precio con acabados, 3D y garantía, o baja el precio de entrada.'}
          </p>
        )}
      </section>

      <section className="card">
        <h2>Competencia</h2>
        <div className="table-wrap">
          <table className="market-table">
            <thead><tr><th>Segmento</th><th>Quién</th><th>Precio</th><th>Entrega</th><th>¿A la medida?</th></tr></thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.segment}>
                  <td><strong>{c.segment}</strong><div className="muted small">{c.examples}</div></td>
                  <td>{c.who}</td>
                  <td className="nowrap">{money(c.price[0])} – {money(c.price[1])} <Src id={c.source} /></td>
                  <td>{c.time}</td>
                  <td>{c.custom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-grid">
        <section className="card">
          <h2>Tus ventajas</h2>
          <ul className="bullets ok">{STRENGTHS.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
        <section className="card">
          <h2>Riesgos</h2>
          <ul className="bullets warn">{RISKS.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
      </div>

      <section className="card">
        <h2>Plan de acción <span className="muted small">{done.length}/{ACTIONS.length} hechas</span></h2>
        <ul className="actions-list">
          {ACTIONS.map((a) => (
            <li key={a.id} className={done.includes(a.id) ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={done.includes(a.id)} onChange={() => toggle(a.id)} />
                <span><strong>{a.title}</strong><em>{a.detail}</em></span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Fuentes</h2>
        <ul className="sources">
          {Object.values(SOURCES).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></li>)}
        </ul>
      </section>
    </div>
  )
}
