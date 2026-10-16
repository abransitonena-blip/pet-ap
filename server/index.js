import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Mock data
const walkers = [
  {
    id: 1,
    name: 'Carlos',
    rating: 4.9,
    price: 80,
    dogs: 3,
    image: '🐕',
    zone: 'Centro',
    experience: '5 años'
  },
  {
    id: 2,
    name: 'María',
    rating: 4.8,
    price: 75,
    dogs: 4,
    image: '🐩',
    zone: 'Norte',
    experience: '3 años'
  },
  {
    id: 3,
    name: 'Juan',
    rating: 5.0,
    price: 90,
    dogs: 2,
    image: '🦮',
    zone: 'Sur',
    experience: '7 años'
  },
  {
    id: 4,
    name: 'Laura',
    rating: 4.7,
    price: 70,
    dogs: 5,
    image: '🐕‍🦺',
    zone: 'Oriente',
    experience: '4 años'
  }
]

// Rutas
app.get('/walkers', (req, res) => {
  res.json(walkers)
})

app.get('/walkers/:id', (req, res) => {
  const walker = walkers.find(w => w.id === parseInt(req.params.id))
  if (!walker) return res.status(404).json({ error: 'Walker not found' })
  res.json(walker)
})

app.post('/bookings', (req, res) => {
  const { walkerId, date, duration } = req.body
  res.json({
    success: true,
    message: 'Booking created successfully',
    bookingId: Math.random().toString(36).substr(2, 9)
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running! 🚀' })
})

app.listen(PORT, () => {
  console.log(`🐕 Server running on http://localhost:${PORT}`)
})
