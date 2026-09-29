import { useEffect, useId, useRef } from 'react'

// Ventana modal accesible (patrón W3C/APG): role="dialog", aria-modal, título ligado,
// foco al abrir, Tab no se sale, Escape cierra y el foco regresa a donde estaba.
// `dirty`: si hay datos escritos, un clic fuera no la cierra (se evita perder el formulario).
export default function Dialog({ title, onClose, dirty = false, children, className = '' }) {
  const ref = useRef(null)
  const titleId = useId()
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  useEffect(() => {
    const back = document.activeElement
    const box = ref.current
    const focusables = () => [...box.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null)
    ;(box.querySelector('[autofocus], input, select, textarea') || focusables()[0] || box).focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (!dirtyRef.current || confirm('¿Cerrar? Se perderá lo que escribiste.')) closeRef.current()
      }
      if (e.key === 'Tab') {
        const list = focusables()
        if (!list.length) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    // En el documento: aunque el foco se pierda (p. ej. el botón que se presionó desaparece), Escape y Tab funcionan
    document.addEventListener('keydown', onKey)
    // Si el foco sale de la ventana, regresa a ella
    const onFocus = (e) => {
      if (!box.contains(e.target)) (focusables()[0] || box).focus()
    }
    document.addEventListener('focusin', onFocus)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocus)
      document.body.style.overflow = prevOverflow
      back?.focus?.()
    }
  }, [])

  // Cuando cambia el contenido (p. ej. de formulario a confirmación) el foco pasa al nuevo título
  useEffect(() => {
    const box = ref.current
    if (box && !box.contains(document.activeElement)) box.focus()
  }, [title])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !dirtyRef.current && onClose()}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 id={titleId} className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}
