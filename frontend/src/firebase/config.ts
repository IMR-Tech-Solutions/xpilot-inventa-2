import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDVXsu8A24dAGlql68KxEgiRBj-eQlIWs4",
  authDomain: "xpilot-imr.firebaseapp.com",
  projectId: "xpilot-imr",
  storageBucket: "xpilot-imr.firebasestorage.app",
  messagingSenderId: "416424168697",
  appId: "1:416424168697:web:57885c0cb6afd95f94a628",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const VAPID_KEY =
  "BGNVkbNSnOPHG6mGCj3Q3gnWJrl7wKPPpMdHY97nZRDMnsirbsO7sWrYb36dplTz2TMc3zMjtxQ9QtTbGaS6qkQ";
