import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.png',
        'apple-touch-icon.png',
        'apple-touch-icon-180x180.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'logo.svg',
      ],
      manifest: {
        name: 'Orbit',
        short_name: 'Orbit',
        description: 'Your personal life tools suite & intelligent expense tracker',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#10b981',
        background_color: '#09090b',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
        shortcuts: [
          {
            name: 'Add expense',
            short_name: 'Add Expense',
            description: 'Log a new expense outflow against your accounts',
            url: '/tools/expense-tracker?action=add-expense',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Add income',
            short_name: 'Add Income',
            description: 'Record an income deposit',
            url: '/tools/expense-tracker?action=add-income',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Cash in hand',
            short_name: 'Cash in Hand',
            description: 'Access physical cash balance and ATM transactions',
            url: '/tools/expense-tracker/cash',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\/.*/, /^\/sw\.js$/, /^\/manifest\.webmanifest$/, /\.[a-zA-Z0-9]+$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // 1. Google Fonts Webfonts (CacheFirst, long expiration)
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'orbit-google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. Static Images & Icons
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'orbit-static-media',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 3. Safe API GET Endpoints (NetworkFirst with 3s timeout for offline view)
          // Explicitly strictly handles GET and explicitly excludes /api/auth, /api/expenses/export, /api/receipts
          {
            urlPattern: ({ url, request }) => {
              const pathname = url.pathname;
              const isGet = request.method === 'GET';
              if (!isGet) return false;

              // Strictly exclude sensitive auth, export downloads, and uploads
              if (
                pathname.startsWith('/api/auth') ||
                pathname.includes('/export') ||
                pathname.includes('/receipts')
              ) {
                return false;
              }

              // Match safe GET read endpoints
              return (
                pathname.startsWith('/api/accounts') ||
                pathname.startsWith('/api/cash') ||
                pathname.startsWith('/api/dashboard') ||
                pathname.startsWith('/api/expenses') ||
                pathname.startsWith('/api/transfers') ||
                pathname.startsWith('/api/budgets') ||
                pathname.startsWith('/api/categories') ||
                pathname.startsWith('/api/recurring') ||
                pathname.startsWith('/api/goals')
              );
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'orbit-api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
