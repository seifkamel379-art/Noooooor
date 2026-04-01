import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyA3mM7xwWlHzb3U05zPxcvuUvh9sXrDG4E',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'noor-app-42696.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'noor-app-42696',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'noor-app-42696.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '716336237791',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:716336237791:web:4c57f956ec276f9848ad6a',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-36M36YHHSQ',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // تفعيل الكاش المحلي — يعرض البيانات فوراً من الجهاز حتى لو الإنترنت بطيء
  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // fallback لو الـ IndexedDB مش متاح (Private mode مثلاً)
  }
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db   = getFirestore(app);

/* ─── Sign Out ───────────────────────────────────────────── */
export async function firebaseSignOut(): Promise<void> {
  try { await signOut(auth); } catch { /* ignore */ }
  localStorage.removeItem('user_profile');
}

export const isConfigured = true;
