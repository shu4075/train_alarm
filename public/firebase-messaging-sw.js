importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCkU9SRi_-qEinViY7Rj-vcKURS1R3-rQM",
  authDomain: "train-alarm-6ae0f.firebaseapp.com",
  projectId: "train-alarm-6ae0f",
  storageBucket: "train-alarm-6ae0f.firebasestorage.app",
  messagingSenderId: "166683709401",
  appId: "1:166683709401:web:d8109cdbbf92e44bca13c8",
  measurementId: "G-YSYDG6VX4B"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/next.svg',
    badge: '/next.svg',
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
