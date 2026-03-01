import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
// Check if it's a real-looking Firebase API key (usually starts with AIza and is ~39 chars long)
export const isFirebaseConfigured = Boolean(
  apiKey && 
  apiKey !== 'dummy-api-key' && 
  apiKey.length > 20 && 
  apiKey.startsWith('AIza')
);

const firebaseConfig = {
  apiKey: apiKey || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

// Initialize conditionally to prevent errors when keys are missing
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null as any;
export const auth = isFirebaseConfigured ? getAuth(app) : null as any;
export const db = isFirebaseConfigured ? getFirestore(app) : null as any;
export const storage = isFirebaseConfigured ? getStorage(app) : null as any;
