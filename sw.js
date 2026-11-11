// Service Worker — نظام إدخال البيانات
// يخزّن صفحة الموقع والأيقونات عشان يفتح من أيقونة الجهاز بسرعة ويشتغل من غير نت لعرض السجلات
const CACHE = 'exc-system-v1';
const CORE = ['./', './index.html', './icon.svg', './icon-192.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // ملفات الموقع نفسه
  if (url.origin === location.origin) {
    // الصفحة الرئيسية: نت أولاً عشان التحديثات توصل، ولو مفيش نت من الكاش
    if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
      e.respondWith(
        fetch(e.request)
          .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; })
          .catch(() => caches.match(e.request))
      );
      return;
    }
    // باقي الملفات: كاش أولاً
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
    return;
  }

  // مكتبات خارجية (خطوط + Chart.js + XLSX): كاش أول تحميل
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
        return r;
      });
    })
  );
});
