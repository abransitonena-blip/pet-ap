import { Brand } from './ApLogo'

// Pie de página con contacto y redes (se llenan en el panel → Negocio)
export default function SiteFooter({ business }) {
  const wa = (business.whatsapp || '').replace(/\D/g, '')
  const links = [
    wa && { href: `https://wa.me/${wa.length === 10 ? '52' + wa : wa}`, label: 'WhatsApp' },
    business.instagram && { href: `https://instagram.com/${business.instagram}`, label: 'Instagram' },
    business.facebook && { href: business.facebook, label: 'Facebook' },
    business.googleReviewUrl && { href: business.googleReviewUrl, label: 'Opiniones en Google' }
  ].filter(Boolean)
  return (
    <footer className="site-footer">
      <Brand sub="letreros LED" />
      <span className="muted small">{[business.address, business.city].filter(Boolean).join(', ') || 'Letreros LED hechos a la medida en México'}</span>
      <nav>
        {links.map((l) => <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>)}
        <a href="#/cuenta">Mi cuenta</a>
        <a href="#/seguimiento">Seguir mi pedido</a>
        <a href="#/privacidad">Aviso de privacidad</a>
        <a href="#/admin">Equipo</a>
      </nav>
    </footer>
  )
}
