// @ts-nocheck
// firebase-messaging-sw.js

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyB6lrVJDDhFInB_GiwXwrWVCUIk3O_tuvk",
  authDomain: "xpilot-inventa.firebaseapp.com",
  projectId: "xpilot-inventa",
  storageBucket: "xpilot-inventa.firebasestorage.app",
  messagingSenderId: "264100874784",
  appId: "1:264100874784:web:4d60a1d600c8a3f4fdca45",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationBody =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new message";

  const notificationOptions = {
    body: notificationBody,
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: "shop-request",
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      {
        action: "view",
        title: "View Request",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/shop/orders/request"));
  } else {
    event.waitUntil(clients.openWindow("/shop/orders/request"));
  }
});
