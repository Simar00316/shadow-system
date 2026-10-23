import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

/**
 * Preload the Awakening entry chunk (and its imports) from index.html: on a new device it is the first screen, and
 * without the hint the browser only discovers it after the main chunk runs (one extra network round trip).
 */
function preloadFirstScreen(): Plugin {
  return {
    name: 'preload-first-screen',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle ?? {}
        const gate = Object.values(bundle).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('src/screens/awakening/Gate.tsx'))
        if (!gate || gate.type !== 'chunk') return html
        const files = [gate.fileName, ...gate.imports].filter((f) => !html.includes(f))
        return { html, tags: files.map((f) => ({ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: '', href: `/${f}` }, injectTo: 'head' as const })) }
      },
    },
  }
}

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    preloadFirstScreen(),
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
        id: '/',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // App shell + sounds. Exercise media (58 MB) and the ambient loop are runtime-cached instead (R6 §1.6).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'sfx/*.wav', 'icons/*', 'img/*.webp', 'assets/exercises-*.json'],
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
    // Integration tests (awaken + workouts on fake IndexedDB) can exceed 5 s when the whole suite runs in parallel.
    testTimeout: 20_000,
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}', 'data/**/*.test.ts', 'worker/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'data/.cache/**', 'research/**'],
    coverage: { include: ['src/engine/**'], thresholds: { lines: 90 } },
  },
})
