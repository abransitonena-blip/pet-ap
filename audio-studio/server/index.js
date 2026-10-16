import express from 'express'
import cors from 'cors'
import audioRoutes from './audio.js'

const app = express()
const PORT = process.env.PORT || 5001

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(audioRoutes)

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`🎬 Audio Studio server on http://localhost:${PORT}`)
})
