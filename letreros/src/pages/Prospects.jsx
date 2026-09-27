import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { GIROS, LEAD_STATES, WEEKLY_GOAL, sampleDesign } from '../lib/prospects'
import { shareUrl } from '../lib/share'
import { boardBase, ledColorById } from '../lib/ledSign'

const waLink = (phone, text) => {
  const d = (phone || '').replace(/\D/g, '')
  return d ? `https://wa.me/${d.length === 10 ? '52' + d : d}?text=${encodeURIComponent(text)}` : ''
}
const weekStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString()
}
const EMPTY = { name: '', giro: 'taqueria', contact: '', phone: '', zone: '', note: '' }

// Prospección: registra negocios visitados y mándales una muestra con su nombre
export default function Prospects({ business, prices }) {
  const [leads, setLeads] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [filter, setFilter] = useState('todos')
  const [error, setError] = useState('')
  const [printing, setPrinting] = useState('')
  const catalog = async () => {
    setPrinting('…')
    try {
      const { printCatalog } = await import('../lib/catalog')
      await printCatalog({ prices, business, onProgress: setPrinting })
    } catch (e) {
      setError(e.message)
    } finally {
      setPrinting('')
    }
  }
  const load = () => api.leads().then(setLeads).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])
  const act = async (fn) => {
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e.message)
    }
  }
  const add = (e) => {
    e.preventDefault()
    act(async () => {
      await api.addLead(form)
      setForm((f) => ({ ...EMPTY, giro: f.giro, zone: f.zone }))
    })
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const since = weekStart()
  const visitedWeek = leads.filter((l) => l.visitedAt && l.visitedAt >= since).length
  const list = useMemo(() => leads.filter((l) => filter === 'todos' || l.status === filter), [leads, filter])
  const funnel = LEAD_STATES.map((s) => ({ ...s, n: leads.filter((l) => l.status === s.id).length }))

  return (
    <div className="prospects">
      <div className="kpis">
        <div className="kpi"><span>Visitas esta semana</span><strong>{visitedWeek} / {WEEKLY_GOAL}</strong><i className="goal"><b style={{ width: `${Math.min(100, (visitedWeek / WEEKLY_GOAL) * 100)}%` }} /></i></div>
        {funnel.filter((s) => s.id !== 'por_visitar' && s.id !== 'no').map((s) => (
          <div className="kpi" key={s.id}><span>{s.name}</span><strong>{s.n}</strong></div>
        ))}
        <div className="kpi"><span>Conversión</span><strong>{leads.length ? Math.round((funnel.find((s) => s.id === 'cliente').n / leads.length) * 100) : 0} %</strong></div>
      </div>

      <form className="card lead-form" onSubmit={add}>
        <div className="row between full">
          <h2>Nuevo prospecto</h2>
          <button type="button" className="btn ghost sm" onClick={catalog} disabled={Boolean(printing) || !prices}>
            {printing ? `Preparando ${printing}` : '🖨 Imprimir catálogo'}
          </button>
        </div>
        <div className="lead-grid">
          <input className="input" placeholder="Nombre del negocio *" value={form.name} onChange={set('name')} maxLength={60} />
          <select className="input" value={form.giro} onChange={set('giro')}>
            {GIROS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input className="input" placeholder="Contacto (dueño/encargado)" value={form.contact} onChange={set('contact')} maxLength={60} />
          <input className="input" placeholder="WhatsApp" value={form.phone} onChange={set('phone')} inputMode="tel" maxLength={20} />
          <input className="input" placeholder="Zona / colonia" value={form.zone} onChange={set('zone')} maxLength={60} />
          <input className="input" placeholder="Nota (qué letrero tiene hoy, interés…)" value={form.note} onChange={set('note')} maxLength={400} />
        </div>
        <button className="btn primary sm" disabled={!form.name.trim()}>Agregar</button>
        {error && <p className="error">{error}</p>}
      </form>

      <div className="chips">
        <button className={filter === 'todos' ? 'active' : ''} onClick={() => setFilter('todos')}>Todos {leads.length}</button>
        {funnel.map((s) => (
          <button key={s.id} className={filter === s.id ? 'active' : ''} onClick={() => setFilter(s.id)}>
            <span className="led sm" style={{ '--led': s.color }} /> {s.name} {s.n}
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="muted">Sin prospectos aquí. Agrega los negocios que visites: cada uno recibe una muestra de letrero con su nombre.</p>}
      <div className="lead-list">
        {list.map((l) => {
          const design = sampleDesign(l)
          const link = shareUrl(design)
          const giro = GIROS.find((g) => g.id === l.giro)?.name
          const msg = `Hola${l.contact ? ` ${l.contact.split(' ')[0]}` : ''}, soy de ${business?.name || 'AP letreros'}. Te hice una muestra de letrero LED para ${l.name} 👉 ${link} Ahí puedes cambiar texto, colores y tamaño y ver el precio al instante.`
          return (
            <article key={l.id} className="lead-card">
              <a className="lead-sample" href={link} target="_blank" rel="noreferrer" title="Abrir la muestra en el editor" style={{ background: boardBase(design) }}>
                <span style={{ fontFamily: `"${design.lines[0].font}"`, color: ledColorById(design.lines[0].color).hex, textShadow: `0 0 8px ${ledColorById(design.lines[0].color).hex}` }}>
                  {design.lines[0].text}
                </span>
                <em>Ver muestra ↗</em>
              </a>
              <div className="grow">
                <div className="row between">
                  <strong>{l.name}</strong>
                  <select className="input sm" value={l.status} onChange={(e) => act(() => api.updateLead(l.id, { status: e.target.value }))}>
                    {LEAD_STATES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <span className="muted small">{[giro, l.contact, l.zone, l.phone].filter(Boolean).join(' · ')}</span>
                {l.note && <p className="small">{l.note}</p>}
                <div className="row wrap">
                  {waLink(l.phone, msg) && (
                    <a className="btn primary sm" href={waLink(l.phone, msg)} target="_blank" rel="noreferrer" onClick={() => l.status === 'por_visitar' || l.status === 'visitado' ? act(() => api.updateLead(l.id, { status: 'muestra' })) : null}>
                      Enviar muestra por WhatsApp
                    </a>
                  )}
                  <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(link)}>Copiar enlace</button>
                  <button className="link-btn danger" onClick={() => confirm(`¿Borrar ${l.name}?`) && act(() => api.deleteLead(l.id))}>Borrar</button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
