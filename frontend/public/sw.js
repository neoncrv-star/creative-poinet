const CACHE_NAME = 'cp-site-v1';

const PRECACHE_URLS = [
  '/',
  '/en',
  '/portfolio',
  '/en/portfolio',
  '/blog',
  '/js/main.js',
  '/js/hero-animation.js',
  '/js/gsap-safe.js',
  '/js/menu.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // تفعيل فوري للنسخة الجديدة
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        })
      )
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRELOAD_ROUTES') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // 🛑 [الحل الجذري للخطأ الأحمر]: تجاهل أي طلب ليس GET (مثل POST لرفع الصور أو حفظ البيانات)
  if (req.method !== 'GET') {
    return; 
  }

  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  if (
    url.origin === location.origin &&
    (url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.startsWith('/uploads/'))
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return response;
        });
      })
    );
  }
});