import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  angle: (i / 18) * 360,
  distance: 90 + (i % 3) * 30,
  size: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  delay: 0.3 + i * 0.04,
}));

function Islamic8Star({ size = 100 }: { size?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const outer = ((i * 45) - 90) * (Math.PI / 180);
    const inner = ((i * 45 + 22.5) - 90) * (Math.PI / 180);
    const OR = size / 2 * 0.88;
    const IR = size / 2 * 0.42;
    const cx = size / 2, cy = size / 2;
    pts.push(`${cx + OR * Math.cos(outer)},${cy + OR * Math.sin(outer)}`);
    pts.push(`${cx + IR * Math.cos(inner)},${cy + IR * Math.sin(inner)}`);
  }
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="starGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE4B0" stopOpacity="1" />
          <stop offset="45%" stopColor="#C19A6B" stopOpacity="1" />
          <stop offset="100%" stopColor="#7A5030" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C19A6B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C19A6B" stopOpacity="0" />
        </radialGradient>
        <filter id="starShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* Ambient glow */}
      <circle cx={c} cy={c} r={size * 0.48} fill="url(#starGlow)" />
      {/* Shadow */}
      <polygon points={pts.join(' ')} fill="#3d2408" fillOpacity="0.5"
        transform="translate(3,5)" />
      {/* Main star */}
      <polygon points={pts.join(' ')} fill="url(#starGrad)" filter="url(#starShadow)" />
      {/* Top highlight */}
      <polygon points={pts.join(' ')} fill="white" fillOpacity="0.12"
        clipPath={`url(#topClip${size})`} />
      <defs>
        <clipPath id={`topClip${size}`}>
          <rect x="0" y="0" width={size} height={size * 0.45} />
        </clipPath>
      </defs>
      {/* Inner gem */}
      <circle cx={c} cy={c} r={size * 0.14} fill="#7A5030" fillOpacity="0.6" />
      <circle cx={c} cy={c} r={size * 0.1} fill="url(#starGrad)" />
      <circle cx={c * 0.88} cy={c * 0.84} r={size * 0.04} fill="white" fillOpacity="0.7" />
    </svg>
  );
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'basmala' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('basmala'), 1100);
    const t3 = setTimeout(() => setPhase('out'), 3200);
    const t4 = setTimeout(() => onDone(), 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 40% 35%, #1c1306 0%, #0d0a05 55%, #060402 100%)' }}
        >
          {/* Ambient light blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.18, scale: 1 }}
              transition={{ delay: 0.2, duration: 1.5 }}
              className="absolute rounded-full"
              style={{
                width: 320, height: 320,
                top: '15%', left: '50%', transform: 'translateX(-50%)',
                background: 'radial-gradient(circle, #C19A6B 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.08 }}
              transition={{ delay: 0.8, duration: 1.2 }}
              className="absolute rounded-full"
              style={{
                width: 200, height: 200,
                bottom: '20%', right: '10%',
                background: 'radial-gradient(circle, #d4b483 0%, transparent 70%)',
                filter: 'blur(30px)',
              }}
            />
          </div>

          {/* Geometric rings */}
          <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
            {[320, 270, 220, 172].map((d, i) => (
              <motion.div
                key={d}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.7, ease: 'easeOut' }}
                className="absolute rounded-full"
                style={{
                  width: d, height: d,
                  border: `1px solid rgba(193,154,107,${0.08 + i * 0.06})`,
                  boxShadow: i === 3 ? '0 0 30px rgba(193,154,107,0.08) inset' : 'none',
                }}
              />
            ))}

            {/* Floating gold particles */}
            {PARTICLES.map(p => {
              const rad = (p.angle * Math.PI) / 180;
              const x = Math.cos(rad) * p.distance;
              const y = Math.sin(rad) * p.distance;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: [0, 0.9, 0.6], scale: 1, x, y }}
                  transition={{ delay: p.delay, duration: 0.6, ease: 'easeOut' }}
                  className="absolute rounded-full"
                  style={{
                    width: p.size, height: p.size,
                    background: p.id % 3 === 0 ? '#FFE4B0' : '#C19A6B',
                    boxShadow: `0 0 ${p.size * 2}px rgba(193,154,107,0.8)`,
                  }}
                />
              );
            })}

            {/* Central 3D star + title */}
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ delay: 0.35, duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ perspective: 800, transformStyle: 'preserve-3d' }}
              >
                <Islamic8Star size={96} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.75, duration: 0.6, ease: 'easeOut' }}
                className="mt-2 text-5xl"
                style={{
                  fontFamily: '"Amiri", "Scheherazade New", serif',
                  color: '#C19A6B',
                  textShadow: '0 0 40px rgba(193,154,107,0.5), 0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                نُـور
              </motion.p>
            </div>
          </div>

          {/* Basmala section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: phase === 'basmala' || phase === 'hold' ? 1 : 0, y: phase === 'basmala' ? 0 : 30 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="mt-6 text-center px-8 flex flex-col items-center"
          >
            {/* Basmala with glow */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: phase === 'basmala' ? 0.25 : 0, scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'radial-gradient(ellipse, rgba(193,154,107,0.6) 0%, transparent 70%)',
                  filter: 'blur(12px)',
                  transform: 'scaleY(0.4) translateY(50%)',
                }}
              />
              <motion.p
                initial={{ opacity: 0, y: 8, letterSpacing: '0.02em' }}
                animate={{
                  opacity: phase === 'basmala' ? 1 : 0,
                  y: phase === 'basmala' ? 0 : 8,
                  letterSpacing: phase === 'basmala' ? '0.06em' : '0.02em',
                }}
                transition={{ delay: 0.05, duration: 0.7 }}
                className="relative text-2xl leading-loose"
                style={{
                  fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
                  color: '#E8D5A8',
                  textShadow: '0 0 25px rgba(193,154,107,0.6), 0 1px 6px rgba(0,0,0,0.5)',
                }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </motion.p>
            </div>

            {/* Golden divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: phase === 'basmala' ? 1 : 0, opacity: phase === 'basmala' ? 1 : 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-4 flex items-center justify-center gap-2"
            >
              <div className="h-px" style={{ width: 56, background: 'linear-gradient(to left, rgba(193,154,107,0.6), transparent)' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.6 }} />
              <svg width={14} height={14} viewBox="0 0 20 20">
                <polygon
                  points="10,1 12,7 19,7 13.5,11 15.5,18 10,14 4.5,18 6.5,11 1,7 8,7"
                  fill="rgba(193,154,107,0.85)"
                />
              </svg>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.6 }} />
              <div className="h-px" style={{ width: 56, background: 'linear-gradient(to right, rgba(193,154,107,0.6), transparent)' }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'basmala' ? 0.45 : 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-3 text-xs tracking-widest"
              style={{ color: 'rgba(193,154,107,0.7)', fontFamily: '"Tajawal", sans-serif', letterSpacing: '0.18em' }}
            >
              رفيقك الإسلامي الشامل
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
