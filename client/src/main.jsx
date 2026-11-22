import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import api from './api/client';
import offlineSyncService from './services/offlineSyncService';

// Automatically handle Vite dynamic import / chunk load errors across deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('New deployment detected (chunk mismatch). Reloading to fetch latest version...', event);
  window.location.reload();
});

// Initialize offline background sync listener
offlineSyncService.initOnlineListener(api);

// Register PWA service worker in production with automatic update check
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered:', reg.scope);
        reg.update().catch(() => {});
      })
      .catch((err) => console.warn('PWA Service Worker registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
