/// <reference lib="webworker" />
// Service worker (Workbox injectManifest, research/platform.md §2): precache the app shell and sounds,
// runtime-cache exercise media CacheFirst, serve the SPA offline. Push handling is in ./sw-push.ts.
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { RangeRequestsPlugin } from 'workbox-range-requests'
import { registerPush } from './sw-push'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Offline SPA: every navigation gets the cached index.html.
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')))

// Exercise animations and frames: fetched on first view, then served offline forever.
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/third-party/exercises/'),
  new CacheFirst({
    cacheName: 'ex-media-v1',
    // Offline and never viewed: show the System icon instead of a broken image.
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), { handlerDidError: async () => (await matchPrecache('/icons/icon.svg')) ?? Response.error() }],
  }),
)

// Sounds (ambient loop is large and optional), MediaPipe model + wasm, barcode wasm.
registerRoute(
  ({ url }) => url.pathname.startsWith('/sfx/') || url.pathname.startsWith('/models/') || url.pathname.startsWith('/wasm/'),
  new CacheFirst({ cacheName: 'static-v1', plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new RangeRequestsPlugin()] }),
)

// Open Food Facts lookups: show the last known answer when offline.
registerRoute(({ url }) => url.hostname.endsWith('openfoodfacts.org'), new StaleWhileRevalidate({ cacheName: 'off-v1' }))

self.addEventListener('message', (e) => { if (e.data?.type === 'SKIP_WAITING') void self.skipWaiting() })

registerPush(self)
