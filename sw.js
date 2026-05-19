const CACHE = 'kho-trich-dan-v1';
const FILES = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Nhận lệnh từ app để lên lịch thông báo
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIF') {
    scheduleDaily(e.data.time, e.data.quote, e.data.source);
  }
  if (e.data && e.data.type === 'CANCEL_NOTIF') {
    if (self._notifTimer) clearTimeout(self._notifTimer);
  }
});

function scheduleDaily(timeStr, quoteText, quoteSource) {
  if (self._notifTimer) clearTimeout(self._notifTimer);
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const delay = target - now;
  self._notifTimer = setTimeout(() => {
    self.registration.showNotification('📖 Trích dẫn hôm nay', {
      body: quoteText + (quoteSource ? '\n— ' + quoteSource : ''),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'daily-quote',
      renotify: true
    });
    // Tự động lên lịch ngày hôm sau
    scheduleDaily(timeStr, quoteText, quoteSource);
  }, delay);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
