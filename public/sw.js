self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'TrainAlarm';
  const options = {
    body: data.body || 'Wake up!',
    icon: '/next.svg',
    badge: '/next.svg',
    vibrate: [200, 100, 200],
    data: data.data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Basic fetch handler for PWA compatibility
self.addEventListener('fetch', function(event) {
  // Empty fetch handler is enough for "Add to Home Screen" to work in some browsers
});
