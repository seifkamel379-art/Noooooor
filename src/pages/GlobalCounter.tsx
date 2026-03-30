import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Eye, EyeOff, RefreshCw, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/* ── Helpers ────────────────────────────────────────────── */
function formatBigNumber(n: number): string {
  if (n >= 1_000_000_000_000)
    return (n / 1_000_000_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' تريليون';
  if (n >= 1_000_000_000)
    return (n / 1_000_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' مليار';
  if (n >= 1_000_000)
    return (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' مليون';
  return n.toLocaleString('ar-EG');
}

function useCountUp(target: number, duration: number = 600) {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    if (target === fromRef.current) return;
    const from = fromRef.current;
    fromRef.current = target;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(target);
      }
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [target, duration]);

  return display;
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/* Generate or retrieve a stable session ID per browser tab */
function getSessionId(): string {
  let sid = sessionStorage.getItem('noor_sid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('noor_sid', sid);
  }
  return sid;
}

type RippleItem = { id: number; x: number; y: number };

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  governorate?: string | null;
  tasbeehCount: number;
  noorScore: number;
}

/* ── OrnamentDivider ─────────────────────────────────────── */
function OrnamentDivider({ flip = false, isDark }: { flip?: boolean; isDark: boolean }) {
  return (
    <svg
      viewBox="0 0 200 30"
      className="w-48"
      style={{ opacity: isDark ? 0.4 : 0.55, transform: flip ? 'scaleY(-1)' : undefined }}
      fill="#C19A6B"
    >
      <polygon points="100,2 104,10 113,10 106,15 109,24 100,19 91,24 94,15 87,10 96,10" />
      <line x1="0" y1="15" x2="75" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6" />
      <line x1="125" y1="15" x2="200" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6" />
      <circle cx="77" cy="15" r="2" fill="#C19A6B" opacity="0.5" />
      <circle cx="123" cy="15" r="2" fill="#C19A6B" opacity="0.5" />
    </svg>
  );
}

/* ── Leaderboard Tab ─────────────────────────────────────── */
function LeaderboardTab({ isDark }: { isDark: boolean }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userVisible, setUserVisible] = useState<boolean | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const gold = isDark ? '#E8C98A' : '#7A4F1E';
  const cardBg = isDark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)';
  const cardBorder = `rgba(193,154,107,${isDark ? '0.2' : '0.3'})`;

  const userProfileRaw = localStorage.getItem('user_profile');
  const userProfile = userProfileRaw ? JSON.parse(userProfileRaw) : null;

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/counter/leaderboard`)
      .then(r => r.json())
      .then(d => {
        const list: LeaderboardEntry[] = d.leaderboard ?? [];
        setEntries(list);
        if (userProfile) {
          const idx = list.findIndex(e => e.userId === userProfile.uid);
          setMyRank(idx >= 0 ? idx + 1 : null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userProfile?.uid]);

  useEffect(() => {
    fetchLeaderboard();
    /* Check current visibility */
    if (userProfile?.uid) {
      fetch(`${API_BASE}/api/sohba/user/${userProfile.uid}`)
        .then(r => r.json())
        .then(d => {
          if (d.entry) setUserVisible(d.entry.isPublic);
          else setUserVisible(false);
        })
        .catch(() => setUserVisible(false));
    }
  }, []);

  const toggleVisibility = async () => {
    if (!userProfile) return;
    setSyncing(true);
    const newVisible = !userVisible;
    try {
      const tasbeehTotalsRaw = localStorage.getItem('tasbih_totals');
      const tasbeehTotals: Record<string, number> = tasbeehTotalsRaw ? JSON.parse(tasbeehTotalsRaw) : {};
      const tasbeehCount = Object.values(tasbeehTotals).reduce((a, b) => a + b, 0);

      await fetch(`${API_BASE}/api/sohba/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.uid,
          displayName: userProfile.name || 'ذاكر',
          governorate: userProfile.governorateName || null,
          isPublic: newVisible,
          tasbeehCount,
          quranCompletions: Number(localStorage.getItem('quran_completions') || 0),
          currentSurah: Number(localStorage.getItem('last_surah') || 1),
          azkarStreak: Number(localStorage.getItem('azkar_streak') || 0),
          tadabburStreak: Number(localStorage.getItem('tadabbur_streak') || 0),
          earnedBadges: [],
        }),
      });
      setUserVisible(newVisible);
      fetchLeaderboard();
    } catch { /* ignore */ }
    setSyncing(false);
  };

  const medalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return gold;
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* User controls */}
      {userProfile && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>
              {userProfile.name || 'أنت'}
              {myRank && (
                <span className="mr-2 text-xs opacity-70">— المرتبة #{myRank.toLocaleString('ar-EG')}</span>
              )}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.65 }}>
              {userVisible ? 'اسمك ظاهر في الترتيب' : 'اسمك مخفي عن الترتيب'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              className="p-2 rounded-full"
              style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleVisibility}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: userVisible ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.08)',
                border: `1px solid rgba(193,154,107,${userVisible ? '0.5' : '0.2'})`,
                color: '#C19A6B',
                fontFamily: '"Tajawal", sans-serif',
              }}
            >
              {syncing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : userVisible ? (
                <Eye size={12} />
              ) : (
                <EyeOff size={12} />
              )}
              {userVisible ? 'ظاهر' : 'مخفي'}
            </button>
          </div>
        </div>
      )}

      {!userProfile && (
        <div
          className="rounded-2xl px-4 py-3 text-center"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <p className="text-xs" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.7 }}>
            سجّل دخولك من صفحة الصحبة لتظهر في الترتيب
          </p>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#C19A6B', opacity: 0.5 }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10">
          <Trophy size={32} style={{ color: '#C19A6B', opacity: 0.3, margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.5 }}>
            لا يوجد مستخدمون في الترتيب بعد
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = userProfile && entry.userId === userProfile.uid;
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: isMe
                    ? `rgba(193,154,107,${isDark ? '0.15' : '0.18'})`
                    : cardBg,
                  border: `1px solid rgba(193,154,107,${isMe ? '0.45' : isDark ? '0.15' : '0.2'})`,
                }}
              >
                {/* Rank */}
                <div className="w-7 flex items-center justify-center flex-shrink-0">
                  {rank <= 3 ? (
                    <Trophy size={18} style={{ color: medalColor(rank) }} />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.5 }}
                    >
                      {rank.toLocaleString('ar-EG')}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: isDark ? '#E8C98A' : '#7A4F1E', fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {entry.displayName}
                    {isMe && (
                      <span className="mr-1 text-[10px] opacity-60">(أنت)</span>
                    )}
                  </p>
                  {entry.governorate && (
                    <p
                      className="text-[10px] truncate"
                      style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.55 }}
                    >
                      {entry.governorate}
                    </p>
                  )}
                </div>

                {/* Count */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Sparkles size={10} style={{ color: '#C19A6B' }} />
                  <span
                    className="text-sm font-black"
                    style={{ color: isDark ? '#E8C98A' : '#7A4F1E', fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {entry.tasbeehCount.toLocaleString('ar-EG')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function GlobalCounter() {
  const [count, setCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const [pulse, setPulse] = useState(false);
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState<'counter' | 'leaderboard'>('counter');
  const rippleIdRef = useRef(0);
  const displayCount = useCountUp(count);
  const prevCountRef = useRef(count);
  const isDark = useDarkMode();

  const bg = isDark
    ? 'radial-gradient(ellipse at center, #1a1208 0%, #0d0a05 60%, #080603 100%)'
    : 'radial-gradient(ellipse at center, #FAF4EA 0%, #F0E4CF 55%, #E6D5B5 100%)';
  const numberColor = isDark ? '#E8C98A' : '#7A4F1E';
  const numberShadow = isDark
    ? '0 0 30px rgba(232,201,138,0.6)'
    : '0 2px 10px rgba(122,79,30,0.25)';

  const triggerPulse = useCallback(() => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    const id = ++rippleIdRef.current;
    setRipples(r => [...r, { id, x: 50, y: 50 }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 1200);
  }, []);

  useEffect(() => {
    if (count !== prevCountRef.current && count > prevCountRef.current) {
      triggerPulse();
    }
    prevCountRef.current = count;
  }, [count, triggerPulse]);

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const sid = getSessionId();

    const connect = () => {
      es = new EventSource(`${API_BASE}/api/counter/stream?sid=${encodeURIComponent(sid)}`);
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.count === 'number') setCount(data.count);
          if (typeof data.activeUsers === 'number') setActiveUsers(data.activeUsers);
        } catch {}
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };

    fetch(`${API_BASE}/api/counter`)
      .then(r => r.json())
      .then(d => {
        if (typeof d.count === 'number') setCount(d.count);
        if (typeof d.activeUsers === 'number') setActiveUsers(d.activeUsers);
      })
      .catch(() => {});

    connect();

    return () => {
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  const digits = displayCount.toLocaleString('ar-EG');

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: bg }}
      dir="rtl"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: isDark ? 0.05 : 0.07 }}
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C19A6B" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <AnimatePresence>
          {ripples.map(r => (
            <motion.div
              key={r.id}
              className="absolute rounded-full"
              style={{ borderColor: 'rgba(193,154,107,0.4)', borderWidth: 1, borderStyle: 'solid' }}
              initial={{ width: 80, height: 80, opacity: 0.7, x: '-50%', y: '-50%', left: '50%', top: '42%' }}
              animate={{ width: 500, height: 500, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Top ornament + title */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <OrnamentDivider isDark={isDark} />
        <h1
          className="text-2xl font-bold tracking-widest mt-4"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B', letterSpacing: '0.2em' }}
        >
          العداد العالمي
        </h1>
        <p
          className="text-xs mt-1"
          style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.5 : 0.65 }}
        >
          مجموع تسابيح الذاكرين حول العالم
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-6 mb-4">
        {([
          { key: 'counter', label: 'العداد' },
          { key: 'leaderboard', label: 'الترتيب العالمي' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: tab === t.key
                ? `rgba(193,154,107,${isDark ? '0.25' : '0.2'})`
                : 'transparent',
              border: `1px solid rgba(193,154,107,${tab === t.key ? '0.6' : '0.2'})`,
              color: tab === t.key ? (isDark ? '#E8C98A' : '#7A4F1E') : '#C19A6B',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4">
        <AnimatePresence mode="wait">
          {tab === 'counter' ? (
            <motion.div
              key="counter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              {/* Main counter circle */}
              <div className="relative flex items-center justify-center mt-2 mb-6">
                <motion.div
                  animate={pulse ? { scale: [1, 1.08, 1], opacity: [0.15, 0.4, 0.15] } : { scale: 1, opacity: 0.15 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute rounded-full"
                  style={{ width: 280, height: 280, background: 'radial-gradient(circle, rgba(193,154,107,0.25) 0%, transparent 70%)' }}
                />
                <motion.div
                  animate={pulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="relative flex flex-col items-center justify-center rounded-full"
                  style={{
                    width: 220, height: 220,
                    border: `1px solid rgba(193,154,107,${isDark ? '0.3' : '0.45'})`,
                    background: `rgba(193,154,107,${isDark ? '0.05' : '0.08'})`,
                    boxShadow: pulse
                      ? `0 0 60px rgba(193,154,107,${isDark ? '0.35' : '0.25'}), inset 0 0 40px rgba(193,154,107,0.08)`
                      : `0 0 30px rgba(193,154,107,${isDark ? '0.12' : '0.1'}), inset 0 0 20px rgba(193,154,107,0.04)`,
                  }}
                >
                  <div
                    className="absolute rounded-full"
                    style={{ inset: 8, border: `1px solid rgba(193,154,107,${isDark ? '0.15' : '0.22'})` }}
                  />
                  <motion.span
                    key={Math.floor(displayCount / 1000)}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 text-center px-4 leading-none"
                    style={{
                      fontFamily: '"Tajawal", sans-serif',
                      fontSize: digits.length > 10 ? '1.6rem' : digits.length > 7 ? '2.2rem' : '3rem',
                      fontWeight: 900,
                      color: numberColor,
                      textShadow: numberShadow,
                      direction: 'ltr',
                    }}
                  >
                    {digits}
                  </motion.span>
                  <p
                    className="relative z-10 text-[10px] mt-2"
                    style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.6 : 0.75 }}
                  >
                    تسبيحة
                  </p>
                </motion.div>
              </div>

              {count >= 1_000_000 && (
                <div className="mb-4 text-center">
                  <span className="text-sm" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.7 : 0.8 }}>
                    ≈ {formatBigNumber(count)}
                  </span>
                </div>
              )}

              {/* Active users */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl"
                  style={{
                    background: `rgba(193,154,107,${isDark ? '0.08' : '0.1'})`,
                    border: `1px solid rgba(193,154,107,${isDark ? '0.2' : '0.3'})`,
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#4ade80' }}
                  />
                  <span className="text-sm font-bold" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                    الذاكرون الآن
                  </span>
                  <span className="text-lg font-black" style={{ color: numberColor, fontFamily: '"Tajawal", sans-serif' }}>
                    {activeUsers.toLocaleString('ar-EG')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500/60'}`} />
                  <span
                    className="text-[10px]"
                    style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.4 : 0.55 }}
                  >
                    {connected ? 'متصل' : 'جارٍ الاتصال...'}
                  </span>
                </div>
              </div>

              {/* Bottom ornament */}
              <div className="mt-6">
                <OrnamentDivider flip isDark={isDark} />
              </div>

              <div className="mt-4 px-10 text-center pb-8">
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: '#C19A6B', fontFamily: '"Amiri", serif', opacity: isDark ? 0.3 : 0.45 }}
                >
                  وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LeaderboardTab isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom padding for nav */}
      <div className="h-20 flex-shrink-0" />
    </div>
  );
}
