import './WalkerCard.css'

function WalkerCard({ walker }) {
  const handleBook = () => {
    alert(`¡Solicitaste a ${walker.name}! Pronto será procesado. 🎉`)
  }

  return (
    <div className="walker-card">
      <div className="walker-header">
        <div className="walker-avatar">{walker.image}</div>
        <div className="walker-info">
          <h3>{walker.name}</h3>
          <div className="rating">
            <span className="stars">⭐ {walker.rating}</span>
            <span className="zone">{walker.zone}</span>
          </div>
        </div>
      </div>
      
      <div className="walker-stats">
        <div className="stat">
          <span className="stat-label">Perros</span>
          <span className="stat-value">{walker.dogs}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Precio</span>
          <span className="stat-value">${walker.price}</span>
        </div>
      </div>

      <button className="book-btn" onClick={handleBook}>
        Reservar Paseo
      </button>
    </div>
  )
}

export default WalkerCard
