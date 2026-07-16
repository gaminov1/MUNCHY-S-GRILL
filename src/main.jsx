import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "./app.jsx";
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The menu still works normally if a browser blocks offline support.
    })
  })
}
