import { useState } from 'react'
import SiteHeader from '../components/SiteHeader'
import HelpDialog from '../components/HelpDialog'
import { usePublicSettings } from '../lib/settings'

// Aviso de privacidad simplificado (LFPDPPP). Usa los datos del panel → Negocio.
export default function Privacy() {
  const { business: b } = usePublicSettings()
  const [help, setHelp] = useState(false)
  const channels = [b.email && `el correo ${b.email}`, b.whatsapp && `WhatsApp ${b.whatsapp}`].filter(Boolean)
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
        <p>Puedes pedir acceso, rectificación, cancelación u oposición al uso de tus datos, o retirar tu consentimiento. Respondemos en un máximo de 20 días hábiles.</p>
        <p>
          <strong>Canal para ejercerlos:</strong>{' '}
          {channels.length ? `${channels.join(' o ')}. ` : ''}
          También puedes <button className="link-btn" onClick={() => setHelp(true)}>enviarnos tu solicitud aquí</button>; te damos un número de caso para darle seguimiento.
        </p>
        <h2>Cambios</h2>
        <p>Cualquier cambio a este aviso se publicará en esta página.</p>
        <p className="muted small">Última actualización: septiembre de 2026.</p>
      </article>
      {help && <HelpDialog onClose={() => setHelp(false)} kind="consulta" context="Solicitud sobre mis datos personales (derechos ARCO): " />}
    </div>
  )
}
