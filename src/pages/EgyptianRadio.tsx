import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2, WifiOff, Loader2, RefreshCw, Radio } from 'lucide-react';
import { Link } from 'wouter';

/* ─── Islamic Radio Stations ──────────────────────────────────
   Each station has a primary URL and ordered fallback list.
   Prefer fast CDN streams (Zeno, Radiojar) over direct icecast.
────────────────────────────────────────────────────────────── */
const STATIONS = [
  {
    id: 1,
    name: 'إذاعة القرآن الكريم',
    subtitle: 'الإذاعة المصرية · بث مباشر',
    urls: [
      'https://stream.radiojar.com/8s5u5tpdtwzuv',
      'https://Qurango.net/radio/quranegypt',
      'https://radio.mp3islam.com/listen/quran_radio/radio.mp3',
    ],
    svgLogo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12"/>
        <path d="M24 9 C18 9 8 11 7 16 L7 39 C8 35 18 33 24 33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 9 C30 9 40 11 41 16 L41 39 C40 35 30 33 24 33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="24" y1="9" x2="24" y2="33" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 30 Q3 21 7 17" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.45"/>
        <path d="M1 35 Q1 18 7 12" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.25"/>
        <path d="M45 30 Q45 21 41 17" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.45"/>
        <path d="M47 35 Q47 18 41 12" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.25"/>
      </svg>
    ),
  },
  {
    id: 2,
    name: 'ماهر المعيقلي',
    subtitle: 'تلاوات خاشعة · بث مستمر',
    urls: [
      'https://stream.zeno.fm/xqcd0h4fp9zuv',
      'https://Qurango.net/radio/maher',
      'https://radio.mp3islam.com/listen/maher/radio.mp3',
    ],
    svgLogo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12"/>
        <rect x="17" y="7" width="13" height="20" rx="6.5" stroke="currentColor" strokeWidth="2"/>
        <path d="M11 26 Q11 39 24 39 Q37 39 37 26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <line x1="24" y1="39" x2="24" y2="43" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17" y1="43" x2="31" y2="43" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19" y1="19" x2="29" y2="19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        <line x1="19" y1="22" x2="29" y2="22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 3,
    name: 'مشاري العفاسي',
    subtitle: 'تلاوات وأناشيد · بث مستمر',
    urls: [
      'https://stream.zeno.fm/ud3z16g0hkquv',
      'https://Qurango.net/radio/mishary',
      'https://radio.mp3islam.com/listen/mishary/radio.mp3',
    ],
    svgLogo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12"/>
        <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="24" y1="7"  x2="24" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="24" y1="37" x2="24" y2="41" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="7"  y1="24" x2="11" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="37" y1="24" x2="41" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="12.1" y1="12.1" x2="15" y2="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
        <line x1="33"   y1="33"   x2="35.9" y2="35.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
        <line x1="35.9" y1="12.1" x2="33"   y2="15"   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
        <line x1="15"   y1="33"   x2="12.1" y2="35.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
        <circle cx="24" cy="24" r="3.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 4,
    name: 'محمد صديق المنشاوي',
    subtitle: 'تلاوات كلاسيكية · بث مستمر',
    urls: [
      'https://Qurango.net/radio/minshawi',
      'https://radio.mp3islam.com/listen/minshawi/radio.mp3',
    ],
    svgLogo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12"/>
        <path d="M14 30 Q14 18 24 16 Q34 18 34 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="11" y="30" width="26" height="12" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M20 42 L20 36 Q24 33 28 36 L28 42" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="7" y="22" width="4" height="20" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M7 22 Q9 18 11 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <circle cx="9" cy="17.5" r="0.8" fill="currentColor"/>
        <rect x="37" y="22" width="4" height="20" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M37 22 Q39 18 41 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <circle cx="39" cy="17.5" r="0.8" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 5,
    name: 'ياسر الدوسري',
    subtitle: 'تلاوات مؤثرة · بث مستمر',
    urls: [
      'https://Qurango.net/radio/yasser',
      'https://radio.mp3islam.com/listen/yaser/radio.mp3',
    ],
    svgLogo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12"/>
        <path d="M24 9 C14 9 8 16.5 8 24 C8 31.5 14 39 24 39 C32 39 38.5 33.5 39.5 26 C36.5 29.5 31 31 27 28.5 C20 25 17.5 17 22 12 C22.5 11 23.2 10 24 9Z"
          stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <polygon points="33,13 34.5,18 39.5,18 35.5,21 37,26 33,23 29,26 30.5,21 26.5,18 31.5,18"
          stroke="currentColor" strokeWidth="1.3" fill="none"/>
      </svg>
    ),
  },
  {
    id: 6,
    name: 'إذاعة مكة المكرمة',
    subtitle: 'بث مباشر من الحرم المكي',
    urls: [
      'https://edge.mixlr.com/channel/rwumx',
      'https://stream.radiojar.com/0tpy1h0kxtzuv',
      'https://qurango.net/radio/mix',
    ],
    svgLogo: (
      <svg viewBox="0 0 48 48" fill="none" className="w-9 h-9">
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12"/>
        <path d="M24 6 Q12 6 8 16 L8 38 Q12 28 24 28 Q36 28 40 38 L40 16 Q36 6 24 6Z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
        <path d="M22 6 Q22 14 18 18" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M26 6 Q26 14 30 18" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <circle cx="24" cy="20" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 42 Q12 36 24 34 Q36 36 36 42" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
];

type Status = 'idle' | 'loading' | 'playing' | 'error';

function EqBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex gap-0.5 items-end h-5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-1 rounded-full bg-primary transition-all duration-300"
          style={{
            height: playing ? `${8 + (i % 3) * 6}px` : '4px',
            animation: playing ? `eqbar ${0.4 + i * 0.1}s ease-in-out infinite alternate` : 'none',
          }} />
      ))}
    </div>
  );
}

export function EgyptianRadio() {
  const [activeId, setActiveId]     = useState<number | null>(null);
  const [status, setStatus]         = useState<Status>('idle');
  const audioRef                    = useRef<HTMLAudioElement | null>(null);
  const retryTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;

    const onPlaying = () => setStatus('playing');
    const onError   = () => setStatus('error');
    const onCanPlay = () => {
      a.play().catch(() => setStatus('error'));
    };

    a.addEventListener('playing',  onPlaying);
    a.addEventListener('error',    onError);
    a.addEventListener('canplay',  onCanPlay);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      a.pause(); a.src = '';
      a.removeEventListener('playing',  onPlaying);
      a.removeEventListener('error',    onError);
      a.removeEventListener('canplay',  onCanPlay);
    };
  }, []);

  const playStation = useCallback((station: typeof STATIONS[0], idx = 0) => {
    const a = audioRef.current;
    if (!a) return;
    if (idx >= station.urls.length) {
      setStatus('error');
      return;
    }

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    setStatus('loading');
    a.pause();
    a.src = station.urls[idx];
    a.load();

    const onErr = () => {
      a.removeEventListener('error', onErr);
      retryTimerRef.current = setTimeout(() => playStation(station, idx + 1), 600);
    };
    a.addEventListener('error', onErr, { once: true });
  }, []);

  const toggle = useCallback((station: typeof STATIONS[0]) => {
    const a = audioRef.current;
    if (!a) return;

    if (activeId === station.id) {
      if (status === 'playing' || status === 'loading') {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        a.pause(); a.src = '';
        setStatus('idle'); setActiveId(null);
      } else {
        playStation(station, 0);
      }
      return;
    }

    setActiveId(station.id);
    playStation(station, 0);
  }, [activeId, status, playStation]);

  const activeStation = STATIONS.find(s => s.id === activeId);

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      <style>{`
        @keyframes eqbar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0">
        <Link href="/more">
          <button className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>الإذاعات الإسلامية</h1>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {activeStation ? activeStation.name : 'اختر إذاعة للاستماع'}
          </p>
        </div>
        {activeStation && status === 'playing' && <EqBars playing={true} />}
      </div>

      {/* Now Playing Bar */}
      {activeStation && (
        <div className="mx-4 mt-4 p-4 rounded-2xl flex items-center gap-4 flex-shrink-0 bg-primary/8 border border-primary/25"
          style={{
            boxShadow: status === 'playing' ? '0 0 28px var(--primary-glow, rgba(193,154,107,0.2))' : undefined,
          }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/30 text-primary">
            {activeStation.svgLogo}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {activeStation.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {status === 'loading' ? 'جاري الاتصال...'
              : status === 'error'   ? 'تعذّر الاتصال — اضغط للمحاولة مجدداً'
              : `${activeStation.subtitle} • يبث الآن`}
            </p>
          </div>
          <div className="flex-shrink-0">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-primary"/>}
            {status === 'playing' && <Volume2 className="w-5 h-5 text-primary"/>}
            {status === 'error'   && <WifiOff className="w-5 h-5 text-destructive"/>}
          </div>
        </div>
      )}

      {/* Station List */}
      <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-3">
        {STATIONS.map(s => {
          const isActive  = activeId === s.id;
          const isLoading = isActive && status === 'loading';
          const isError   = isActive && status === 'error';
          const isPlaying = isActive && status === 'playing';

          return (
            <button key={s.id} onClick={() => toggle(s)}
              className="w-full p-4 rounded-2xl border text-right transition-all duration-300 active:scale-[0.98]"
              style={{
                background: isActive ? 'var(--primary-fade, rgba(193,154,107,0.08))' : 'var(--card)',
                borderColor: isActive ? 'var(--primary-border, rgba(193,154,107,0.4))' : 'var(--border)',
                boxShadow: isPlaying ? '0 0 20px rgba(193,154,107,0.15), 0 2px 12px rgba(0,0,0,0.04)' : undefined,
              }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary transition-all"
                  style={{
                    background: isActive ? 'rgba(193,154,107,0.12)' : 'var(--secondary)',
                    border: isActive ? '2px solid rgba(193,154,107,0.4)' : '2px solid transparent',
                  }}>
                  {s.svgLogo}
                </div>

                <div className="flex-1 text-right">
                  <p className="font-bold text-base leading-tight"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: isActive ? 'var(--primary)' : 'var(--foreground)' }}>
                    {s.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    {s.subtitle}
                  </p>
                </div>

                <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: isActive ? 'var(--primary)' : 'rgba(193,154,107,0.12)',
                  }}>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: isActive ? '#fff' : 'var(--primary)' }} />
                  ) : isError ? (
                    <RefreshCw className="w-5 h-5" style={{ color: isActive ? '#fff' : 'var(--primary)' }} />
                  ) : isPlaying ? (
                    <svg viewBox="0 0 24 24" fill={isActive ? '#fff' : 'var(--primary)'} className="w-5 h-5">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill={isActive ? '#fff' : 'var(--primary)'} className="w-5 h-5">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </div>
              </div>

              {isPlaying && (
                <div className="flex gap-0.5 items-end mt-3 px-1" style={{ height: 14 }}>
                  {Array.from({ length: 22 }, (_, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-primary"
                      style={{
                        height: `${25 + Math.abs(Math.sin(i * 0.9)) * 65}%`,
                        opacity: 0.3 + (i % 4) * 0.15,
                        animation: `eqbar ${0.25 + (i % 5) * 0.08}s ease-in-out infinite alternate`,
                      }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}

        <div className="text-center pt-1 pb-2 flex items-center justify-center gap-2">
          <Radio className="w-3.5 h-3.5 text-muted-foreground/40"/>
          <p className="text-xs text-muted-foreground/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            إذاعات قرآنية متخصصة · بث مستمر 24/7
          </p>
        </div>
      </div>
    </div>
  );
}
