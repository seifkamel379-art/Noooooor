import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyDOVE54x_j5fldKYwTRAG9QzdRok_pD074',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'noooooor-app.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'noooooor-app',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'noooooor-app.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '230599694330',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:230599694330:web:8780636368d1469591f643',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     || 'G-P96TYMPZQF',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // كاش محلي — يعرض البيانات فوراً من الجهاز حتى لو الإنترنت بطيء
  try {
    initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // fallback لو IndexedDB مش متاح (Private mode)
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
