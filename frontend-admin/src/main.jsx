import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    import('workbox-window').then(({ Workbox }) => {
      const wb = new Workbox('/sw.js')
      
      wb.addEventListener('waiting', (event) => {
        console.log('New service worker is waiting to activate')
        // Optionally show update notification to user
        if (confirm('New version available! Click OK to update and reload.')) {
          wb.messageSkipWaiting()
          window.location.reload()
        }
      })
      
      wb.addEventListener('controlling', () => {
        console.log('New service worker is now controlling the page')
        window.location.reload()
      })
      
      wb.register()
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
