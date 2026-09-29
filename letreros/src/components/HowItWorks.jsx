import Icon from './Icon'
import { money } from '../lib/pricing'

// Proceso y condiciones reales (del panel → Negocio), con contacto visible o ayuda si falta
export default function HowItWorks({ business: b, onHelp }) {
  const wa = (b.whatsapp || '').replace(/\D/g, '')
  const steps = [
    { icon: 'bulb', title: 'Diseñas o nos cuentas tu idea', text: 'Ves el precio al instante; si no sabes diseñar, lo hacemos contigo.' },
    { icon: 'check', title: 'Revisamos y te mandamos tu presupuesto', text: `Lo apruebas en línea. Vale ${b.validityDays} días.` },
    { icon: 'wallet', title: `Anticipo de ${b.depositPct} %`, text: 'Con tu aprobación y el anticipo empezamos a fabricar; el resto al entregar.' },
    { icon: 'package', title: `Fabricamos en ${b.deliveryDays} días hábiles`, text: b.leadTimeNote || 'El plazo cuenta desde la aprobación y el anticipo.' },
    { icon: 'truck', title: 'Recoges, te lo enviamos o lo instalamos', text: [b.shippingCost ? `Envío ${money(b.shippingCost)}${b.freeShippingFrom ? `, gratis desde ${money(b.freeShippingFrom)}` : ''}` : '', b.installZones ? `Instalamos en ${b.installZones}` : ''].filter(Boolean).join(' · ') || 'Lo eliges al solicitar tu cotización.' }
  ]
  return (
    <section className="how">
      <div className="how-steps">
        <h2>Cómo funciona</h2>
        <ol>
          {steps.map((s, i) => (
            <li key={s.title}>
              <span className="how-icon"><Icon name={s.icon} size={20} /></span>
              <span><b>{i + 1}. {s.title}</b><em>{s.text}</em></span>
            </li>
          ))}
        </ol>
      </div>
      <aside className="how-side">
        <div className="card">
          <h3><Icon name="shield" size={18} /> Garantía</h3>
          <p className="small">{b.warrantyMonths > 0 ? `${b.warrantyMonths} meses. ` : ''}{b.warrantyNote || 'Pregúntanos la cobertura exacta antes de pedir; te la confirmamos por escrito en tu presupuesto.'}</p>
          <button className="link-btn" onClick={() => onHelp('garantia')}>Usar mi garantía</button>
        </div>
        <div className="card">
          <h3><Icon name="chat" size={18} /> Contacto</h3>
          {wa && <p className="small"><a href={`https://wa.me/${wa.length === 10 ? '52' + wa : wa}`} target="_blank" rel="noreferrer">WhatsApp {b.whatsapp}</a></p>}
          {b.email && <p className="small"><a href={`mailto:${b.email}`}>{b.email}</a></p>}
          {(b.address || b.city) && <p className="small">{[b.address, b.city].filter(Boolean).join(', ')}</p>}
          {b.hours && <p className="small muted">{b.hours}</p>}
          <button className="btn ghost sm" onClick={() => onHelp('consulta')}><Icon name="chat" size={16} /> Escríbenos aquí</button>
        </div>
      </aside>
    </section>
  )
}
