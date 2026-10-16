import './Header.css'

function Header({ setView, view }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>🐕 PetAp Cuautitlán</h1>
          <p>Paseadores confiables en tu zona</p>
        </div>
        <nav className="nav">
          <button
            className={`nav-btn ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            🗺️ Mapa
          </button>
          <button
            className={`nav-btn ${view === 'walkers' ? 'active' : ''}`}
            onClick={() => setView('walkers')}
          >
            👥 Paseadores
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
