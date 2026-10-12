import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if a real, non-placeholder Firebase API key is provided
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  typeof rawApiKey === 'string' &&
  rawApiKey.trim().length > 10 &&
  rawApiKey !== 'your_firebase_api_key' &&
  !rawApiKey.includes('undefined')
);

let app = null;
let auth = null;
let db = null;
let messaging = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    try {
      messaging = getMessaging(app);
    } catch (msgErr) {
      console.warn("Firebase Messaging is not supported in this environment.", msgErr);
    }
  } catch (error) {
    console.warn("Firebase initialization failed; running in offline/local mode:", error);
    app = null;
    auth = null;
    db = null;
    messaging = null;
  }
} else {
  console.info("Firebase API key not detected or placeholder. Running in Local/Offline Mode.");
}

export { app, auth, db, messaging };
export default app;
