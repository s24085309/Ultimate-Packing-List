import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.GH_PAGES ? '/Ultimate-Packing-List/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ultimate Packing List',
        short_name: 'Packing List',
        description: 'Trips, a master packing library, and PDF/Word/Excel/HTML export.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0c0716',
        theme_color: '#0c0716',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
