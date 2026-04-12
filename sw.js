// sw.js - Service Worker Básico
const CACHE_NAME = 'afa-torneo-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Estrategia de respuesta: Primero red, si falla, caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});