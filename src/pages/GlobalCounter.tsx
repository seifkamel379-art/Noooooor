import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function formatBigNumber(n: number): string {
  if (n >= 1_000_000_000_000) {
    return (n / 1_000_000_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' تريليون';
  }
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' مليار';
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' مليون';
  }
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

type RippleItem = { id: number; x: number; y: number };

export function GlobalCounter() {
  const [count, setCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const [pulse, setPulse] = useState(false);
  const [connected, setConnected] = useState(false);
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

    const connect = () => {
      es = new EventSource('/api/counter/stream');
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

    fetch('/api/counter')
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
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
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
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C19A6B" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Ripples */}
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

      {/* Top ornament */}
      <div className="relative z-10 mb-6">
        <svg viewBox="0 0 200 30" className="w-48" style={{ opacity: isDark ? 0.4 : 0.55 }} fill="#C19A6B">
          <polygon points="100,2 104,10 113,10 106,15 109,24 100,19 91,24 94,15 87,10 96,10" />
          <line x1="0" y1="15" x2="75" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6"/>
          <line x1="125" y1="15" x2="200" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6"/>
          <circle cx="77" cy="15" r="2" fill="#C19A6B" opacity="0.5"/>
          <circle cx="123" cy="15" r="2" fill="#C19A6B" opacity="0.5"/>
        </svg>
      </div>

      {/* Title */}
      <div className="relative z-10 text-center mb-8">
        <h1
          className="text-2xl font-bold tracking-widest"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B', letterSpacing: '0.2em' }}
        >
          العداد العالمي
        </h1>
        <p
          className="text-xs mt-1.5"
          style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.5 : 0.65 }}
        >
          مجموع تسابيح الذاكرين حول العالم
        </p>
      </div>

      {/* Main counter */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={pulse ? { scale: [1, 1.08, 1], opacity: [0.15, 0.4, 0.15] } : { scale: 1, opacity: 0.15 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              width: 280,
              height: 280,
              background: 'radial-gradient(circle, rgba(193,154,107,0.25) 0%, transparent 70%)',
            }}
          />
          <motion.div
            animate={pulse ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative flex flex-col items-center justify-center rounded-full"
            style={{
              width: 220,
              height: 220,
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

        {/* Formatted label for large numbers */}
        {count >= 1_000_000 && (
          <div className="mt-4 text-center">
            <span
              className="text-sm"
              style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.7 : 0.8 }}
            >
              ≈ {formatBigNumber(count)}
            </span>
          </div>
        )}
      </div>

      {/* Active users */}
      <div className="relative z-10 flex flex-col items-center gap-1 mb-8">
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
          <span
            className="text-sm font-bold"
            style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}
          >
            الذاكرون الآن
          </span>
          <span
            className="text-lg font-black"
            style={{ color: numberColor, fontFamily: '"Tajawal", sans-serif' }}
          >
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
      <div className="relative z-10">
        <svg
          viewBox="0 0 200 30"
          className="w-48"
          style={{ opacity: isDark ? 0.4 : 0.55, transform: 'scaleY(-1)' }}
          fill="#C19A6B"
        >
          <polygon points="100,2 104,10 113,10 106,15 109,24 100,19 91,24 94,15 87,10 96,10" />
          <line x1="0" y1="15" x2="75" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6"/>
          <line x1="125" y1="15" x2="200" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6"/>
          <circle cx="77" cy="15" r="2" fill="#C19A6B" opacity="0.5"/>
          <circle cx="123" cy="15" r="2" fill="#C19A6B" opacity="0.5"/>
        </svg>
      </div>

      {/* Inspiration text */}
      <div className="relative z-10 mt-6 px-10 text-center">
        <p
          className="text-xs leading-relaxed"
          style={{ color: '#C19A6B', fontFamily: '"Amiri", serif', opacity: isDark ? 0.3 : 0.45 }}
        >
          وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُم مَّغْفِرَةً وَأَجْرًا عَظِيمًا
        </p>
      </div>

      <div className="h-20" />
    </div>
  );
}
