import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB0kNHpgVF2r5jsfuKTPR2WySmQD919-eY',
  authDomain: 'noooor-1c021.firebaseapp.com',
  projectId: 'noooor-1c021',
  storageBucket: 'noooor-1c021.firebasestorage.app',
  messagingSenderId: '1057114703601',
  appId: '1:1057114703601:web:f0366f0cd765c0b0940b50',
  measurementId: 'G-Q1QNVQYD16',
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

export async function signInWithGoogle(): Promise<{ name: string; email: string; photo: string } | null> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  return {
    name: user.displayName ?? '',
    email: user.email ?? '',
    photo: user.photoURL ?? '',
  };
}

export async function firebaseSignOut() {
  await signOut(auth);
}

export const isConfigured = true;
