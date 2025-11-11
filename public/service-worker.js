// This service worker is intentionally left minimal.
// Its purpose is to make the web app installable (PWA).
// It does not provide offline caching capabilities.

self.addEventListener('install', (event) => {
  // The install event is required for a PWA but we don't need to cache anything.
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // The activate event is useful for managing caches, but since we are not caching,
  // we just log that it's active.
  console.log('Service Worker: Activating...');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // An empty fetch handler is sufficient for a PWA to be installable.
  // We are not intercepting network requests, so they will pass through as normal.
  // This means the app will function as an online-only application.
});
