import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration for SkyLimo
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBN7Y6AcWJFKzy7AU4VfaFUmdfalB_ctWM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sky-limo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sky-limo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sky-limo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "861868157694",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:861868157694:web:ace5e32a6e48cbab0a53af",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SDZXXJPKC0"
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize optional Analytics in browser environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}
