import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

/* ─── Islamic Radio Stations ─────────────────────────────────── */
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
    OrnateIcon: () => (
      <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
        <path d="M32 4 L36.5 14 L48 10 L44 21.5 L56 26 L44 30.5 L48 42 L36.5 38 L32 48 L27.5 38 L16 42 L20 30.5 L8 26 L20 21.5 L16 10 L27.5 14 Z"
          stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08"/>
        <rect x="20" y="18" width="10" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="34" y="18" width="10" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="30" y1="18" x2="30" y2="34" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="34" y1="18" x2="34" y2="34" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="22.5" y1="22" x2="27.5" y2="22" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="22.5" y1="25" x2="27.5" y2="25" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="22.5" y1="28" x2="27.5" y2="28" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="36.5" y1="22" x2="41.5" y2="22" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="36.5" y1="25" x2="41.5" y2="25" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        <line x1="36.5" y1="28" x2="41.5" y2="28" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
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
    OrnateIcon: () => (
      <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
        <path d="M32 4 L36.5 14 L48 10 L44 21.5 L56 26 L44 30.5 L48 42 L36.5 38 L32 48 L27.5 38 L16 42 L20 30.5 L8 26 L20 21.5 L16 10 L27.5 14 Z"
          stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08"/>
        <rect x="26" y="14" width="12" height="20" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M20 30 Q20 40 32 40 Q44 40 44 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="32" y1="40" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="26" y1="44" x2="38" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="28" y1="26" x2="36" y2="26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
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
    OrnateIcon: () => (
      <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
        <path d="M32 4 L36.5 14 L48 10 L44 21.5 L56 26 L44 30.5 L48 42 L36.5 38 L32 48 L27.5 38 L16 42 L20 30.5 L8 26 L20 21.5 L16 10 L27.5 14 Z"
          stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08"/>
        <circle cx="32" cy="26" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <line x1="32" y1="12" x2="32" y2="16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="32" y1="36" x2="32" y2="40" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="18" y1="26" x2="22" y2="26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="42" y1="26" x2="46" y2="26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="32" cy="26" r="3.5" fill="currentColor"/>
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
    OrnateIcon: () => (
      <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
        <path d="M32 4 L36.5 14 L48 10 L44 21.5 L56 26 L44 30.5 L48 42 L36.5 38 L32 48 L27.5 38 L16 42 L20 30.5 L8 26 L20 21.5 L16 10 L27.5 14 Z"
          stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08"/>
        <path d="M32 13 L32 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M27 16 Q27 13 32 13 Q37 13 37 16 L37 20 Q37 23 32 23 Q27 23 27 20 Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        <rect x="22" y="29" width="20" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/>
        <path d="M27 39 L27 42 Q32 44 37 42 L37 39" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        <rect x="18" y="24" width="3" height="15" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M18 24 Q19.5 21 21 24" stroke="currentColor" strokeWidth="1" fill="none"/>
        <rect x="43" y="24" width="3" height="15" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M43 24 Q44.5 21 46 24" stroke="currentColor" strokeWidth="1" fill="none"/>
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
    OrnateIcon: () => (
      <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
        <path d="M32 4 L36.5 14 L48 10 L44 21.5 L56 26 L44 30.5 L48 42 L36.5 38 L32 48 L27.5 38 L16 42 L20 30.5 L8 26 L20 21.5 L16 10 L27.5 14 Z"
          stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08"/>
        <path d="M38 15 Q30 14 25 19 Q19 25 20 32 Q21 39 27 43 Q33 47 40 44 Q46 41 47 35 Q43 39 38 37 Q31 34 29 27 Q27 20 33 16 Q35 15 38 15Z"
          stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        <polygon points="40,15 41.5,19 45.5,19 42.5,21.5 43.5,26 40,23.5 36.5,26 37.5,21.5 34.5,19 38.5,19"
          stroke="currentColor" strokeWidth="1" fill="none"/>
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
    OrnateIcon: () => (
      <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10">
        <path d="M32 4 L36.5 14 L48 10 L44 21.5 L56 26 L44 30.5 L48 42 L36.5 38 L32 48 L27.5 38 L16 42 L20 30.5 L8 26 L20 21.5 L16 10 L27.5 14 Z"
          stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08"/>
        <path d="M32 13 Q24 13 21 20 L21 36 Q24 30 32 30 Q40 30 43 36 L43 20 Q40 13 32 13Z" stroke="currentColor" strokeWidth="1.4" fill="none"/>
        <circle cx="32" cy="22" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <path d="M25 40 Q25 36 32 35 Q39 36 39 40" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
];

type Status = 'idle' | 'loading' | 'playing' | 'error';

/* ── Animated EQ bars (playing indicator) ─────────────────────── */
function EqBars() {
  return (
    <div className="flex gap-0.5 items-end h-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i}
          className="w-1 rounded-full"
          style={{
            height: `${8 + (i % 3) * 5}px`,
            background: '#8B6010',
            animation: `eqbar ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Play / Pause / Loading circle button ─────────────────────── */
function PlayCircle({ status }: { status: Status | 'inactive' }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300"
      style={{
        borderColor: status !== 'inactive' ? '#8B6010' : '#C4A96A',
        background: status !== 'inactive' ? 'rgba(139,96,16,0.12)' : 'transparent',
      }}
    >
      {status === 'loading' ? (
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8B6010' }} />
      ) : status === 'error' ? (
        <RefreshCw className="w-5 h-5" style={{ color: '#8B6010' }} />
      ) : status === 'playing' ? (
        <svg viewBox="0 0 24 24" fill="#8B6010" className="w-5 h-5">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ marginRight: '-2px' }}>
          <path d="M8 5v14l11-7z" fill="#8B6010"/>
        </svg>
      )}
    </div>
  );
}

export function EgyptianRadio() {
  const [activeId, setActiveId]   = useState<number | null>(null);
  const [status, setStatus]       = useState<Status>('idle');
  const audioRef                  = useRef<HTMLAudioElement | null>(null);
  const retryTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    audioRef.current = a;

    const onPlaying = () => setStatus('playing');
    const onError   = () => setStatus('error');
    const onCanPlay = () => { a.play().catch(() => setStatus('error')); };

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
    if (idx >= station.urls.length) { setStatus('error'); return; }
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

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      <style>{`
        @keyframes eqbar {
          from { transform: scaleY(0.4); }
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
          <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            الإذاعات الإسلامية
          </h1>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            اختر إذاعة للاستماع
          </p>
        </div>
      </div>

      {/* Station list */}
      <div className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="flex flex-col gap-3">
          {STATIONS.map(s => {
            const isActive  = activeId === s.id;
            const stStatus: Status | 'inactive' = isActive ? status : 'inactive';
            const isPlaying = isActive && status === 'playing';

            return (
              <button
                key={s.id}
                onClick={() => toggle(s)}
                data-testid={`button-station-${s.id}`}
                className="w-full rounded-2xl text-right transition-all duration-300 active:scale-[0.98]"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #F5E8CC 0%, #EDD8A8 100%)'
                    : 'linear-gradient(135deg, #F8F0DC 0%, #F0E4C0 100%)',
                  border: `1.5px solid ${isActive ? '#B89040' : '#D4B880'}`,
                  boxShadow: isPlaying
                    ? '0 4px 20px rgba(184,144,64,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Play button — left */}
                  <PlayCircle status={stStatus} />

                  {/* Name + subtitle — center */}
                  <div className="flex-1 min-w-0 text-right">
                    <p
                      className="font-bold text-base leading-tight"
                      style={{
                        fontFamily: '"Tajawal", sans-serif',
                        color: isActive ? '#6B4A00' : '#3D2B00',
                      }}
                    >
                      {s.name}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      {isPlaying && <EqBars />}
                      <p
                        className="text-xs"
                        style={{
                          fontFamily: '"Tajawal", sans-serif',
                          color: isActive ? '#8B6010' : '#7A5A20',
                        }}
                      >
                        {s.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Ornate Islamic icon — right */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{ color: isActive ? '#8B6010' : '#A07828' }}
                  >
                    <s.OrnateIcon />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs" style={{ color: '#A09070', fontFamily: '"Tajawal", sans-serif' }}>
            إذاعات قرآنية متخصصة · بث مستمر ٢٤/٧
          </p>
        </div>
      </div>
    </div>
  );
}
