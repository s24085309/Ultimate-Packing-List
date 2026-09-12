import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.GH_PAGES ? '/Ultimate-Packing-List/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: '🧽 Spongie — Ultimate Packing List',
        short_name: '🧽 Spongie',
        description: 'Trips, a master packing library, and PDF/Word/Excel/HTML export.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0c0716',
        theme_color: '#0c0716',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Without this, an outdated precache from a previous version can
        // stick around after an update, and installed home-screen PWAs
        // are the most likely to keep serving it since they don't get the
        // browser's normal "hard refresh" gesture to shake it loose.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
