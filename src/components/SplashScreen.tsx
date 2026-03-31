import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

const OUTER_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  angle: (i / 24) * 360,
  distance: 130 + (i % 4) * 20,
  size: i % 4 === 0 ? 3.5 : i % 4 === 1 ? 2.5 : i % 4 === 2 ? 2 : 1.5,
  delay: 0.4 + i * 0.035,
  color: i % 3 === 0 ? '#FFE4B0' : i % 3 === 1 ? '#C19A6B' : '#E8D5A8',
}));

function IslamicStar({ size = 110 }: { size?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const outer = ((i * 45) - 90) * (Math.PI / 180);
    const inner = ((i * 45 + 22.5) - 90) * (Math.PI / 180);
    const OR = (size / 2) * 0.88;
    const IR = (size / 2) * 0.42;
    const cx = size / 2, cy = size / 2;
    pts.push(`${cx + OR * Math.cos(outer)},${cy + OR * Math.sin(outer)}`);
    pts.push(`${cx + IR * Math.cos(inner)},${cy + IR * Math.sin(inner)}`);
  }
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="sg1" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="35%" stopColor="#E8C97A" />
          <stop offset="70%" stopColor="#C19A6B" />
          <stop offset="100%" stopColor="#7A5030" />
        </radialGradient>
        <radialGradient id="sg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C19A6B" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#C19A6B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C19A6B" stopOpacity="0" />
        </radialGradient>
        <filter id="sf1" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000" floodOpacity="0.6" />
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#C19A6B" floodOpacity="0.4" />
        </filter>
      </defs>
      <circle cx={c} cy={c} r={size * 0.52} fill="url(#sg2)" />
      <polygon points={pts.join(' ')} fill="#2d1a08" fillOpacity="0.55" transform="translate(2,5)" />
      <polygon points={pts.join(' ')} fill="url(#sg1)" filter="url(#sf1)" />
      <polygon points={pts.join(' ')} fill="white" fillOpacity="0.1"
        clipPath={`url(#tc${size})`} />
      <defs>
        <clipPath id={`tc${size}`}>
          <rect x="0" y="0" width={size} height={size * 0.42} />
        </clipPath>
      </defs>
      <circle cx={c} cy={c} r={size * 0.15} fill="#5a3818" fillOpacity="0.7" />
      <circle cx={c} cy={c} r={size * 0.1} fill="url(#sg1)" />
      <circle cx={c * 0.87} cy={c * 0.83} r={size * 0.045} fill="white" fillOpacity="0.75" />
      <circle cx={c * 1.09} cy={c * 0.88} r={size * 0.025} fill="white" fillOpacity="0.4" />
    </svg>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-2 w-full">
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, rgba(193,154,107,0.7), transparent)', maxWidth: 80 }} />
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C19A6B', opacity: 0.7 }} />
      <svg width={16} height={16} viewBox="0 0 20 20" style={{ opacity: 0.9 }}>
        <polygon points="10,1 12.1,7.3 18.8,7.3 13.4,11.2 15.5,17.5 10,13.6 4.5,17.5 6.6,11.2 1.2,7.3 7.9,7.3"
          fill="#C19A6B" />
      </svg>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C19A6B', opacity: 0.7 }} />
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(193,154,107,0.7), transparent)', maxWidth: 80 }} />
    </div>
  );
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'star' | 'basmala' | 'name' | 'full' | 'out'>('star');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('basmala'), 700);
    const t2 = setTimeout(() => setPhase('name'), 1600);
    const t3 = setTimeout(() => setPhase('full'), 2200);
    const t4 = setTimeout(() => setPhase('out'), 4400);
    const t5 = setTimeout(() => onDone(), 5000);
    return () => { [t1,t2,t3,t4,t5].forEach(clearTimeout); };
  }, [onDone]);

  const show = phase !== 'out';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 50% 38%, #1e1408 0%, #100c05 50%, #050302 100%)',
          }}
        >
          {/* ── Ambient light layers ── */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 0.22, scale: 1 }}
              transition={{ delay: 0.15, duration: 2.2, ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{
                width: 420, height: 420,
                top: '8%', left: '50%', transform: 'translateX(-50%)',
                background: 'radial-gradient(circle, #C19A6B 0%, transparent 65%)',
                filter: 'blur(55px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'full' || phase === 'out' ? 0.12 : 0 }}
              transition={{ duration: 1.2 }}
              className="absolute rounded-full"
              style={{
                width: 300, height: 180,
                bottom: '18%', left: '50%', transform: 'translateX(-50%)',
                background: 'radial-gradient(ellipse, #E8C97A 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </div>

          {/* ── Decorative outer rings ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[380, 310, 250, 198].map((d, i) => (
              <motion.div
                key={d}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08 + i * 0.14, duration: 0.9, ease: 'easeOut' }}
                className="absolute rounded-full"
                style={{
                  width: d, height: d,
                  border: `1px solid rgba(193,154,107,${0.06 + i * 0.07})`,
                }}
              />
            ))}
          </div>

          {/* ── Floating particles ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {OUTER_PARTICLES.map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const x = Math.cos(rad) * p.distance;
              const y = Math.sin(rad) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 0.95, 0.65], scale: 1, x, y }}
                  transition={{ delay: p.delay, duration: 0.7, ease: 'easeOut' }}
                  className="absolute rounded-full"
                  style={{
                    width: p.size, height: p.size,
                    background: p.color,
                    boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                  }}
                />
              );
            })}
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="relative z-10 flex flex-col items-center gap-0" style={{ direction: 'rtl' }}>

            {/* Star */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotateY: -120 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ delay: 0.2, duration: 1.0, ease: [0.34, 1.48, 0.64, 1] }}
              style={{ perspective: 900, transformStyle: 'preserve-3d' }}
            >
              <IslamicStar size={100} />
            </motion.div>

            {/* بسم الله الرحمن الرحيم — the grand centerpiece */}
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.88 }}
              animate={{
                opacity: phase === 'basmala' || phase === 'name' || phase === 'full' ? 1 : 0,
                y: phase === 'basmala' || phase === 'name' || phase === 'full' ? 0 : 22,
                scale: phase === 'basmala' || phase === 'name' || phase === 'full' ? 1 : 0.88,
              }}
              transition={{ duration: 0.75, ease: [0.25, 0.8, 0.25, 1] }}
              className="relative mt-5 px-6 text-center"
            >
              {/* Glow behind text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'full' ? 0.35 : 0.18 }}
                transition={{ duration: 1.0 }}
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(ellipse at 50% 60%, rgba(193,154,107,0.8) 0%, transparent 70%)',
                  filter: 'blur(18px)',
                  transform: 'scaleY(0.5) translateY(40%)',
                }}
              />
              <p
                className="relative"
                style={{
                  fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
                  fontSize: 'clamp(1.7rem, 6vw, 2.2rem)',
                  lineHeight: 1.7,
                  color: '#F0DEBC',
                  textShadow: '0 0 30px rgba(193,154,107,0.7), 0 0 60px rgba(193,154,107,0.3), 0 2px 8px rgba(0,0,0,0.6)',
                  letterSpacing: '0.04em',
                }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            </motion.div>

            {/* Golden divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: phase === 'name' || phase === 'full' ? 1 : 0,
                opacity: phase === 'name' || phase === 'full' ? 1 : 0,
              }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="mt-4 w-56"
            >
              <GoldDivider />
            </motion.div>

            {/* نور — app name */}
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.8 }}
              animate={{
                opacity: phase === 'name' || phase === 'full' ? 1 : 0,
                y: phase === 'name' || phase === 'full' ? 0 : 14,
                scale: phase === 'name' || phase === 'full' ? 1 : 0.8,
              }}
              transition={{ duration: 0.65, ease: [0.34, 1.4, 0.64, 1] }}
              className="mt-3 flex flex-col items-center"
            >
              <p
                style={{
                  fontFamily: '"Amiri", "Scheherazade New", serif',
                  fontSize: '3.6rem',
                  lineHeight: 1,
                  color: '#C19A6B',
                  textShadow: '0 0 50px rgba(193,154,107,0.55), 0 0 100px rgba(193,154,107,0.2), 0 3px 10px rgba(0,0,0,0.5)',
                  letterSpacing: '0.05em',
                }}
              >
                نُـور
              </p>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'full' ? 0.55 : 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mt-4"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: '0.72rem',
                color: 'rgba(193,154,107,0.9)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              رفيقك الإسلامي الشامل
            </motion.p>
          </div>

          {/* ── Subtle corner ornaments ── */}
          {['top-4 right-4', 'top-4 left-4', 'bottom-4 right-4', 'bottom-4 left-4'].map((pos, i) => (
            <motion.svg
              key={i}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: phase === 'full' ? 0.35 : 0, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.7 }}
              className={`absolute ${pos}`}
              width={28} height={28} viewBox="0 0 28 28"
              style={{ transform: i === 1 ? 'scaleX(-1)' : i === 2 ? 'scaleY(-1)' : i === 3 ? 'scale(-1,-1)' : 'none' }}
            >
              <path
                d="M2,2 L12,2 M2,2 L2,12"
                stroke="rgba(193,154,107,0.8)" strokeWidth="1.5" strokeLinecap="round" fill="none"
              />
              <circle cx="2" cy="2" r="2" fill="rgba(193,154,107,0.6)" />
              <circle cx="2" cy="2" r="0.8" fill="rgba(255,228,176,0.9)" />
            </motion.svg>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
