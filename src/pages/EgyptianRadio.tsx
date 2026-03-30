import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';

/* ─── Islamic Geometric Background ───────────────────────────── */
function IslamicBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06, zIndex: 0 }}>
      <defs>
        <pattern id="radioTile" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
          <path d="M45 6 L50 22 L66 18 L61 34 L77 39 L61 44 L66 60 L50 56 L45 72 L40 56 L24 60 L29 44 L13 39 L29 34 L24 18 L40 22 Z"
            fill="none" stroke="#C8991A" strokeWidth="0.8"/>
          <circle cx="45" cy="45" r="10" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <rect x="38" y="38" width="14" height="14" transform="rotate(45 45 45)" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="45" cy="45" r="2.5" fill="#C8991A" opacity="0.4"/>
          <line x1="45" y1="0" x2="45" y2="90" stroke="#C8991A" strokeWidth="0.3" opacity="0.3"/>
          <line x1="0" y1="45" x2="90" y2="45" stroke="#C8991A" strokeWidth="0.3" opacity="0.3"/>
          <circle cx="0"  cy="0"  r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="90" cy="0"  r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="0"  cy="90" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="90" cy="90" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#radioTile)"/>
    </svg>
  );
}

/* ─── Ornate Islamic Star Frame for Icons ─────────────────────
   An intricate 12-pointed star mandala border that wraps any icon.
─────────────────────────────────────────────────────────────── */
function OrnateStarFrame({ children, active }: { children: React.ReactNode; active?: boolean }) {
  const c  = 32; // center
  const col = active ? '#7a5200' : '#8B6010';
  const colLight = active ? '#C8991A' : '#A07828';

  /* Points for a 12-pointed star */
  const star12 = (cx: number, cy: number, r1: number, r2: number) => {
    return Array.from({ length: 24 }, (_, i) => {
      const r   = i % 2 === 0 ? r1 : r2;
      const ang = (i * 15 - 90) * (Math.PI / 180);
      return `${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`;
    }).join(' ');
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: 58, height: 58 }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full" fill="none">
        {/* Outer 12-pointed star */}
        <polygon points={star12(c, c, 30, 20)} stroke={col} strokeWidth="1" fill={col} fillOpacity="0.06"/>

        {/* Inner 8-pointed star */}
        <polygon
          points="32,10 35.5,21 46.5,18 43,29 54,32.5 43,36 46.5,47 35.5,43.5 32,54 28.5,43.5 17.5,47 21,36 10,32.5 21,29 17.5,18 28.5,21"
          stroke={colLight} strokeWidth="0.9" fill="none" opacity="0.7"/>

        {/* Outer ring */}
        <circle cx={c} cy={c} r="30" stroke={col} strokeWidth="1.2" fill="none" opacity="0.9"/>

        {/* Inner ring */}
        <circle cx={c} cy={c} r="22" stroke={col} strokeWidth="0.7" fill="none" opacity="0.6"/>

        {/* Small diamonds at cardinal points */}
        {[0, 90, 180, 270].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const x = c + 30 * Math.cos(rad - Math.PI / 2);
          const y = c + 30 * Math.sin(rad - Math.PI / 2);
          return (
            <rect key={deg}
              x={x - 3} y={y - 3} width="6" height="6"
              transform={`rotate(45 ${x} ${y})`}
              fill={colLight} opacity="0.85"/>
          );
        })}

        {/* Small circles at 45° points */}
        {[45, 135, 225, 315].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const x = c + 30 * Math.cos(rad - Math.PI / 2);
          const y = c + 30 * Math.sin(rad - Math.PI / 2);
          return <circle key={deg} cx={x} cy={y} r="2.2" fill={col} opacity="0.7"/>;
        })}

        {/* Decorative arcs between points */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const x = c + 26 * Math.cos(rad - Math.PI / 2);
          const y = c + 26 * Math.sin(rad - Math.PI / 2);
          return <circle key={deg} cx={x} cy={y} r="1" fill={col} opacity="0.5"/>;
        })}
      </svg>

      {/* Icon centered inside */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: col }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Radio Station Icons ─────────────────────────────────────── */
const QuranIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
    <rect x="4" y="4" width="9" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <rect x="15" y="4" width="9" height="14" rx="1" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <line x1="4" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <line x1="4" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <line x1="4" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <line x1="15" y1="7" x2="24" y2="7" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <line x1="15" y1="10" x2="24" y2="10" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <line x1="15" y1="13" x2="24" y2="13" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <path d="M13 4 Q14 6 15 4" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

const MicIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
    <rect x="10" y="4" width="8" height="13" rx="4" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <path d="M6 16 Q6 23 14 23 Q22 23 22 16" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <line x1="14" y1="23" x2="14" y2="26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="10" y1="26" x2="18" y2="26" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
    <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <circle cx="14" cy="14" r="2" fill="currentColor"/>
    <line x1="14" y1="4" x2="14" y2="7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="14" y1="21" x2="14" y2="24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="4" y1="14" x2="7" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="21" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="7.5" y1="7.5" x2="9.6" y2="9.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="18.4" y1="18.4" x2="20.5" y2="20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="20.5" y1="7.5" x2="18.4" y2="9.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="9.6" y1="18.4" x2="7.5" y2="20.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const MosqueIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
    <path d="M14 4 Q10 4 8 8 L8 18 L20 18 L20 8 Q18 4 14 4Z" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <circle cx="14" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.1" fill="none"/>
    <rect x="10" y="18" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <line x1="4" y1="24" x2="24" y2="24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="4" y1="18" x2="8" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="20" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const MoonStarIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
    <path d="M20 14 Q16 13 14 9 Q12 14 14 19 Q18 22 22 20 Q19 20 17 18 Q18 16 20 14Z"
      stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <polygon points="22,5 23,8 26,8 23.5,10 24.5,13 22,11 19.5,13 20.5,10 18,8 21,8"
      stroke="currentColor" strokeWidth="0.8" fill="none"/>
  </svg>
);

const KaabaRadioIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
    <polygon points="8,12 14,8 20,12 20,22 14,24 8,22" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <polygon points="8,12 14,8 14,14 8,18" stroke="currentColor" strokeWidth="0.5" fill="currentColor" fillOpacity="0.08"/>
    <line x1="8" y1="15" x2="20" y2="15" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <line x1="8" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
    <rect x="11" y="18" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);

/* ─── Station Data ────────────────────────────────────────────── */
const STATIONS = [
  {
    id: 1, name: 'إذاعة القرآن الكريم', subtitle: 'الإذاعة المصرية · بث مباشر',
    urls: [
      'https://stream.radiojar.com/8s5u5tpdtwzuv',
      'https://Qurango.net/radio/quranegypt',
      'https://radio.mp3islam.com/listen/quran_radio/radio.mp3',
    ],
    Icon: QuranIcon,
  },
  {
    id: 2, name: 'ماهر المعيقلي', subtitle: 'تلاوات خاشعة · بث مستمر',
    urls: [
      'https://stream.zeno.fm/xqcd0h4fp9zuv',
      'https://Qurango.net/radio/maher',
      'https://radio.mp3islam.com/listen/maher/radio.mp3',
    ],
    Icon: MicIcon,
  },
  {
    id: 3, name: 'مشاري العفاسي', subtitle: 'تلاوات وأناشيد · بث مستمر',
    urls: [
      'https://stream.zeno.fm/ud3z16g0hkquv',
      'https://Qurango.net/radio/mishary',
      'https://radio.mp3islam.com/listen/mishary/radio.mp3',
    ],
    Icon: SunIcon,
  },
  {
    id: 4, name: 'محمد صديق المنشاوي', subtitle: 'تلاوات كلاسيكية · بث مستمر',
    urls: [
      'https://Qurango.net/radio/minshawi',
      'https://radio.mp3islam.com/listen/minshawi/radio.mp3',
    ],
    Icon: MosqueIcon,
  },
  {
    id: 5, name: 'ياسر الدوسري', subtitle: 'تلاوات مؤثرة · بث مستمر',
    urls: [
      'https://Qurango.net/radio/yasser',
      'https://radio.mp3islam.com/listen/yaser/radio.mp3',
    ],
    Icon: MoonStarIcon,
  },
  {
    id: 6, name: 'إذاعة مكة المكرمة', subtitle: 'بث مباشر من الحرم المكي',
    urls: [
      'https://edge.mixlr.com/channel/rwumx',
      'https://stream.radiojar.com/0tpy1h0kxtzuv',
      'https://qurango.net/radio/mix',
    ],
    Icon: KaabaRadioIcon,
  },
];

type Status = 'idle' | 'loading' | 'playing' | 'error';

/* ── Animated EQ bars ─────────────────────────────────────────── */
function EqBars() {
  return (
    <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-1 rounded-full" style={{
          height: `${8 + (i % 3) * 5}px`,
          background: '#7a5200',
          animation: `eqbar ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
        }}/>
      ))}
    </div>
  );
}

/* ── Physical-style play/pause button ──────────────────────────── */
function PhysicalPlayBtn({ status }: { status: Status | 'inactive' }) {
  const isActive = status !== 'inactive';
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
      style={{
        background: isActive ? '#d4c4a0' : '#e0d0b0',
        boxShadow: isActive
          ? 'inset 3px 3px 7px rgba(120,90,30,0.35), inset -2px -2px 5px rgba(255,245,220,0.6)'
          : '3px 3px 8px rgba(120,90,30,0.3), -2px -2px 6px rgba(255,248,230,0.75)',
      }}>
      {status === 'loading' ? (
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#5a3d00' }}/>
      ) : status === 'error' ? (
        <RefreshCw className="w-5 h-5" style={{ color: '#5a3d00' }}/>
      ) : status === 'playing' ? (
        <svg viewBox="0 0 24 24" fill="#4a2e00" className="w-5 h-5">
          <rect x="6" y="5" width="4" height="14" rx="1"/>
          <rect x="14" y="5" width="4" height="14" rx="1"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5" style={{ marginRight: '-2px' }}>
          <path d="M8 5v14l11-7z" fill="#4a2e00"/>
        </svg>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export function EgyptianRadio() {
  const [activeId, setActiveId]   = useState<number | null>(null);
  const [status,   setStatus]     = useState<Status>('idle');
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
    <div className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden" dir="rtl"
      style={{ background: 'linear-gradient(180deg, #121b10 0%, #0c1309 50%, #080e06 100%)' }}>

      <style>{`
        @keyframes eqbar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>

      {/* Islamic background watermark */}
      <IslamicBg/>

      {/* Header */}
      <div className="relative z-10 px-4 py-4 flex items-center gap-4 flex-shrink-0 border-b"
        style={{ background: 'rgba(0,0,0,0.35)', borderColor: 'rgba(200,153,26,0.2)' }}>
        <Link href="/more">
          <button className="p-2 rounded-full" style={{ background: 'rgba(200,153,26,0.15)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#C8991A' }}/>
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
            الإذاعات الإسلامية
          </h1>
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: '#7a6030' }}>
            اختر إذاعة للاستماع
          </p>
        </div>
      </div>

      {/* Station list */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 pb-8">
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
                className="w-full rounded-2xl text-right transition-all duration-200 active:scale-[0.985]"
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #e8d8b0 0%, #d4c090 100%)'
                    : 'linear-gradient(135deg, #ede0c0 0%, #ddd0a8 100%)',
                  boxShadow: isActive
                    ? '5px 5px 12px rgba(100,72,20,0.28), -3px -3px 9px rgba(255,248,224,0.65), inset 0 1px 0 rgba(255,252,240,0.4)'
                    : '6px 6px 14px rgba(100,72,20,0.22), -4px -4px 10px rgba(255,248,224,0.7), inset 0 1px 0 rgba(255,252,240,0.5)',
                  border: 'none',
                  outline: isActive ? '1.5px solid rgba(200,153,26,0.5)' : 'none',
                }}
              >
                <div className="flex items-center gap-3 p-3.5">

                  {/* Physical play button — left */}
                  <PhysicalPlayBtn status={stStatus}/>

                  {/* Name + subtitle — center */}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="font-bold text-base leading-tight" style={{
                      fontFamily: '"Tajawal", sans-serif',
                      color: isActive ? '#3d2000' : '#2a1800',
                    }}>
                      {s.name}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-0.5">
                      {isPlaying && <EqBars/>}
                      <p className="text-xs" style={{
                        fontFamily: '"Tajawal", sans-serif',
                        color: isActive ? '#6B4A00' : '#7A5A20',
                      }}>
                        {s.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Ornate star frame icon — right */}
                  <OrnateStarFrame active={isActive}>
                    <s.Icon/>
                  </OrnateStarFrame>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs" style={{ color: '#5a4820', fontFamily: '"Tajawal", sans-serif' }}>
            إذاعات قرآنية متخصصة · بث مستمر ٢٤/٧
          </p>
        </div>
      </div>
    </div>
  );
}
