import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// مشروع المصادقة (Google Sign-in)
const authConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA3mM7xwWlHzb3U05zPxcvuUvh9sXrDG4E',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'noor-app-42696.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'noor-app-42696',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'noor-app-42696.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '716336237791',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:716336237791:web:4c57f956ec276f9848ad6a',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-36M36YHHSQ',
};

// مشروع قاعدة البيانات (العداد والترتيب)
const dbConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_DB_API_KEY || 'AIzaSyB0kNHpgVF2r5jsfuKTPR2WySmQD919-eY',
  authDomain: import.meta.env.VITE_FIREBASE_DB_AUTH_DOMAIN || 'noooor-1c021.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_DB_PROJECT_ID || 'noooor-1c021',
  storageBucket: import.meta.env.VITE_FIREBASE_DB_STORAGE_BUCKET || 'noooor-1c021.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_DB_MESSAGING_SENDER_ID || '1057114703601',
  appId: import.meta.env.VITE_FIREBASE_DB_APP_ID || '1:1057114703601:web:f0366f0cd765c0b0940b50',
  measurementId: import.meta.env.VITE_FIREBASE_DB_MEASUREMENT_ID || 'G-Q1QNVQYD16',
};

const authApp: FirebaseApp =
  getApps().find((a) => a.name === 'authApp') ?? initializeApp(authConfig, 'authApp');

const dbApp: FirebaseApp =
  getApps().find((a) => a.name === 'dbApp') ?? initializeApp(dbConfig, 'dbApp');

export const auth = getAuth(authApp);
export const db = getFirestore(dbApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

// في الـ production (Vercel) نستخدم redirect لأن popup بيعلق
// في الـ development نستخدم popup عشان أسهل
const isProduction = import.meta.env.PROD;

export async function signInWithGoogle(): Promise<{ uid: string; name: string; email: string; photo: string } | null> {
  if (isProduction) {
    // على Vercel نستخدم redirect دايماً عشان popup بيعلق
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  // في الـ development نستخدم popup
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    uid: user.uid,
    name: user.displayName ?? '',
    email: user.email ?? '',
    photo: user.photoURL ?? '',
  };
}

export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

export async function getGoogleRedirectResult(): Promise<{ uid: string; name: string; email: string; photo: string } | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const user = result.user;
    return {
      uid: user.uid,
      name: user.displayName ?? '',
      email: user.email ?? '',
      photo: user.photoURL ?? '',
    };
  } catch {
    return null;
  }
}

export async function firebaseSignOut() {
  await signOut(auth);
}

export const isConfigured = true;
