import SignPreview from './SignPreview'
import LedPreview from './LedPreview'

// Muestra cualquier tipo de letrero: impreso o de puntos LED
export default function DesignPreview({ design, night, animate, ...props }) {
  if (design.kind === 'led') return <LedPreview design={design} night={night ?? true} animate={animate} {...props} />
  return <SignPreview design={design} night={night} {...props} />
}
