import { useEffect, useState } from 'react'
import Editor from './pages/Editor'
import LedEditor from './pages/LedEditor'
import Admin from './pages/Admin'
import Track from './pages/Track'

// Router mínimo por hash: #/ (letrero LED), #/impreso, #/seguimiento/<folio>, #/admin
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

export default function App() {
  const route = useHashRoute()
  if (route.startsWith('/admin')) return <Admin />
  if (route.startsWith('/seguimiento')) return <Track key={route} initialFolio={route.split('/')[2] || ''} />
  if (route.startsWith('/impreso')) return <Editor />
  return <LedEditor />
}
