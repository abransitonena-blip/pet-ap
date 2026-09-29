import { Suspense, lazy, useEffect, useState } from 'react'
import LedEditor from './pages/LedEditor'

// Cada sección se descarga solo cuando se abre: el configurador no carga el panel de administración
const Admin = lazy(() => import('./pages/Admin'))
const Editor = lazy(() => import('./pages/Editor'))
const Track = lazy(() => import('./pages/Track'))
const QuotePage = lazy(() => import('./pages/QuotePage'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Account = lazy(() => import('./pages/Account'))

// Router mínimo por hash: #/ (letrero LED), #/impreso, #/seguimiento/<folio>, #/presupuesto/<folio>/<token>,
// #/cuenta (y #/cuenta/restablecer/<token>), #/privacidad, #/admin
function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

function Page({ route }) {
  if (route.startsWith('/admin')) return <Admin />
  if (route.startsWith('/seguimiento')) return <Track key={route} initialFolio={route.split('/')[2] || ''} />
  if (route.startsWith('/presupuesto/')) {
    const [, , folio, token] = route.split('/')
    return <QuotePage key={route} folio={folio} token={token || ''} />
  }
  if (route.startsWith('/impreso')) return <Editor />
  if (route.startsWith('/privacidad')) return <Privacy />
  if (route.startsWith('/cuenta/restablecer/')) return <Account key={route} resetToken={route.split('/')[3] || ''} />
  if (route.startsWith('/cuenta')) return <Account />
  return <LedEditor />
}

export default function App() {
  const route = useHashRoute()
  return (
    <Suspense fallback={<p className="muted center page-loading">Cargando…</p>}>
      <Page route={route} />
    </Suspense>
  )
}
