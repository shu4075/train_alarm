import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCkU9SRi_-qEinViY7Rj-vcKURS1R3-rQM",
  authDomain: "train-alarm-6ae0f.firebaseapp.com",
  projectId: "train-alarm-6ae0f",
  storageBucket: "train-alarm-6ae0f.firebasestorage.app",
  messagingSenderId: "166683709401",
  appId: "1:166683709401:web:d8109cdbbf92e44bca13c8",
  measurementId: "G-YSYDG6VX4B"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const requestForToken = async () => {
  try {
    if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging, {
        vapidKey: "BISzefV0yam6m-Wae68SPJ2uo8z8Us3LMEFpqc8_AFyTkNjBTGeoY_C7tZVkW7axWDfQbcKKX7QSiCgC92AYexQ",
        serviceWorkerRegistration: registration
      });
      if (currentToken) {
        console.log('current token for client: ', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }
  return null;
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (typeof window !== "undefined") {
    const messaging = getMessaging(app);
    return onMessage(messaging, callback);
  }
  return () => {}; // return a no-op function for unsubscribe
};

export default app;
