/* eslint-env serviceworker */

/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

self.skipWaiting()
clientsClaim()

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

// Non-SSR fallbacks to index.html
// Production SSR fallbacks to offline.html (except for dev)
if (process.env.MODE !== 'ssr' || process.env.PROD) {
  registerRoute(
    new NavigationRoute(
      createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML),
      { denylist: [new RegExp(process.env.PWA_SERVICE_WORKER_REGEX), /workbox-(.)*\.js$/] }
    )
  )
}

// Estrategia para API de Supabase
registerRoute(
  ({ url }) => url.origin === 'https://cyuyiinvnomyyrmhsmqo.supabase.co',
  new NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 horas
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// Estrategia para imágenes
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
      })
    ]
  })
)

// Estrategia para JS y CSS
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 días
      })
    ]
  })
)

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/#/commitments')
  )
})
