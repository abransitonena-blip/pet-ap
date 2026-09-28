import SiteHeader from '../components/SiteHeader'
import { usePublicSettings } from '../lib/settings'

// Aviso de privacidad simplificado (LFPDPPP). Usa los datos del panel → Negocio.
export default function Privacy() {
  const { business: b } = usePublicSettings()
  const contact = [b.email, b.whatsapp && `WhatsApp ${b.whatsapp}`].filter(Boolean).join(' o ') || 'nuestros medios de contacto'
  return (
    <div className="page">
      <SiteHeader />
      <article className="legal">
        <h1>Aviso de privacidad</h1>
        <p><strong>{b.name}</strong>{b.address || b.city ? `, con domicilio en ${[b.address, b.city].filter(Boolean).join(', ')},` : ''} es responsable del tratamiento de tus datos personales.</p>
        <h2>Datos que recabamos</h2>
        <p>Nombre o nombre del negocio, WhatsApp, correo (opcional), forma y fecha de entrega, notas del pedido, el diseño de tu letrero y, si decides compartirlas, tu opinión y fotos del letrero instalado.</p>
        <h2>Para qué los usamos</h2>
        <ul>
          <li>Preparar tu presupuesto, fabricar y entregar tu letrero, y darte seguimiento y garantía.</li>
          <li>Contactarte por WhatsApp o correo sobre tu pedido.</li>
          <li>Publicar tu opinión y fotos solo si tú las envías; mostramos únicamente tu nombre y la inicial de tu apellido.</li>
        </ul>
        <p>No vendemos ni rentamos tus datos. Solo se comparten con la paquetería cuando pides envío.</p>
        <h2>Tus derechos (ARCO)</h2>
        <p>Puedes pedir acceso, rectificación, cancelación u oposición al uso de tus datos, o retirar tu consentimiento, escribiéndonos a {contact}. Respondemos en un máximo de 20 días hábiles.</p>
        <h2>Cambios</h2>
        <p>Cualquier cambio a este aviso se publicará en esta página.</p>
        <p className="muted small">Última actualización: septiembre de 2026.</p>
      </article>
    </div>
  )
}
