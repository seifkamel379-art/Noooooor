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

const firebaseConfig = {
  apiKey: 'AIzaSyA3mM7xwWlHzb3U05zPxcvuUvh9sXrDG4E',
  authDomain: 'noor-app-42696.firebaseapp.com',
  projectId: 'noor-app-42696',
  storageBucket: 'noor-app-42696.firebasestorage.app',
  messagingSenderId: '716336237791',
  appId: '1:716336237791:web:4c57f956ec276f9848ad6a',
  measurementId: 'G-36M36YHHSQ',
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
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
