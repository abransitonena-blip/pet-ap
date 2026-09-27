import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { GOOGLE_FONTS_URL } from './lib/design'

const fonts = document.createElement('link')
fonts.rel = 'stylesheet'
fonts.href = GOOGLE_FONTS_URL
document.head.appendChild(fonts)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
