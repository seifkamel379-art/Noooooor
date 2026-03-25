import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MORNING_AZKAR, EVENING_AZKAR, SURAH_NAMES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'wouter';

// ── Types ─────────────────────────────────────────────────────────────────────
type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type WardType = 'hizb' | 'juz';

interface TrackerState {
  prayers: Record<PrayerKey, boolean>;
  quranWird: boolean;
}

const DEFAULT_STATE: TrackerState = {
  prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
  quranWird: false,
};

// ── Quran Juz / Hizb data ─────────────────────────────────────────────────────
const JUZ_STARTS: { juz: number; surah: number; ayah: number }[] = [
  { juz: 1,  surah: 1,   ayah: 1  }, { juz: 2,  surah: 2,   ayah: 142 },
  { juz: 3,  surah: 2,   ayah: 253 }, { juz: 4,  surah: 3,   ayah: 93  },
  { juz: 5,  surah: 4,   ayah: 24  }, { juz: 6,  surah: 4,   ayah: 148 },
  { juz: 7,  surah: 5,   ayah: 82  }, { juz: 8,  surah: 6,   ayah: 111 },
  { juz: 9,  surah: 7,   ayah: 88  }, { juz: 10, surah: 8,   ayah: 41  },
  { juz: 11, surah: 9,   ayah: 93  }, { juz: 12, surah: 11,  ayah: 6   },
  { juz: 13, surah: 12,  ayah: 53  }, { juz: 14, surah: 15,  ayah: 1   },
  { juz: 15, surah: 17,  ayah: 1   }, { juz: 16, surah: 18,  ayah: 75  },
  { juz: 17, surah: 21,  ayah: 1   }, { juz: 18, surah: 23,  ayah: 1   },
  { juz: 19, surah: 25,  ayah: 21  }, { juz: 20, surah: 27,  ayah: 56  },
  { juz: 21, surah: 29,  ayah: 46  }, { juz: 22, surah: 33,  ayah: 31  },
  { juz: 23, surah: 36,  ayah: 28  }, { juz: 24, surah: 39,  ayah: 32  },
  { juz: 25, surah: 41,  ayah: 47  }, { juz: 26, surah: 46,  ayah: 1   },
  { juz: 27, surah: 51,  ayah: 31  }, { juz: 28, surah: 58,  ayah: 1   },
  { juz: 29, surah: 67,  ayah: 1   }, { juz: 30, surah: 78,  ayah: 1   },
];

// Midpoint of each juz (start of second hizb within that juz)
const JUZ_MIDPOINTS: { juz: number; surah: number; ayah: number }[] = [
  { juz: 1,  surah: 2,  ayah: 75  }, { juz: 2,  surah: 2,  ayah: 203 },
  { juz: 3,  surah: 3,  ayah: 14  }, { juz: 4,  surah: 3,  ayah: 171 },
  { juz: 5,  surah: 4,  ayah: 88  }, { juz: 6,  surah: 5,  ayah: 4   },
  { juz: 7,  surah: 6,  ayah: 36  }, { juz: 8,  surah: 7,  ayah: 32  },
  { juz: 9,  surah: 7,  ayah: 172 }, { juz: 10, surah: 9,  ayah: 34  },
  { juz: 11, surah: 10, ayah: 27  }, { juz: 12, surah: 11, ayah: 85  },
  { juz: 13, surah: 13, ayah: 19  }, { juz: 14, surah: 16, ayah: 51  },
  { juz: 15, surah: 17, ayah: 99  }, { juz: 16, surah: 20, ayah: 1   },
  { juz: 17, surah: 22, ayah: 1   }, { juz: 18, surah: 24, ayah: 21  },
  { juz: 19, surah: 26, ayah: 84  }, { juz: 20, surah: 28, ayah: 51  },
  { juz: 21, surah: 31, ayah: 1   }, { juz: 22, surah: 35, ayah: 1   },
  { juz: 23, surah: 38, ayah: 1   }, { juz: 24, surah: 40, ayah: 41  },
  { juz: 25, surah: 43, ayah: 24  }, { juz: 26, surah: 49, ayah: 1   },
  { juz: 27, surah: 54, ayah: 1   }, { juz: 28, surah: 62, ayah: 1   },
  { juz: 29, surah: 72, ayah: 1   }, { juz: 30, surah: 93, ayah: 1   },
];

function pos(surah: number, ayah: number) {
  return surah * 400 + ayah;
}

function findCurrentJuz(surah: number, ayah: number): number {
  let juz = 1;
  for (const b of JUZ_STARTS) {
    if (pos(surah, ayah) >= pos(b.surah, b.ayah)) juz = b.juz;
  }
  return juz;
}

function getWardTarget(
  bookmark: { surah: number; ayah: number },
  wardType: WardType,
): { surah: number; ayah: number; label: string } | null {
  const currentJuz = findCurrentJuz(bookmark.surah, bookmark.ayah);
  const mid = JUZ_MIDPOINTS.find(m => m.juz === currentJuz);
  const nextJuz = JUZ_STARTS.find(j => j.juz === currentJuz + 1);

  if (wardType === 'juz') {
    if (!nextJuz) return null;
    return { surah: nextJuz.surah, ayah: nextJuz.ayah, label: `نهاية الجزء ${currentJuz}` };
  } else {
    // hizb: if bookmark is before midpoint → stop at midpoint, else stop at next juz
    if (mid && pos(bookmark.surah, bookmark.ayah) < pos(mid.surah, mid.ayah)) {
      return { surah: mid.surah, ayah: mid.ayah, label: `منتصف الجزء ${currentJuz}` };
    }
    if (nextJuz) {
      return { surah: nextJuz.surah, ayah: nextJuz.ayah, label: `نهاية الجزء ${currentJuz}` };
    }
    return null;
  }
}

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function MosqueIcon({ color = '#c5a059', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Dome */}
      <path d="M16 4 C12 4 9 7 9 11 L9 13 L23 13 L23 11 C23 7 20 4 16 4 Z" fill={color} opacity="0.9" />
      {/* Minaret left */}
      <rect x="4" y="7" width="4" height="15" rx="1" fill={color} opacity="0.65" />
      <rect x="3" y="5" width="6" height="3" rx="1" fill={color} opacity="0.65" />
      <rect x="4.5" y="3" width="3" height="3" rx="0.5" fill={color} opacity="0.65" />
      {/* Minaret right */}
      <rect x="24" y="7" width="4" height="15" rx="1" fill={color} opacity="0.65" />
      <rect x="23" y="5" width="6" height="3" rx="1" fill={color} opacity="0.65" />
      <rect x="24.5" y="3" width="3" height="3" rx="0.5" fill={color} opacity="0.65" />
      {/* Body */}
      <rect x="7" y="13" width="18" height="13" rx="2" fill={color} opacity="0.8" />
      {/* Door arch */}
      <path d="M14 26 L14 20 Q16 18 18 20 L18 26" fill="white" opacity="0.35" />
      {/* Crescent */}
      <path d="M16 6 C14.5 5.5 13 6.5 13 8 C13 9.5 14.5 10 16 9.5 C14.5 9.5 13.5 9 13.5 8 C13.5 7 14.5 6.5 16 6 Z" fill="white" opacity="0.6" />
      {/* Ground */}
      <rect x="3" y="26" width="26" height="2" rx="1" fill={color} opacity="0.3" />
    </svg>
  );
}

function DuaHandsIcon({ color = '#c5a059', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Left hand */}
      <path d="M6 20 C6 16 8 12 10 10 L10 8 C10 7 11 6.5 12 7 L12 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M8 20 C8 15 10 11 12 9 L12 7 C12 6 13 5.5 14 6 L14 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* Right hand */}
      <path d="M26 20 C26 16 24 12 22 10 L22 8 C22 7 21 6.5 20 7 L20 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M24 20 C24 15 22 11 20 9 L20 7 C20 6 19 5.5 18 6 L18 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* Palm */}
      <path d="M6 22 C6 24 8 26 10 26 L22 26 C24 26 26 24 26 22 L26 20 L6 20 Z" fill={color} opacity="0.25" />
      <path d="M6 20 L26 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      {/* Sparkle */}
      <circle cx="16" cy="14" r="1" fill={color} opacity="0.5" />
      <line x1="16" y1="11" x2="16" y2="10" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="18.5" y1="11.5" x2="19.2" y2="10.8" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="13.5" y1="11.5" x2="12.8" y2="10.8" stroke={color} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

function QuranBookIcon({ color = '#c5a059', size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Book spine */}
      <rect x="14" y="4" width="3" height="24" rx="1" fill={color} opacity="0.5" />
      {/* Left page */}
      <path d="M14 5 C14 5 8 5 6 7 L6 25 C8 23 14 23 14 23 Z" fill={color} opacity="0.25" />
      <path d="M14 5 C14 5 8 5 6 7 L6 25 C8 23 14 23 14 23 Z" stroke={color} strokeWidth="0.8" opacity="0.5" />
      {/* Right page */}
      <path d="M17 5 C17 5 23 5 25 7 L25 25 C23 23 17 23 17 23 Z" fill={color} opacity="0.35" />
      <path d="M17 5 C17 5 23 5 25 7 L25 25 C23 23 17 23 17 23 Z" stroke={color} strokeWidth="0.8" opacity="0.5" />
      {/* Lines on right page */}
      <line x1="18.5" y1="10" x2="23.5" y2="10" stroke={color} strokeWidth="0.7" opacity="0.5" />
      <line x1="18.5" y1="13" x2="23" y2="13" stroke={color} strokeWidth="0.7" opacity="0.5" />
      <line x1="18.5" y1="16" x2="23.5" y2="16" stroke={color} strokeWidth="0.7" opacity="0.5" />
      <line x1="18.5" y1="19" x2="22" y2="19" stroke={color} strokeWidth="0.7" opacity="0.5" />
      {/* Decorative star on left */}
      <polygon points="10,12 10.7,14 12.7,14 11.2,15.2 11.8,17.2 10,16 8.2,17.2 8.8,15.2 7.3,14 9.3,14" fill={color} opacity="0.55" />
    </svg>
  );
}

// ── Heatmap helpers ───────────────────────────────────────────────────────────
function getDayScore(dateKey: string): number {
  let score = 0;
  try {
    const raw = localStorage.getItem(`daily_tracker_${dateKey}`);
    if (raw) {
      const t = JSON.parse(raw);
      score += Object.values(t.prayers || {}).filter(Boolean).length;
      if (t.quranWird) score += 1;
    }
  } catch {}
  try {
    const raw = localStorage.getItem(`azkar_${dateKey}`);
    if (raw) {
      const p = JSON.parse(raw);
      const m = MORNING_AZKAR.every(z => (p[z.id] ?? 0) >= z.count);
      const e = EVENING_AZKAR.every(z => (p[z.id] ?? 0) >= z.count);
      if (m && e) score += 1;
    }
  } catch {}
  return score;
}

function cellColor(score: number, isToday: boolean): string {
  if (isToday && score === 0) return 'rgba(197,160,89,0.14)';
  if (score === 0) return 'rgba(197,160,89,0.06)';
  if (score <= 2) return '#6b4a20';
  if (score <= 4) return '#a0702e';
  if (score <= 6) return '#c5922a';
  return '#c5a059';
}

// ── PRAYERS config ─────────────────────────────────────────────────────────────
const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: 'fajr',    label: 'الفجر'  },
  { key: 'dhuhr',   label: 'الظهر'  },
  { key: 'asr',     label: 'العصر'  },
  { key: 'maghrib', label: 'المغرب' },
  { key: 'isha',    label: 'العشاء' },
];

// ── Main component ─────────────────────────────────────────────────────────────
export function HomeTracker() {
  const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey);

  const [state, setState] = useLocalStorage<TrackerState>(
    `daily_tracker_${currentDateKey}`,
    DEFAULT_STATE,
  );
  const [wardType, setWardTypePref] = useLocalStorage<WardType>('quran_ward_type', 'hizb');
  const [bookmark] = useLocalStorage<{ surah: number; ayah: number } | null>(
    'quran_bookmark',
    null,
  );
  const [azkarProgress] = useLocalStorage<Record<string, number>>(
    `azkar_${currentDateKey}`,
    {},
  );

  const morningDone = MORNING_AZKAR.every(z => (azkarProgress[z.id] ?? 0) >= z.count);
  const eveningDone = EVENING_AZKAR.every(z => (azkarProgress[z.id] ?? 0) >= z.count);
  const azkarDone = morningDone && eveningDone;

  const prayersDone = PRAYERS.filter(p => state.prayers[p.key]).length;
  const doneTasks = prayersDone + (azkarDone ? 1 : 0) + (state.quranWird ? 1 : 0);
  const progressPct = Math.round((doneTasks / 7) * 100);

  const togglePrayer = (key: PrayerKey) => {
    setState(prev => ({ ...prev, prayers: { ...prev.prayers, [key]: !prev.prayers[key] } }));
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const toggleQuranWird = () => {
    setState(prev => ({ ...prev, quranWird: !prev.quranWird }));
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const setWardType = (t: WardType) => {
    setWardTypePref(t);
  };

  // Auto reset on new day
  useEffect(() => {
    const id = setInterval(() => {
      const k = getTodayDateKey();
      if (k !== currentDateKey) setCurrentDateKey(k);
    }, 30000);
    return () => clearInterval(id);
  }, [currentDateKey]);

  const wardTarget = bookmark ? getWardTarget(bookmark, wardType) : null;

  // ── Heatmap data ──────────────────────────────────────────────────────────
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const totalCells = 91 + (6 - dayOfWeek);
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - (totalCells - 1));

    const cells: { dateKey: string; score: number; isToday: boolean; date: Date }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isFuture = d > today;
      cells.push({
        dateKey,
        score: isFuture ? -1 : getDayScore(dateKey),
        isToday: d.getTime() === today.getTime(),
        date: new Date(d),
      });
    }

    const numWeeks = Math.ceil(cells.length / 7);
    const weeksArr: typeof cells[] = [];
    for (let w = 0; w < numWeeks; w++) {
      weeksArr.push(cells.slice(w * 7, w * 7 + 7));
    }

    const months: { label: string; col: number }[] = [];
    weeksArr.forEach((week, col) => {
      const first = week[0];
      if (!first) return;
      if (col === 0 || first.date.getDate() <= 7) {
        const m = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(first.date);
        if (!months.length || months[months.length - 1].label !== m) {
          months.push({ label: m, col });
        }
      }
    });

    return { weeks: weeksArr, monthLabels: months };
  }, []);

  const progressColor =
    progressPct === 100 ? '#22c55e' : progressPct >= 60 ? '#c5a059' : '#a07a3a';

  return (
    <div className="space-y-4" dir="rtl">
      {/* ── Section Header + Progress ── */}
      <div
        className="rounded-3xl p-4 border"
        style={{
          background: 'linear-gradient(135deg, rgba(197,160,89,0.1), rgba(197,160,89,0.04))',
          borderColor: 'rgba(197,160,89,0.22)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="#c5a059" opacity={0.8}>
              <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" />
            </svg>
            <h2
              className="font-bold text-base"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#c5a059' }}
            >
              المتتبع اليومي
            </h2>
          </div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: '"Tajawal", sans-serif', color: progressColor }}
          >
            {progressPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(197,160,89,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${progressColor}aa, ${progressColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {doneTasks} / 7 مهام
          </span>
          <AnimatePresence>
            {progressPct === 100 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-green-500 flex items-center gap-1"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
              >
                <Check className="w-3 h-3" /> يوم مثالي!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Prayer Circles ── */}
      <div className="bg-card rounded-3xl p-4 border" style={{ borderColor: 'rgba(197,160,89,0.15)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(197,160,89,0.12)' }}
          >
            <MosqueIcon size={18} />
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            الصلوات الخمس
          </span>
          <span className="text-xs text-muted-foreground mr-auto" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {prayersDone}/5
          </span>
        </div>
        <div className="flex justify-between gap-1.5">
          {PRAYERS.map((prayer, i) => {
            const done = state.prayers[prayer.key];
            return (
              <motion.button
                key={prayer.key}
                onClick={() => togglePrayer(prayer.key)}
                whileTap={{ scale: 0.88 }}
                className="flex-1 flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  style={
                    done
                      ? {
                          background: 'linear-gradient(135deg, #c5a059, #9a7430)',
                          borderColor: '#c5a059',
                          boxShadow: '0 3px 12px rgba(197,160,89,0.45)',
                        }
                      : {
                          background: 'rgba(197,160,89,0.06)',
                          borderColor: 'rgba(197,160,89,0.28)',
                        }
                  }
                >
                  {done ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className="text-sm font-bold"
                      style={{ color: 'rgba(197,160,89,0.55)', fontFamily: '"Tajawal", sans-serif' }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold leading-tight"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    color: done ? '#c5a059' : 'var(--muted-foreground)',
                  }}
                >
                  {prayer.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Task Cards ── */}
      <div className="space-y-3">
        {/* Azkar card */}
        <div
          className="rounded-2xl p-4 border transition-all duration-300"
          style={
            azkarDone
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--card)' }
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: azkarDone ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}
              >
                <DuaHandsIcon size={22} color={azkarDone ? '#22c55e' : '#c5a059'} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  أذكار الصباح والمساء
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ fontFamily: '"Tajawal", sans-serif', color: 'var(--muted-foreground)' }}
                >
                  {azkarDone
                    ? 'مكتمل ✓'
                    : morningDone
                    ? 'الصباح ✓ · المساء لم يكتمل'
                    : eveningDone
                    ? 'المساء ✓ · الصباح لم يكتمل'
                    : 'لم يبدأ بعد'}
                </p>
              </div>
            </div>
            {azkarDone ? (
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Link href="/azkar">
                <div
                  className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    background: 'linear-gradient(135deg, #c5a059, #9a7430)',
                    color: '#fff',
                  }}
                >
                  ابدأ
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Quran wird card */}
        <div
          className="rounded-2xl border transition-all duration-300"
          style={
            state.quranWird
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--card)' }
          }
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: state.quranWird ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}
                >
                  <QuranBookIcon size={22} color={state.quranWird ? '#22c55e' : '#c5a059'} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    الورد القرآني
                  </p>
                  {bookmark ? (
                    <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#c5a059' }}>
                      من: {SURAH_NAMES[bookmark.surah]} آية {bookmark.ayah}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      ضع علامة حفظ في المصحف أولاً
                    </p>
                  )}
                </div>
              </div>

              {/* Done toggle */}
              <motion.button
                onClick={bookmark ? toggleQuranWird : undefined}
                whileTap={bookmark ? { scale: 0.88 } : {}}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                style={
                  state.quranWird
                    ? { background: '#22c55e', borderColor: '#22c55e' }
                    : { background: 'transparent', borderColor: 'rgba(197,160,89,0.35)' }
                }
              >
                {state.quranWird && <Check className="w-4 h-4 text-white" />}
              </motion.button>
            </div>

            {/* Ward type selector + target */}
            {bookmark && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(197,160,89,0.12)' }}>
                {/* Toggle: حزب / جزء */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    مقدار الورد:
                  </span>
                  <div
                    className="flex rounded-xl overflow-hidden border"
                    style={{ borderColor: 'rgba(197,160,89,0.3)' }}
                  >
                    {(['hizb', 'juz'] as WardType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setWardType(t)}
                        className="px-3 py-1 text-xs font-bold transition-all"
                        style={{
                          fontFamily: '"Tajawal", sans-serif',
                          background: wardType === t
                            ? 'linear-gradient(135deg, #c5a059, #9a7430)'
                            : 'transparent',
                          color: wardType === t ? '#fff' : 'var(--muted-foreground)',
                        }}
                      >
                        {t === 'hizb' ? 'حزب' : 'جزء'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target ayah */}
                {wardTarget ? (
                  <div
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'rgba(197,160,89,0.08)', border: '1px solid rgba(197,160,89,0.18)' }}
                  >
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {wardTarget.label} — اقرأ حتى:
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ fontFamily: '"Tajawal", sans-serif', color: '#c5a059' }}
                    >
                      {SURAH_NAMES[wardTarget.surah]} آية {wardTarget.ayah}
                    </span>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'rgba(197,160,89,0.08)' }}
                  >
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      الجزء 30 — اقرأ حتى نهاية القرآن
                    </span>
                  </div>
                )}

                {!state.quranWird && (
                  <button
                    onClick={toggleQuranWird}
                    className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-center transition-all"
                    style={{
                      fontFamily: '"Tajawal", sans-serif',
                      background: 'linear-gradient(135deg, #c5a059, #9a7430)',
                      color: '#fff',
                    }}
                  >
                    أكملت وردي ✓
                  </button>
                )}
              </div>
            )}

            {!bookmark && (
              <Link href="/quran">
                <div
                  className="mt-3 py-2 rounded-xl text-xs font-bold text-center"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    background: 'rgba(197,160,89,0.1)',
                    color: '#c5a059',
                    border: '1px solid rgba(197,160,89,0.25)',
                  }}
                >
                  اذهب للمصحف وضع علامة حفظ →
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div
        className="rounded-3xl overflow-hidden border"
        style={{ background: 'var(--card)', borderColor: 'rgba(197,160,89,0.15)' }}
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#c5a059' }}
            >
              سجل الأيام
            </h3>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              آخر 13 أسبوع
            </span>
          </div>

          <div className="overflow-x-auto" style={{ direction: 'ltr' }}>
            <div style={{ display: 'inline-block' }}>
              {/* Month labels row */}
              <div style={{ display: 'flex', marginBottom: 4, paddingRight: 28 }}>
                {weeks.map((_, col) => {
                  const ml = monthLabels.find(m => m.col === col);
                  return (
                    <div key={col} style={{ width: 13, marginLeft: 2, flexShrink: 0 }}>
                      {ml && (
                        <span className="text-[8px] text-muted-foreground">
                          {ml.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 2 }}>
                {weeks.map((week, col) => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {week.map((cell, row) => (
                      <div
                        key={row}
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: 3,
                          background: cell.score < 0 ? 'transparent' : cellColor(cell.score, cell.isToday),
                          border: cell.isToday ? '1.5px solid #c5a059' : '1px solid rgba(197,160,89,0.08)',
                          boxShadow: cell.score === 7 ? '0 0 5px rgba(197,160,89,0.7)' : 'none',
                          transition: 'background 0.2s',
                        }}
                        title={cell.score >= 0 ? `${cell.dateKey}: ${cell.score}/7` : ''}
                      />
                    ))}
                  </div>
                ))}

                {/* Day labels on left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }}>
                  {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => (
                    <div
                      key={d}
                      style={{ height: 13, lineHeight: '13px' }}
                      className="text-[9px] text-muted-foreground"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(197,160,89,0.1)' }}>
            <div
              className="flex items-end justify-center gap-3"
              style={{ direction: 'ltr' }}
            >
              {[
                { score: 0,  label: 'لا شيء' },
                { score: 2,  label: '١-٢' },
                { score: 4,  label: '٣-٤' },
                { score: 6,  label: '٥-٦' },
                { score: 7,  label: 'مثالي' },
              ].map(({ score, label }) => (
                <div key={score} className="flex flex-col items-center gap-1">
                  <div
                    style={{
                      width: 13,
                      height: 13,
                      borderRadius: 3,
                      background: cellColor(score, false),
                      border: '1px solid rgba(197,160,89,0.15)',
                      boxShadow: score === 7 ? '0 0 5px rgba(197,160,89,0.6)' : 'none',
                    }}
                  />
                  <span
                    className="text-[9px] text-muted-foreground"
                    style={{ fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
