const CACHE_NAME = 'sufyan-admin-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Bildirim alma ve gösterme yeteneği
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Yeni Sipariş!';
  const options = {
    body: data.body || 'Bir sipariş oluşturuldu.',
    icon: 'https://cdn.myikas.com/images/theme-images/97987e86-d147-4b63-a081-34e07894d6f5/image_180.webp',
    badge: 'https://cdn.myikas.com/images/theme-images/97987e86-d147-4b63-a081-34e07894d6f5/image_180.webp',
    data: { url: '/orders?filter=new' },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Bildirime tıklandığında uygulamayı açma
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/orders') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/orders?filter=new');
      }
    })
  );
});
