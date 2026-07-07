// Bu dosya, uygulamanın dosyalarını telefonda önbelleğe alır.
// Böylece internet olmasa bile (uçakta, metroda, çekmeyen yerde) uygulama açılır.
// Kayıtlı antrenman VERİLERİ zaten localStorage'da tutuluyor, bu dosyanın işi
// sadece HTML/CSS/JS "kabuğunu" önbelleğe almak.

const CACHE_NAME = 'antrenman-cache-v3';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strateji: önce ağdan dene (güncel sürüm), olmazsa önbellekten ver.
// Böylece internet varken hep en güncel halini alırsın, yokken de eski hali açılır.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
