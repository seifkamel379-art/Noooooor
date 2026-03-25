import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePrayerTimes } from '@/hooks/use-api';
import { ADHAN_RECITERS, PRAYER_MESSAGES, PRAYER_NAMES_AR } from '@/lib/constants';

const PRAYERS_TO_NOTIFY = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const PRAYER_SVG_ICONS: Record<string, React.ReactNode> = {
  Fajr: (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <circle cx="40" cy="55" r="20" fill="#C19A6B" opacity={0.3}/>
      <circle cx="40" cy="55" r="14" fill="#C19A6B" opacity={0.6}/>
      <path d="M40 10 Q55 30 40 55 Q25 30 40 10Z" fill="#C19A6B" opacity={0.8}/>
      {[0,30,60,90,120,150,210,240,270,300,330].map((deg, i) => (
        <line key={i} x1="40" y1="40"
          x2={40 + 35 * Math.cos((deg - 90) * Math.PI / 180)}
          y2={40 + 35 * Math.sin((deg - 90) * Math.PI / 180)}
          stroke="#C19A6B" strokeWidth="1" opacity={0.25}
        />
      ))}
    </svg>
  ),
  Dhuhr: (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <circle cx="40" cy="40" r="16" fill="#C19A6B" opacity={0.8}/>
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i}
          x1={40 + 20 * Math.cos(deg * Math.PI / 180)}
          y1={40 + 20 * Math.sin(deg * Math.PI / 180)}
          x2={40 + 30 * Math.cos(deg * Math.PI / 180)}
          y2={40 + 30 * Math.sin(deg * Math.PI / 180)}
          stroke="#C19A6B" strokeWidth="2.5" strokeLinecap="round" opacity={0.7}
        />
      ))}
    </svg>
  ),
  Asr: (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <circle cx="40" cy="45" r="15" fill="#C19A6B" opacity={0.6}/>
      <path d="M10 55 Q25 20 40 45 Q55 20 70 55" stroke="#C19A6B" strokeWidth="2" fill="none" opacity={0.5}/>
      <ellipse cx="40" cy="68" rx="28" ry="5" fill="#C19A6B" opacity={0.15}/>
    </svg>
  ),
  Maghrib: (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <path d="M40 20 C20 20 10 40 20 58 L60 58 C70 40 60 20 40 20Z" fill="#C19A6B" opacity={0.4}/>
      <circle cx="40" cy="42" r="12" fill="#C19A6B" opacity={0.8}/>
      <line x1="12" y1="62" x2="68" y2="62" stroke="#C19A6B" strokeWidth="2" strokeLinecap="round" opacity={0.6}/>
    </svg>
  ),
  Isha: (
    <svg viewBox="0 0 80 80" className="w-16 h-16" fill="none">
      <path d="M55 20 A20 20 0 1 1 20 50 A15 15 0 0 0 55 20Z" fill="#C19A6B" opacity={0.8}/>
      {[[25,18],[62,30],[70,55],[55,68],[18,62]].map(([x,y],i) => (
        <polygon key={i} points={`${x},${(y??0)-3} ${(x??0)+1},${(y??0)+1} ${(x??0)-3},${(y??0)+2}`} fill="#C19A6B" opacity={0.5}/>
      ))}
    </svg>
  ),
};

interface AdhanModalProps {
  prayer: string;
  onClose: () => void;
}

function AdhanModal({ prayer, onClose }: AdhanModalProps) {
  const prayerAr = PRAYER_NAMES_AR[prayer] ?? prayer;
  const icon = PRAYER_SVG_ICONS[prayer] ?? PRAYER_SVG_ICONS['Dhuhr'];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-300">
        <div
          className="absolute inset-0 rounded-3xl"
          style={{ background: 'radial-gradient(ellipse at top, #1a1200, #0d0900)', border: '1px solid rgba(193,154,107,0.3)' }}
        />
        <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: '0 0 60px rgba(193,154,107,0.15), inset 0 1px 0 rgba(193,154,107,0.2)' }} />

        <div className="relative z-10 p-8 text-center">
          {/* Decorative top */}
          <div className="flex items-center gap-2 justify-center mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#C19A6B]/50" />
            <span className="text-[#C19A6B] text-xs tracking-[0.3em]" style={{ fontFamily: '"Tajawal", sans-serif' }}>أذان</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#C19A6B]/50" />
          </div>

          {/* Prayer SVG icon instead of emoji */}
          <div className="flex justify-center mb-3">{icon}</div>

          {/* Mosque SVG */}
          <svg viewBox="0 0 200 80" className="w-40 mx-auto mb-4 opacity-60">
            <path d="M10 70 L10 40 Q30 10 50 40 L50 70Z" fill="#C19A6B" opacity={0.4}/>
            <path d="M50 70 L50 30 L80 30 L80 70Z" fill="#C19A6B" opacity={0.5}/>
            <path d="M80 70 L80 20 Q100 -5 120 20 L120 70Z" fill="#C19A6B" opacity={0.8}/>
            <path d="M120 70 L120 30 L150 30 L150 70Z" fill="#C19A6B" opacity={0.5}/>
            <path d="M150 70 L150 40 Q170 10 190 40 L190 70Z" fill="#C19A6B" opacity={0.4}/>
            <rect x={0} y={70} width={200} height={4} fill="#C19A6B" opacity={0.6} rx={2}/>
            <circle cx={100} cy={-8} r={4} fill="#C19A6B"/>
            <rect x={98} y={-20} width={4} height={12} fill="#C19A6B"/>
            <path d="M94 -22 Q100 -28 106 -22 Z" fill="#C19A6B"/>
          </svg>

          <h2
            className="text-4xl text-[#C19A6B] mb-2"
            style={{ fontFamily: '"Amiri Quran", "Amiri", serif', textShadow: '0 0 20px rgba(193,154,107,0.5)' }}
          >
            صلاة {prayerAr}
          </h2>
          <p className="text-white/60 text-sm mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>حيَّ على الصلاة حيَّ على الفلاح</p>
          <p className="text-white/40 text-xs mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>اللهم رب هذه الدعوة التامة والصلاة القائمة</p>

          <div className="flex items-center gap-2 justify-center mb-5">
            <div className="flex-1 h-px bg-[#C19A6B]/20" />
            <svg width="20" height="20" viewBox="0 0 40 40" fill="#C19A6B" opacity={0.5}>
              <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14"/>
            </svg>
            <div className="flex-1 h-px bg-[#C19A6B]/20" />
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #a07a4a)',
              color: '#000',
              boxShadow: '0 4px 20px rgba(193,154,107,0.3)',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsManager() {
  const [pref] = useLocalStorage<'off' | 'text' | 'adhan'>('notification_pref', 'adhan');
  const [reciterId] = useLocalStorage<string>('adhan_reciter', 'azan1');
  const [adhanPrayer, setAdhanPrayer] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedToday = useRef<Set<string>>(new Set());

  const userProfile = (() => {
    try { return JSON.parse(localStorage.getItem('user_profile') ?? '{}'); } catch { return {}; }
  })();
  const lat = userProfile.lat ?? null;
  const lng = userProfile.lng ?? null;

  const { data: prayerResult } = usePrayerTimes(lat, lng, 0);
  const prayerTimes = prayerResult?.timings;


  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
    }
    const reciter = ADHAN_RECITERS.find(r => r.id === reciterId) ?? ADHAN_RECITERS[0];
    audioRef.current.src = reciter.url;
  }, [reciterId]);

  const fireAdhan = useCallback((prayer: string) => {
    const prayerAr = PRAYER_NAMES_AR[prayer] ?? prayer;

    if (pref === 'adhan') {
      setAdhanPrayer(prayer);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`أذان صلاة ${prayerAr}`, {
            body: 'حيَّ على الصلاة حيَّ على الفلاح',
            tag: `prayer-${prayer}`,
            requireInteraction: true,
          });
        } catch {}
      }
    } else if (pref === 'text') {
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`حان وقت أذان صلاة ${prayerAr}`, {
            body: `حان موعد صلاة ${prayerAr}`,
            tag: `prayer-${prayer}`,
            requireInteraction: true,
          });
        } catch {}
      }
    }
  }, [pref]);

  // Helper to send prayer data to service worker
  const sendToSW = useCallback(() => {
    if (!navigator.serviceWorker?.controller || !prayerTimes) return;
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_PRAYER_DATA',
        data: { prayerTimes, notifPref: pref, adhanReciterId: reciterId },
      });
    } catch {}
  }, [prayerTimes, pref, reciterId]);

  // Send to SW whenever prayer data or pref changes
  useEffect(() => { sendToSW(); }, [sendToSW]);

  // Listen for REQUEST_PRAYER_DATA from SW (e.g. after SW restarts)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'REQUEST_PRAYER_DATA') sendToSW();
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, [sendToSW]);

  // Precise in-app scheduling — schedule exactly at each prayer time
  useEffect(() => {
    if (pref === 'off' || !prayerTimes) return;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();
    const dateStr = new Date().toDateString();

    PRAYERS_TO_NOTIFY.forEach(prayer => {
      const timeStr = prayerTimes[prayer];
      if (!timeStr) return;
      const [hh, mm] = timeStr.substring(0, 5).split(':').map(Number);
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      const delay = target.getTime() - now;
      const key = `${dateStr}-${prayer}`;

      if (delay > 0 && delay < 86400000) {
        timeouts.push(setTimeout(() => {
          if (!playedToday.current.has(key)) {
            playedToday.current.add(key);
            fireAdhan(prayer);
          }
        }, delay));
      } else if (delay > -60000 && delay <= 0) {
        // Within the current minute window — fire immediately if not played
        if (!playedToday.current.has(key)) {
          playedToday.current.add(key);
          fireAdhan(prayer);
        }
      }
    });

    return () => timeouts.forEach(id => clearTimeout(id));
  }, [pref, prayerTimes, fireAdhan]);

  if (!adhanPrayer) return null;
  return (
    <AdhanModal
      prayer={adhanPrayer}
      onClose={() => {
        setAdhanPrayer(null);
        audioRef.current?.pause();
      }}
    />
  );
}
