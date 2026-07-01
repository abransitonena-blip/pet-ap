import { useState, useEffect } from 'react'
import Map from './components/Map'
import Header from './components/Header'
import WalkerCard from './components/WalkerCard'
import './App.css'

function App() {
  const [walkers, setWalkers] = useState([])
  const [view, setView] = useState('map') // 'map' or 'walkers'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWalkers()
  }, [])

  const fetchWalkers = async () => {
    try {
      const response = await fetch('/api/walkers')
      const data = await response.json()
      setWalkers(data)
    } catch (error) {
      console.log('Demo mode - usando datos de prueba')
      setWalkers([
        { id: 1, name: 'Carlos', rating: 4.9, price: 80, dogs: 3, image: '🐕', zone: 'Centro' },
        { id: 2, name: 'María', rating: 4.8, price: 75, dogs: 4, image: '🐩', zone: 'Norte' },
        { id: 3, name: 'Juan', rating: 5.0, price: 90, dogs: 2, image: '🦮', zone: 'Sur' },
        { id: 4, name: 'Laura', rating: 4.7, price: 70, dogs: 5, image: '🐕‍🦺', zone: 'Oriente' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <Header setView={setView} view={view} />
      <main className="main-content">
        {view === 'map' && <Map walkers={walkers} />}
        {view === 'walkers' && (
          <div className="walkers-grid">
            {loading ? (
              <div className="loading">Cargando paseadores... 🐕</div>
            ) : (
              walkers.map(walker => (
                <WalkerCard key={walker.id} walker={walker} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
