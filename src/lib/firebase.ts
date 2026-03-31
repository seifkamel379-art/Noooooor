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
  apiKey: 'AIzaSyA3mM7xwWlHzb3U05zPxcvuUvh9sXrDG4E',
  authDomain: 'noor-app-42696.firebaseapp.com',
  projectId: 'noor-app-42696',
  storageBucket: 'noor-app-42696.firebasestorage.app',
  messagingSenderId: '716336237791',
  appId: '1:716336237791:web:4c57f956ec276f9848ad6a',
  measurementId: 'G-36M36YHHSQ',
};

// مشروع قاعدة البيانات (العداد والترتيب)
const dbConfig = {
  apiKey: 'AIzaSyB0kNHpgVF2r5jsfuKTPR2WySmQD919-eY',
  authDomain: 'noooor-1c021.firebaseapp.com',
  projectId: 'noooor-1c021',
  storageBucket: 'noooor-1c021.firebasestorage.app',
  messagingSenderId: '1057114703601',
  appId: '1:1057114703601:web:f0366f0cd765c0b0940b50',
  measurementId: 'G-Q1QNVQYD16',
};

const authApp: FirebaseApp =
  getApps().find((a) => a.name === 'authApp') ?? initializeApp(authConfig, 'authApp');

const dbApp: FirebaseApp =
  getApps().find((a) => a.name === 'dbApp') ?? initializeApp(dbConfig, 'dbApp');

export const auth = getAuth(authApp);
export const db = getFirestore(dbApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<{ uid: string; name: string; email: string; photo: string } | null> {
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
