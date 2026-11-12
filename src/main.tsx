import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerServiceWorker } from './lib/registerServiceWorker.ts'

// Auto-recover from Vite dynamic import chunk mismatches after new production deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Chunk preload error detected after new deployment. Auto-reloading for clean assets...')
  event.preventDefault()
  window.location.reload()
})

// Initialize PWA Service Worker
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

