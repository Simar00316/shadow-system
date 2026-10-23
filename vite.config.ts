import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Shadow System',
        short_name: 'Shadow',
        description: 'A Solo Leveling-style fitness RPG.',
        theme_color: '#05070F',
        background_color: '#05070F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // App shell + sounds. Exercise media (58 MB) and the ambient loop are runtime-cached instead (R6 §1.6).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'sfx/*.wav', 'icons/*'],
        globIgnores: ['assets/third-party/**', 'sfx/ambient.wav'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}', 'data/**/*.test.ts', 'worker/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'data/.cache/**', 'research/**'],
    coverage: { include: ['src/engine/**'], thresholds: { lines: 90 } },
  },
})
