const CACHE_NAME = 'madrasti-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Notification sound utility functions
function playNotificationSound() {
  try {
    // Send message to all open tabs to play sound
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_NOTIFICATION_SOUND',
          payload: { soundType: 'normal' }
        });
      });
    });
  } catch (error) {
    console.warn('Could not trigger notification sound:', error);
  }
}

function playImportantNotificationSound() {
  try {
    // Send message to all open tabs to play important sound
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_NOTIFICATION_SOUND',
          payload: { soundType: 'important' }
        });
      });
    });
  } catch (error) {
    console.warn('Could not trigger important notification sound:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'مدرستي',
    body: 'إعلان جديد متاح',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    dir: 'rtl',
    lang: 'ar',
    tag: 'general',
    requireInteraction: false,
    data: {
      url: '/'
    }
  };

  // Parse notification data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (error) {
      // Fallback to text data
      notificationData.body = event.data.text();
    }
  }

  // Play notification sound based on type
  const isImportantNotification = notificationData.type === 'course_created' || 
                                  notificationData.requireInteraction;
  
  if (isImportantNotification) {
    playImportantNotificationSound();
  } else {
    playNotificationSound();
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      dir: notificationData.dir,
      lang: notificationData.lang,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Get the URL to open
  let urlToOpen = '/';
  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find existing window
      for (let client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
