// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Note: We cannot use import.meta.env here since it is not processed by Vite
// without extra plugins, so we use URL params or just initialize with minimal config
const firebaseConfig = {
  apiKey: "AIzaSyDKlhUHlFGFv8YTASiARLloAriciUCAM-0",
  authDomain: "resilient-ghana-sos.firebaseapp.com",
  projectId: "resilient-ghana-sos",
  storageBucket: "resilient-ghana-sos.firebasestorage.app",
  messagingSenderId: "178179018855",
  appId: "1:178179018855:web:9b61880ec89fad2e6044c2"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Emergency Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New alert received',
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
