// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDKlhUHlFGFv8YTASiARLloAriciUCAM-0",
  authDomain: "resilient-ghana-sos.firebaseapp.com",
  projectId: "resilient-ghana-sos",
  storageBucket: "resilient-ghana-sos.firebasestorage.app",
  messagingSenderId: "178179018855",
  appId: "1:178179018855:web:9b61880ec89fad2e6044c2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ── Background push notification handler ──────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const title = payload.notification?.title || '🚨 SOS EMERGENCY — Resilient Ghana';
  const body = payload.notification?.body || 'A user has triggered a distress beacon. Tap to view their location on the map.';

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    requireInteraction: true,
    renotify: true,
    tag: 'sos-alert',
    silent: false,
    data: {
      url: '/map',
      ...payload.data
    },
    actions: [
      { action: 'view-map', title: '🗺️ View on Map' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(title, options);
});

// ── Notification click: open the map page ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/map';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if possible
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
