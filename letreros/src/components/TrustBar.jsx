import { money } from '../lib/pricing'
import LedIcon from './LedIcon'

// Garantías del negocio (se editan en el panel → Negocio)
export default function TrustBar({ business, total }) {
  const items = [
    business.warrantyMonths > 0 && { icon: 'shield', title: `Garantía ${business.warrantyMonths} meses`, note: 'LED y fuente de poder' },
    { icon: 'bolt', title: `Listo en ${business.deliveryDays} días`, note: 'hábiles, hecho a la medida' },
    business.shippingCost > 0 && business.freeShippingFrom > 0 && { icon: 'box', title: `Envío gratis desde ${money(business.freeShippingFrom)}`, note: 'a todo México' },
    business.installments > 0
      ? { icon: 'card', title: `${business.installments} meses sin intereses`, note: total ? `${money(Math.ceil(total / business.installments))} al mes con tarjeta` : 'con tarjeta' }
      : business.depositPct > 0 && business.depositPct < 100 && { icon: 'card', title: `Anticipo ${business.depositPct} %`, note: 'y el resto al entregar' }
  ].filter(Boolean)
  return (
    <div className="trust-bar">
      {items.map((i) => (
        <div key={i.title}>
          <span className="trust-icon"><LedIcon name={i.icon} size={26} /></span>
          <span><strong>{i.title}</strong><em>{i.note}</em></span>
        </div>
      ))}
    </div>
  )
}
