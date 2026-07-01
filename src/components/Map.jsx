import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import './Map.css'

// Coordenadas del centro de Cuautitlán Izcalli
const CUAUTITLAN_CENTER = [25.7699, -99.2432]

const createCustomIcon = (emoji) => {
  return L.divIcon({
    html: `<div class="custom-marker">${emoji}</div>`,
    className: 'custom-icon',
    iconSize: [40, 40],
    popupAnchor: [0, -20]
  })
}

function Map({ walkers }) {
  return (
    <div className="map-container">
      <MapContainer center={CUAUTITLAN_CENTER} zoom={13} className="leaflet-map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {walkers.map(walker => (
          <Marker
            key={walker.id}
            position={[
              CUAUTITLAN_CENTER[0] + (Math.random() - 0.5) * 0.05,
              CUAUTITLAN_CENTER[1] + (Math.random() - 0.5) * 0.05
            ]}
            icon={createCustomIcon(walker.image)}
          >
            <Popup>
              <div className="popup-content">
                <h3>{walker.name}</h3>
                <p>⭐ {walker.rating} · {walker.zone}</p>
                <p>💰 ${walker.price} · 🐕 {walker.dogs} perros</p>
                <button className="reserve-btn">Reservar</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default Map
