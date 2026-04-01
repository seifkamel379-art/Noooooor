import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyA3mM7xwWlHzb3U05zPxcvuUvh9sXrDG4E',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'noor-app-42696.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'noor-app-42696',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'noor-app-42696.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '716336237791',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:716336237791:web:4c57f956ec276f9848ad6a',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID    || 'G-36M36YHHSQ',
};

const app: FirebaseApp =
  getApps().find((a) => a.name === '[DEFAULT]') ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

/* ─── Google Sign-In ─────────────────────────────────────── */
export interface GoogleUser {
  uid:   string;
  name:  string;
  email: string;
  photo: string;
}

export async function signInWithGoogle(): Promise<GoogleUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  const u: User = result.user;
  return {
    uid:   u.uid,
    name:  u.displayName || '',
    email: u.email       || '',
    photo: u.photoURL    || '',
  };
}

/* ─── Sign Out ───────────────────────────────────────────── */
export async function firebaseSignOut(): Promise<void> {
  try { await signOut(auth); } catch { /* ignore */ }
  localStorage.removeItem('user_profile');
}

export const isConfigured = true;
