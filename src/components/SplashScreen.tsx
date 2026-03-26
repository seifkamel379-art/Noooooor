import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 2800);
    const t3 = setTimeout(() => onDone(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #0d0b07 0%, #1a1308 50%, #0d0b07 100%)' }}
        >
          {/* Decorative outer ring */}
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full"
              style={{ border: '1px solid rgba(193,154,107,0.15)' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
              className="absolute w-60 h-60 rounded-full"
              style={{ border: '1px solid rgba(193,154,107,0.25)' }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full"
              style={{ border: '1px solid rgba(193,154,107,0.4)', boxShadow: '0 0 40px rgba(193,154,107,0.1)' }}
            />

            {/* Islamic star ornament SVG in center */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center"
            >
              {/* 8-pointed Islamic star */}
              <svg width="72" height="72" viewBox="0 0 100 100" className="mb-3 opacity-80">
                <g fill="#C19A6B" opacity="0.9">
                  <polygon points="50,5 61,35 93,35 68,57 77,88 50,70 23,88 32,57 7,35 39,35" />
                  <polygon points="50,5 61,35 93,35 68,57 77,88 50,70 23,88 32,57 7,35 39,35"
                    transform="rotate(36, 50, 50)" opacity="0.4" />
                </g>
                <circle cx="50" cy="50" r="12" fill="#C19A6B" opacity="0.6" />
                <circle cx="50" cy="50" r="7" fill="#1a1308" />
              </svg>

              {/* Noor title */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-6xl mb-1"
                style={{
                  fontFamily: '"Amiri", "Scheherazade New", serif',
                  color: '#C19A6B',
                  textShadow: '0 0 30px rgba(193,154,107,0.4)',
                }}
              >
                نُـور
              </motion.p>
            </motion.div>
          </div>

          {/* Basmala in Kufic-style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-10 text-center px-8"
          >
            <p
              className="text-2xl leading-loose tracking-wider"
              style={{
                fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
                color: '#d4b483',
                textShadow: '0 0 20px rgba(193,154,107,0.3)',
                letterSpacing: '0.08em',
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>

            {/* decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="mt-4 flex items-center justify-center gap-2"
            >
              <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to right, transparent, rgba(193,154,107,0.5))' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.7 }} />
              <div className="w-2 h-2 rounded-full" style={{ background: '#C19A6B' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.7 }} />
              <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to left, transparent, rgba(193,154,107,0.5))' }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="mt-3 text-xs tracking-widest"
              style={{ color: 'rgba(193,154,107,0.5)', fontFamily: '"Tajawal", sans-serif' }}
            >
              تطبيق إسلامي شامل
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
