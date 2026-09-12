import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the app from a subpath (/badminton-manager/).
// Capacitor loads from file:// and needs relative paths, so the base is
// driven by an env var that only the Pages workflow sets.
const base = process.env.BASE_PATH || './'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // scope/start_url must match the deploy subpath
      scope: base,
      base,
      manifest: {
        name: 'Badminton Pairs',
        short_name: 'Pairs',
        description: 'Generate balanced doubles pairs for badminton sessions',
        theme_color: '#0d9488',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
