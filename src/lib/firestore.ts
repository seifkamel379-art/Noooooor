import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

/* ─── Types ─────────────────────────────────────────────── */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  governorate?: string | null;
  isPublic: boolean;
  tasbeehCount: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
  noorScore: number;
  earnedBadges: string[];
}

export interface SohbaUserData {
  userId: string;
  displayName: string;
  governorate?: string | null;
  isPublic: boolean;
  tasbeehCount: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
  earnedBadges: string[];
}

/* ─── Global Counter ─────────────────────────────────────── */
const COUNTER_DOC = doc(db, 'globalCounter', 'main');

export async function initCounter(): Promise<number> {
  const snap = await getDoc(COUNTER_DOC);
  if (!snap.exists()) {
    await setDoc(COUNTER_DOC, { totalCount: 0, updatedAt: serverTimestamp() });
    return 0;
  }
  return (snap.data().totalCount as number) || 0;
}

export async function incrementGlobalCounter(amount = 1): Promise<void> {
  try {
    await updateDoc(COUNTER_DOC, {
      totalCount: increment(amount),
      updatedAt: serverTimestamp(),
    });
  } catch {
    await setDoc(COUNTER_DOC, { totalCount: amount, updatedAt: serverTimestamp() }, { merge: true });
  }
}

export function subscribeToGlobalCounter(
  callback: (data: { count: number }) => void,
): Unsubscribe {
  return onSnapshot(COUNTER_DOC, (snap) => {
    if (snap.exists()) {
      callback({ count: (snap.data().totalCount as number) || 0 });
    } else {
      callback({ count: 0 });
    }
  });
}

/* ─── Active Sessions (presence) ────────────────────────── */
const SESSIONS_COL = collection(db, 'activeSessions');
const SESSION_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function registerSession(sid: string): Promise<void> {
  await setDoc(doc(db, 'activeSessions', sid), {
    lastSeen: serverTimestamp(),
  });
}

export async function refreshSession(sid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'activeSessions', sid), {
      lastSeen: serverTimestamp(),
    });
  } catch {
    await registerSession(sid);
  }
}

export async function unregisterSession(sid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'activeSessions', sid));
  } catch { /* ignore */ }
}

export function subscribeToActiveSessions(
  callback: (count: number) => void,
): Unsubscribe {
  return onSnapshot(SESSIONS_COL, (snap) => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    let count = 0;
    snap.forEach((d) => {
      const ts = d.data().lastSeen as Timestamp | null;
      if (ts && ts.toMillis() > cutoff) count++;
    });
    callback(count);
  });
}

/* ─── Sohba / Leaderboard ───────────────────────────────── */
export async function syncUserLeaderboard(data: SohbaUserData): Promise<number> {
  const noorScore =
    Math.floor(data.tasbeehCount * 0.5) +
    data.quranCompletions * 1000 +
    data.azkarStreak * 50 +
    data.tadabburStreak * 20;

  await setDoc(
    doc(db, 'sohbaLeaderboard', data.userId),
    { ...data, noorScore, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return noorScore;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'sohbaLeaderboard'),
    where('isPublic', '==', true),
    orderBy('noorScore', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LeaderboardEntry);
}

export async function fetchUserEntry(userId: string): Promise<LeaderboardEntry | null> {
  const snap = await getDoc(doc(db, 'sohbaLeaderboard', userId));
  return snap.exists() ? (snap.data() as LeaderboardEntry) : null;
}
