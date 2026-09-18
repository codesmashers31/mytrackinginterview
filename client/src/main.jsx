import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Automatically handle stale bundle chunk errors when a new deployment is pushed
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New app version detected. Reloading page with latest assets...', event);
  window.location.reload();
});

window.addEventListener('error', (event) => {
  if (
    event?.message &&
    (event.message.includes('Failed to fetch dynamically imported module') ||
     event.message.includes('Expected a JavaScript-or-Wasm module script'))
  ) {
    console.warn('Dynamic import chunk outdated. Reloading page...', event);
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

