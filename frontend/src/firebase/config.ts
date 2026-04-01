import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyB6lrVJDDhFInB_GiwXwrWVCUIk3O_tuvk",
  authDomain: "xpilot-inventa.firebaseapp.com",
  projectId: "xpilot-inventa",
  storageBucket: "xpilot-inventa.firebasestorage.app",
  messagingSenderId: "264100874784",
  appId: "1:264100874784:web:4d60a1d600c8a3f4fdca45",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const VAPID_KEY =
  "BEQQwoKVXjg8PAHv0vT0JZdax25j1HDsrn9O-jzwrDTjifc9d5Yu8kV3ZomG7VymghxyOU4Lz8PTN3Zg1zNMtik";
