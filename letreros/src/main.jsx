import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { fontsCssReady } from './lib/fonts'
import { captureCampaign } from './lib/campaign'

fontsCssReady()
captureCampaign()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
