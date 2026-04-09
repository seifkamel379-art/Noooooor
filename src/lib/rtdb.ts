/**
 * rtdb.ts — Firebase Realtime Database Sync Engine
 *
 * المسار في الداتابيز: users/{uid}/
 * الاستراتيجية:
 *   - ترحيل: أول دخول → رفع localStorage → RTDB (لو RTDB فاضي)
 *   - تحميل: أول دخول → جلب RTDB → تحديث localStorage (الأحدث يكسب)
 *   - مزامنة: كل تغيير يتحط في قائمة انتظار، ويُرسل كل 10 ثواني
 *   - إلزامي: عند إخفاء الصفحة (Tab switch / close) → إرسال فوري
 */

import {
  ref,
  get,
  update,
  child,
} from 'firebase/database';
import { rtdb } from './firebase';

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */

function userRef(uid: string) {
  return ref(rtdb, `users/${uid}`);
}

/** اليوم بصيغة YYYY-MM-DD */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** اجمع كل بيانات localStorage المهمة في object واحد */
function collectLocalData(): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // تسبيح - المجاميع والعدادات الحالية
  try {
    const raw = localStorage.getItem('tasbih_totals');
    if (raw) data['tasbih_totals'] = JSON.parse(raw);
  } catch { /* ignore */ }

  try {
    const raw = localStorage.getItem('tasbih_counts');
    if (raw) data['tasbih_counts'] = JSON.parse(raw);
  } catch { /* ignore */ }

  const typeIdx = localStorage.getItem('tasbih_type_idx');
  if (typeIdx !== null) data['tasbih_type_idx'] = Number(typeIdx);

  // التسبيح اليومي (آخر 7 أيام)
  const dailyTasbih: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const val = localStorage.getItem(`tasbih_daily_${dk}`);
    if (val) dailyTasbih[dk] = Number(val);
  }
  if (Object.keys(dailyTasbih).length) data['tasbih_daily'] = dailyTasbih;

  // المتتبع اليومي — الصلوات والورد القرآني (آخر 4 أيام)
  const dailyTracker: Record<string, unknown> = {};
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const val = localStorage.getItem(`daily_tracker_${dk}`);
    if (val) { try { dailyTracker[dk] = JSON.parse(val); } catch { /* ignore */ } }
  }
  if (Object.keys(dailyTracker).length) data['daily_tracker'] = dailyTracker;

  // أذكار حصن المسلم (اليوم وآخر 3 أيام)
  const azkarData: Record<string, Record<string, Record<number, number>>> = {};
  for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // ابحث عن كل مفاتيح الأذكار لهذا اليوم
    for (let j = 0; j < localStorage.length; j++) {
      const key = localStorage.key(j);
      if (key && key.startsWith(`azkar_hisn_${dk}_`)) {
        const catId = key.replace(`azkar_hisn_${dk}_`, '');
        try {
          const val = localStorage.getItem(key);
          if (val) {
            if (!azkarData[dk]) azkarData[dk] = {};
            azkarData[dk][catId] = JSON.parse(val);
          }
        } catch { /* ignore */ }
      }
    }
  }
  if (Object.keys(azkarData).length) data['azkar'] = azkarData;

  return data;
}

/** طبّق البيانات القادمة من RTDB على localStorage (الأكبر قيمةً يكسب للأرقام) */
function applyToLocalStorage(data: Record<string, unknown>) {
  // تسبيح المجاميع - خذ الأعلى
  if (data['tasbih_totals'] && typeof data['tasbih_totals'] === 'object') {
    const remote = data['tasbih_totals'] as Record<string, number>;
    let local: Record<string, number> = {};
    try { local = JSON.parse(localStorage.getItem('tasbih_totals') ?? '{}'); } catch { /* ignore */ }
    const merged: Record<string, number> = { ...local };
    for (const [k, v] of Object.entries(remote)) {
      merged[k] = Math.max(merged[k] ?? 0, v ?? 0);
    }
    localStorage.setItem('tasbih_totals', JSON.stringify(merged));
  }

  // عداد الجولة الحالية - خذ الأعلى
  if (data['tasbih_counts'] && typeof data['tasbih_counts'] === 'object') {
    const remote = data['tasbih_counts'] as Record<string, number>;
    let local: Record<string, number> = {};
    try { local = JSON.parse(localStorage.getItem('tasbih_counts') ?? '{}'); } catch { /* ignore */ }
    const merged: Record<string, number> = { ...local };
    for (const [k, v] of Object.entries(remote)) {
      merged[k] = Math.max(merged[k] ?? 0, v ?? 0);
    }
    localStorage.setItem('tasbih_counts', JSON.stringify(merged));
  }

  // نوع التسبيح المختار
  if (data['tasbih_type_idx'] !== undefined) {
    const local = Number(localStorage.getItem('tasbih_type_idx') ?? '0');
    const remote = Number(data['tasbih_type_idx']);
    if (!isNaN(remote) && remote !== local) {
      localStorage.setItem('tasbih_type_idx', String(remote));
    }
  }

  // التسبيح اليومي
  if (data['tasbih_daily'] && typeof data['tasbih_daily'] === 'object') {
    const remote = data['tasbih_daily'] as Record<string, number>;
    for (const [dk, v] of Object.entries(remote)) {
      const key = `tasbih_daily_${dk}`;
      const local = Number(localStorage.getItem(key) ?? '0');
      if ((v ?? 0) > local) localStorage.setItem(key, String(v));
    }
  }

  // المتتبع اليومي — الصلوات والورد القرآني
  if (data['daily_tracker'] && typeof data['daily_tracker'] === 'object') {
    const remote = data['daily_tracker'] as Record<string, {
      prayers?: Record<string, boolean>;
      quranWird?: boolean;
    }>;
    for (const [dk, remoteState] of Object.entries(remote)) {
      const key = `daily_tracker_${dk}`;
      let local: { prayers?: Record<string, boolean>; quranWird?: boolean } = {};
      try { local = JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { /* ignore */ }
      // ادمج الصلوات: لو أي صلاة تمت في أي جهاز → اعتبرها تمت
      const mergedPrayers: Record<string, boolean> = { ...(local.prayers ?? {}) };
      for (const [pk, pv] of Object.entries(remoteState.prayers ?? {})) {
        if (pv) mergedPrayers[pk] = true;
      }
      const merged = {
        prayers: mergedPrayers,
        quranWird: (local.quranWird ?? false) || (remoteState.quranWird ?? false),
      };
      localStorage.setItem(key, JSON.stringify(merged));
    }
  }

  // أذكار حصن
  if (data['azkar'] && typeof data['azkar'] === 'object') {
    const remoteAzkar = data['azkar'] as Record<string, Record<string, Record<number, number>>>;
    for (const [dk, cats] of Object.entries(remoteAzkar)) {
      for (const [catId, progress] of Object.entries(cats)) {
        const key = `azkar_hisn_${dk}_${catId}`;
        let local: Record<number, number> = {};
        try { local = JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { /* ignore */ }
        const merged: Record<number, number> = { ...local };
        for (const [itemId, count] of Object.entries(progress)) {
          const id = Number(itemId);
          merged[id] = Math.max(merged[id] ?? 0, count ?? 0);
        }
        localStorage.setItem(key, JSON.stringify(merged));
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   MIGRATION — رفع localStorage إلى RTDB (أول مرة فقط)
══════════════════════════════════════════════════════════════ */

export async function migrateToRTDB(uid: string): Promise<void> {
  try {
    const snap = await get(child(userRef(uid), 'tasbih_totals'));
    if (snap.exists()) {
      // الداتابيز عنده بيانات بالفعل — ادمج اللي في localStorage
      const rtdbData = await get(userRef(uid));
      if (rtdbData.exists()) {
        applyToLocalStorage(rtdbData.val() as Record<string, unknown>);
      }
      return;
    }
    // الداتابيز فاضي → ارفع localStorage
    const localData = collectLocalData();
    if (Object.keys(localData).length > 0) {
      await update(userRef(uid), { ...localData, migratedAt: Date.now() });
    }
  } catch (e) {
    console.warn('[RTDB] Migration error:', e);
  }
}

/* ══════════════════════════════════════════════════════════════
   LOAD — جلب البيانات من RTDB عند فتح التطبيق
══════════════════════════════════════════════════════════════ */

export async function loadFromRTDB(uid: string): Promise<void> {
  try {
    const snap = await get(userRef(uid));
    if (snap.exists()) {
      applyToLocalStorage(snap.val() as Record<string, unknown>);
    }
  } catch (e) {
    console.warn('[RTDB] Load error:', e);
  }
}

/* ══════════════════════════════════════════════════════════════
   BATCH SYNC — مزامنة مؤجلة كل 10 ثواني
══════════════════════════════════════════════════════════════ */

interface PendingUpdate {
  path: string;
  value: unknown;
}

let _currentUid: string | null = null;
let _pendingUpdates: Record<string, unknown> = {};
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _visibilityHandlerAttached = false;
const FLUSH_INTERVAL_MS = 10_000;

/** قائمة انتظار تحديث بيانات معينة */
export function queueRTDBUpdate(uid: string, updates: Record<string, unknown>) {
  if (!uid) return;
  _currentUid = uid;
  Object.assign(_pendingUpdates, updates);
  scheduleFlush();
}

/** جدولة الإرسال بعد 10 ثواني (أو إعادة الجدولة لو بدأت بالفعل) */
function scheduleFlush() {
  if (_flushTimer !== null) return; // مجدولة بالفعل
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    flushRTDB();
  }, FLUSH_INTERVAL_MS);
}

/** إرسال فوري لكل التحديثات المعلقة */
export async function flushRTDB(): Promise<void> {
  if (!_currentUid || Object.keys(_pendingUpdates).length === 0) return;
  const uid = _currentUid;
  const updates = { ..._pendingUpdates };
  _pendingUpdates = {};
  try {
    await update(userRef(uid), updates);
  } catch (e) {
    // لو فشل، أعد المحاولة في الدورة القادمة
    Object.assign(_pendingUpdates, updates);
    console.warn('[RTDB] Flush error:', e);
  }
}

/** تفعيل الإرسال الفوري عند إخفاء الصفحة */
function attachVisibilityHandler() {
  if (_visibilityHandlerAttached) return;
  _visibilityHandlerAttached = true;

  const handleHide = () => {
    if (document.visibilityState === 'hidden') {
      if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }
      flushRTDB(); // لا نستطيع await هنا لكن Firebase سيرسلها
    }
  };
  document.addEventListener('visibilitychange', handleHide);
  window.addEventListener('beforeunload', () => flushRTDB());
}

/** تهيئة المزامنة لمستخدم محدد (يُستدعى بعد تسجيل الدخول) */
export async function initUserSync(uid: string): Promise<void> {
  _currentUid = uid;
  _pendingUpdates = {};
  if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }

  attachVisibilityHandler();

  // ترحيل أو تحميل
  await migrateToRTDB(uid);
}

/* ══════════════════════════════════════════════════════════════
   HELPERS للصفحات
══════════════════════════════════════════════════════════════ */

/** احفظ مجاميع التسبيح في قائمة الانتظار */
export function queueTasbihSync(
  uid: string,
  totals: Record<string, number>,
  counts: Record<string, number>,
) {
  const today = todayKey();
  const dailyVal = Number(localStorage.getItem(`tasbih_daily_${today}`) ?? '0');
  queueRTDBUpdate(uid, {
    tasbih_totals: totals,
    tasbih_counts: counts,
    [`tasbih_daily/${today}`]: dailyVal,
  });
}

/** احفظ حالة المتتبع اليومي (الصلوات + الورد) في قائمة الانتظار */
export function queueDailyTrackerSync(
  uid: string,
  dateKey: string,
  state: { prayers: Record<string, boolean>; quranWird: boolean },
) {
  queueRTDBUpdate(uid, {
    [`daily_tracker/${dateKey}`]: state,
  });
}

/** احفظ تقدم أذكار اليوم في قائمة الانتظار */
export function queueAzkarSync(
  uid: string,
  catId: string | number,
  progress: Record<number, number>,
) {
  const today = todayKey();
  queueRTDBUpdate(uid, {
    [`azkar/${today}/${catId}`]: progress,
  });
}

/** احصل على UID المستخدم الحالي من profile */
export function getCurrentUid(): string | null {
  try {
    const raw = localStorage.getItem('user_profile');
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.uid ?? null;
  } catch { return null; }
}

/** حَدِّث profile في RTDB */
export function queueProfileSync(uid: string) {
  try {
    const raw = localStorage.getItem('user_profile');
    if (!raw) return;
    const p = JSON.parse(raw);
    queueRTDBUpdate(uid, { profile: p });
  } catch { /* ignore */ }
}

/* ═══ اهتم بالاستجابة للتغييرات الفورية في localStorage ══════ */

/** بقية بيانات اليوم من الـ pending updates المتراكمة */
export function getPendingUpdatesCount(): number {
  return Object.keys(_pendingUpdates).length;
}

/** مسح قائمة الانتظار وإيقاف المؤقت (عند logout مثلاً) */
export function clearSyncState() {
  _currentUid = null;
  _pendingUpdates = {};
  if (_flushTimer !== null) { clearTimeout(_flushTimer); _flushTimer = null; }
}

/* ══════════════════════════════════════════════════════════════
   بيانات للاستخدام بعد migration - قراءة من RTDB مع callback
══════════════════════════════════════════════════════════════ */
export type { PendingUpdate };
