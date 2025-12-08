// public/sw.js or wherever your service worker is
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip Cloudinary image requests - let them go through normally
  if (url.hostname.includes('cloudinary.com')) {
    return; // Let the browser handle these requests
  }

  // Skip API requests
  if (url.hostname.includes('carte-fastapi.vercel.app')) {
    return;
  }

  // For other requests, use network-only strategy
  event.respondWith(fetch(event.request));
});