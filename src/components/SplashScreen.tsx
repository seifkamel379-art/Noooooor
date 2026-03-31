import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

/* ── Mosque entrance SVG ─────────────────────────────────────── */
function MosqueEntrance() {
  const W = 260;
  const H = 320;

  /* Pointed / ogee arch path centred in the SVG */
  const archPath = `
    M 40,${H - 10}
    L 40,160
    Q 40,80 ${W / 2},50
    Q ${W - 40},80 ${W - 40},160
    L ${W - 40},${H - 10}
  `;

  /* Small decorative rosette dots around the arch opening */
  const rosetteDots = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12;
    /* trace the arch curve parametrically */
    const x =
      t < 0.5
        ? 40 + (W / 2 - 40) * (t * 2) * (t * 2)
        : W / 2 + (W / 2 - 40) * (1 - (1 - t) * 2) ** 2 * (t > 0.75 ? -1 : 1);
    const progress = t * 2 - Math.floor(t * 2);
    const side = t <= 0.5 ? -1 : 1;
    const bx =
      t <= 0.5
        ? 40 + (W / 2 - 40) * 2 * t * 2 * t
        : W - 40 - (W / 2 - 40) * (2 * (1 - t)) ** 2;
    /* simplified: evenly on a half-ellipse */
    const angle = Math.PI - t * Math.PI;
    const rx = (W / 2 - 50);
    const ry = (H / 2 - 60);
    const cx2 = W / 2 + rx * Math.cos(angle);
    const cy2 = H / 2 - 30 + ry * Math.sin(angle) * 0.6;
    return { cx: cx2, cy: cy2 };
  });

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gold gradient for structural elements */}
        <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE4B0" />
          <stop offset="40%" stopColor="#C19A6B" />
          <stop offset="100%" stopColor="#7A5030" />
        </linearGradient>
        <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7A5030" />
          <stop offset="50%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#7A5030" />
        </linearGradient>
        {/* Glow for arch */}
        <filter id="archGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#C19A6B" floodOpacity="0.55" />
        </filter>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FFE4B0" floodOpacity="0.5" />
        </filter>
        {/* Interior arch darkness */}
        <radialGradient id="archInterior" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#1a1005" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a0703" stopOpacity="0.9" />
        </radialGradient>
        {/* Clip for interior fill */}
        <clipPath id="archClip">
          <path d={archPath} />
        </clipPath>
      </defs>

      {/* ── Interior fill (darkness of the mosque inside) */}
      <path d={archPath} fill="url(#archInterior)" />

      {/* ── Geometric tile band at the top of the arch */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={`tile-${i}`}
          x={50 + i * 18}
          y={44}
          width={14}
          height={14}
          rx={2}
          fill="none"
          stroke="rgba(193,154,107,0.5)"
          strokeWidth={0.8}
          transform={`rotate(45,${50 + i * 18 + 7},${44 + 7})`}
        />
      ))}

      {/* ── Main arch outline */}
      <path
        d={archPath}
        fill="none"
        stroke="url(#goldV)"
        strokeWidth={3.5}
        filter="url(#archGlow)"
        strokeLinejoin="round"
      />

      {/* ── Double arch (inner decorative line) */}
      <path
        d={`
          M 52,${H - 10}
          L 52,165
          Q 52,95 ${W / 2},68
          Q ${W - 52},95 ${W - 52},165
          L ${W - 52},${H - 10}
        `}
        fill="none"
        stroke="rgba(193,154,107,0.38)"
        strokeWidth={1.2}
      />

      {/* ── Left column */}
      <rect x={26} y={150} width={18} height={H - 158} rx={2}
        fill="url(#goldV)" opacity={0.9} />
      {/* column capital */}
      <rect x={22} y={146} width={26} height={8} rx={2}
        fill="url(#goldH)" />
      {/* column base */}
      <rect x={20} y={H - 18} width={30} height={10} rx={2}
        fill="url(#goldH)" />

      {/* ── Right column */}
      <rect x={W - 44} y={150} width={18} height={H - 158} rx={2}
        fill="url(#goldV)" opacity={0.9} />
      <rect x={W - 48} y={146} width={26} height={8} rx={2}
        fill="url(#goldH)" />
      <rect x={W - 50} y={H - 18} width={30} height={10} rx={2}
        fill="url(#goldH)" />

      {/* ── Keystone at arch apex */}
      <path
        d={`M ${W / 2 - 14},58 L ${W / 2},42 L ${W / 2 + 14},58 Z`}
        fill="url(#goldV)"
        filter="url(#softGlow)"
      />
      <circle cx={W / 2} cy={40} r={6} fill="#FFE4B0" opacity={0.9}
        filter="url(#softGlow)" />
      <circle cx={W / 2} cy={40} r={3} fill="#fff" opacity={0.8} />

      {/* ── Small dome above keystone */}
      <ellipse cx={W / 2} cy={20} rx={22} ry={16}
        fill="none" stroke="url(#goldH)" strokeWidth={2} />
      <path d={`M ${W / 2 - 22},20 Q ${W / 2},4 ${W / 2 + 22},20`}
        fill="url(#goldH)" opacity={0.7} />
      {/* minaret tip */}
      <line x1={W / 2} y1={4} x2={W / 2} y2={-4}
        stroke="#FFE4B0" strokeWidth={2} strokeLinecap="round" />
      <circle cx={W / 2} cy={-6} r={3} fill="#FFE4B0" opacity={0.85}
        filter="url(#softGlow)" />

      {/* ── Rosette dots tracing arch border */}
      {rosetteDots.map((d, i) => (
        <circle key={`r-${i}`} cx={d.cx} cy={d.cy} r={1.6}
          fill="#E8C97A" opacity={0.55} />
      ))}

      {/* ── Horizontal step / base platform */}
      <rect x={8} y={H - 10} width={W - 16} height={6} rx={2}
        fill="url(#goldH)" opacity={0.7} />

      {/* ── Side panel geometric ornaments */}
      {[0, 1].map(side => {
        const bx = side === 0 ? 6 : W - 34;
        return Array.from({ length: 4 }, (_, j) => (
          <rect key={`panel-${side}-${j}`}
            x={bx} y={175 + j * 32} width={28} height={22} rx={2}
            fill="none" stroke="rgba(193,154,107,0.28)" strokeWidth={0.8} />
        ));
      })}

      {/* ── نور — centred inside the arch opening */}
      <text
        x={W / 2}
        y={195}
        textAnchor="middle"
        fontFamily='"Amiri", "Scheherazade New", serif'
        fontSize={52}
        fill="#C19A6B"
        filter="url(#softGlow)"
        style={{ letterSpacing: '0.06em' }}
      >
        نُور
      </text>
    </svg>
  );
}

/* ── Splash Screen ───────────────────────────────────────────── */
export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'text' | 'full' | 'out'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 900);
    const t2 = setTimeout(() => setPhase('full'), 1700);
    const t3 = setTimeout(() => setPhase('out'), 4200);
    const t4 = setTimeout(() => onDone(), 4800);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'out' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(6px)' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, #1e1408 0%, #0f0a04 55%, #050302 100%)',
          }}
        >
          {/* Ambient gold glow behind entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.25, scale: 1 }}
            transition={{ delay: 0.2, duration: 2, ease: 'easeOut' }}
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 380,
              height: 380,
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'radial-gradient(circle, #C19A6B 0%, transparent 68%)',
              filter: 'blur(50px)',
            }}
          />

          {/* Content column */}
          <div className="relative z-10 flex flex-col items-center" style={{ direction: 'rtl' }}>

            {/* Mosque entrance */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.82 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.0, ease: [0.25, 0.8, 0.25, 1] }}
            >
              <MosqueEntrance />
            </motion.div>

            {/* Thin gold separator */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: phase === 'text' || phase === 'full' ? 1 : 0,
                opacity: phase === 'text' || phase === 'full' ? 1 : 0,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex items-center gap-2 mt-1"
            >
              <div style={{ width: 70, height: 1, background: 'linear-gradient(to left, rgba(193,154,107,0.7), transparent)' }} />
              <svg width={14} height={14} viewBox="0 0 20 20">
                <polygon points="10,1 12.1,7.3 18.8,7.3 13.4,11.2 15.5,17.5 10,13.6 4.5,17.5 6.6,11.2 1.2,7.3 7.9,7.3"
                  fill="rgba(193,154,107,0.85)" />
              </svg>
              <div style={{ width: 70, height: 1, background: 'linear-gradient(to right, rgba(193,154,107,0.7), transparent)' }} />
            </motion.div>

            {/* بسم الله الرحمن الرحيم */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{
                opacity: phase === 'text' || phase === 'full' ? 1 : 0,
                y: phase === 'text' || phase === 'full' ? 0 : 16,
              }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="mt-3 text-center"
              style={{
                fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
                fontSize: '1.55rem',
                lineHeight: 1.7,
                color: '#F0DEBC',
                textShadow:
                  '0 0 28px rgba(193,154,107,0.65), 0 0 55px rgba(193,154,107,0.25), 0 2px 8px rgba(0,0,0,0.6)',
                letterSpacing: '0.04em',
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'full' ? 0.5 : 0 }}
              transition={{ duration: 0.8 }}
              className="mt-3"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: '0.68rem',
                color: 'rgba(193,154,107,0.85)',
                letterSpacing: '0.22em',
              }}
            >
              رفيقك الإسلامي الشامل
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
