// Íconos pequeños de la interfaz del editor LED (forma, montaje y estilo de puntos)

export function ShapeIcon({ shape }) {
  const d = {
    rect: 'M3 6h18v12H3z',
    round: 'M7 6h10a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z',
    pill: 'M9 6h6a6 6 0 0 1 0 12H9A6 6 0 0 1 9 6z',
    circle: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z',
    arch: 'M4 20V11a8 8 0 0 1 16 0v9z',
    hex: 'M7 5h10l5 7-5 7H7l-5-7z'
  }[shape]
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export function MountIcon({ mount }) {
  const body = {
    pared: <><path d="M3 3v18" /><rect x="6" y="7" width="14" height="9" rx="1.5" /><circle cx="8.5" cy="9.5" r=".8" /><circle cx="17.5" cy="9.5" r=".8" /></>,
    colgante: <><path d="M12 2v2M12 4 6 10M12 4l6 6" /><rect x="4" y="10" width="16" height="9" rx="1.5" /></>,
    bandera: <><path d="M3 2v20M3 5h18M9 5v4M19 5v4" /><rect x="7" y="9" width="14" height="9" rx="1.5" /></>,
    base: <><rect x="6" y="3" width="12" height="13" rx="1.5" /><path d="M3 20h18M5 20l1.5-4h11L19 20" /></>
  }[mount]
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {body}
    </svg>
  )
}

export function DotIcon({ style }) {
  const pts = {
    trazo: [[2, 12], [5, 8], [8, 4], [11, 8], [14, 12]],
    contorno: [[3, 3], [8, 3], [13, 3], [13, 8], [13, 13], [8, 13], [3, 13], [3, 8]],
    relleno: [[3, 4], [8, 4], [13, 4], [5.5, 8], [10.5, 8], [3, 12], [8, 12], [13, 12]],
    matriz: [[3, 3], [3, 8], [3, 13], [8, 3], [13, 3], [13, 8], [13, 13], [8, 8]]
  }[style]
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" className="dot-icon">
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" />)}
    </svg>
  )
}
