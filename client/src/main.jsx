import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import api from './api/client';
import offlineSyncService from './services/offlineSyncService';

// Initialize offline background sync listener
offlineSyncService.initOnlineListener(api);

// Register PWA service worker in production
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
      .catch((err) => console.warn('PWA Service Worker registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
