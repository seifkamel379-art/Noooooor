import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Play, Pause, ChevronDown, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SURAH_NAMES } from '@/lib/constants';
import { useAudio } from '@/contexts/AudioContext';

const SURAH_AYAH_COUNT: Record<number, number> = {
  1:7,2:286,3:200,4:176,5:120,6:165,7:206,8:75,9:129,10:109,11:123,12:111,13:43,14:52,15:99,
  16:128,17:111,18:110,19:98,20:135,21:112,22:78,23:118,24:64,25:77,26:227,27:93,28:88,29:69,
  30:60,31:34,32:30,33:73,34:54,35:45,36:83,37:182,38:88,39:75,40:85,41:54,42:53,43:89,44:59,
  45:37,46:35,47:38,48:29,49:18,50:45,51:60,52:49,53:62,54:55,55:78,56:96,57:29,58:22,59:24,
  60:13,61:14,62:11,63:11,64:18,65:12,66:12,67:30,68:52,69:52,70:44,71:28,72:28,73:20,74:56,
  75:40,76:31,77:50,78:40,79:46,80:42,81:29,82:19,83:36,84:25,85:22,86:17,87:19,88:26,89:30,
  90:20,91:15,92:21,93:11,94:8,95:8,96:19,97:5,98:8,99:8,100:11,101:11,102:8,103:3,104:9,
  105:5,106:4,107:7,108:3,109:6,110:3,111:5,112:4,113:5,114:6,
};

interface Reciter {
  id: string;
  name: string;
  shortName: string;
  initial: string;
  folder: string;
  country: string;
  flag: string;
  grad: string;
  accent: string;
}

const RECITERS: Reciter[] = [
  {
    id: 'alafasy',
    name: 'مشاري راشد العفاسي',
    shortName: 'العفاسي',
    initial: 'ع',
    folder: 'Alafasy_128kbps',
    country: 'الكويت',
    flag: 'kw',
    grad: 'linear-gradient(145deg, #1a5c5c 0%, #0d3b3b 100%)',
    accent: '#5fb8b8',
  },
  {
    id: 'maher',
    name: 'ماهر المعيقلي',
    shortName: 'المعيقلي',
    initial: 'م',
    folder: 'MaherAlMuaiqly128kbps',
    country: 'السعودية',
    flag: 'sa',
    grad: 'linear-gradient(145deg, #6b3a0f 0%, #3d2008 100%)',
    accent: '#d49a5e',
  },
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    shortName: 'السديس',
    initial: 'س',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
    country: 'السعودية',
    flag: 'sa',
    grad: 'linear-gradient(145deg, #1e4d7b 0%, #0f2d4d 100%)',
    accent: '#5e9bd4',
  },
  {
    id: 'husary',
    name: 'محمود خليل الحصري',
    shortName: 'الحصري',
    initial: 'ح',
    folder: 'Husary_128kbps',
    country: 'مصر',
    flag: 'eg',
    grad: 'linear-gradient(145deg, #7a3a1e 0%, #4d2310 100%)',
    accent: '#e89968',
  },
  {
    id: 'abdulbasit',
    name: 'عبد الباسط عبد الصمد',
    shortName: 'عبد الباسط',
    initial: 'ب',
    folder: 'Abdul_Basit_Murattal_192kbps',
    country: 'مصر',
    flag: 'eg',
    grad: 'linear-gradient(145deg, #5c3a7a 0%, #3a1f52 100%)',
    accent: '#b59ad8',
  },
  {
    id: 'ghamdi',
    name: 'سعد الغامدي',
    shortName: 'الغامدي',
    initial: 'غ',
    folder: 'Ghamadi_40kbps',
    country: 'السعودية',
    flag: 'sa',
    grad: 'linear-gradient(145deg, #2d6a4f 0%, #1b4332 100%)',
    accent: '#6cc09a',
  },
  {
    id: 'dosari',
    name: 'ياسر الدوسري',
    shortName: 'الدوسري',
    initial: 'د',
    folder: 'Yasser_Ad-Dussary_128kbps',
    country: 'السعودية',
    flag: 'sa',
    grad: 'linear-gradient(145deg, #0f3d2e 0%, #072218 100%)',
    accent: '#5fc098',
  },
  {
    id: 'qatami',
    name: 'ناصر القطامي',
    shortName: 'القطامي',
    initial: 'ق',
    folder: 'Nasser_Alqatami_128kbps',
    country: 'السعودية',
    flag: 'sa',
    grad: 'linear-gradient(145deg, #3a1a5c 0%, #1e0d30 100%)',
    accent: '#a285d4',
  },
  {
    id: 'hudhaify',
    name: 'علي الحذيفي',
    shortName: 'الحذيفي',
    initial: 'ذ',
    folder: 'Hudhaify_128kbps',
    country: 'السعودية',
    flag: 'sa',
    grad: 'linear-gradient(145deg, #8B6340 0%, #5c3e1e 100%)',
    accent: '#d4ad7d',
  },
];

type Phase = 'reciters' | 'range' | 'compare';

const ayahUrl = (folder: string, surah: number, ayah: number) =>
  `https://everyayah.com/data/${folder}/${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;

/* ───────────── Decorative pattern ───────────── */
function PatternBg() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="vc-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <polygon points="10,2 12,8 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,8" fill="white" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#vc-pattern)" />
    </svg>
  );
}

/* ───────────── Surah picker bottom sheet ───────────── */
function SurahPickerSheet({
  selected, onSelect, onClose,
}: { selected: number; onSelect: (s: number) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const list = Array.from({ length: 114 }, (_, i) => i + 1).filter(n =>
    !search || SURAH_NAMES[n]?.includes(search) || String(n).includes(search)
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl pt-4 shadow-2xl"
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3" />
        <div className="px-5 pb-3">
          <h3 className="font-bold text-base mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>اختر السورة</h3>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث..." dir="rtl"
            className="w-full bg-secondary border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <div className="space-y-1.5">
            {list.map(n => (
              <button
                key={n} onClick={() => { onSelect(n); onClose(); }}
                data-testid={`surah-option-${n}`}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${
                  selected === n ? 'bg-primary/15 border border-primary/30' : 'hover:bg-secondary/60 border border-transparent'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {n}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ fontFamily: '"Amiri", serif' }}>{SURAH_NAMES[n]}</p>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    {SURAH_AYAH_COUNT[n]} آية
                  </p>
                </div>
                {selected === n && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────── Number stepper ───────────── */
function Stepper({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (v: number) => void; label: string;
}) {
  return (
    <div className="bg-secondary/50 border border-border rounded-2xl p-3 flex-1">
      <p className="text-[11px] text-muted-foreground mb-1.5 font-medium" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        {label}
      </p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          data-testid={`stepper-dec-${label}`}
          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center font-bold text-foreground disabled:opacity-30 transition-all active:scale-95"
        >−</button>
        <input
          type="number" value={value} min={min} max={max}
          onChange={e => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          data-testid={`stepper-input-${label}`}
          className="flex-1 bg-transparent text-center font-bold text-lg outline-none"
          style={{ fontFamily: '"Tajawal", sans-serif', fontVariantNumeric: 'tabular-nums' }}
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          data-testid={`stepper-inc-${label}`}
          className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center font-bold text-foreground disabled:opacity-30 transition-all active:scale-95"
        >+</button>
      </div>
    </div>
  );
}

/* ───────────── Comparison Card ───────────── */
function ComparisonCard({
  reciter, surahNum, fromAyah, toAyah,
  isActive, isLoading, currentAyah, progress,
  onPlay, onPause,
  cardCount,
}: {
  reciter: Reciter;
  surahNum: number; fromAyah: number; toAyah: number;
  isActive: boolean; isLoading: boolean;
  currentAyah: number | null; progress: number;
  onPlay: () => void; onPause: () => void;
  cardCount: 2 | 3;
}) {
  const totalAyahs = toAyah - fromAyah + 1;
  const completedInRange = currentAyah ? currentAyah - fromAyah : 0;
  const isPlaying = isActive && !isLoading;

  return (
    <motion.div
      layout
      animate={isActive ? { scale: 1, boxShadow: `0 0 0 2px ${reciter.accent}, 0 12px 40px ${reciter.accent}55` } : { scale: 1, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="relative rounded-3xl overflow-hidden bg-card border border-border flex flex-col"
      style={{ minHeight: cardCount === 2 ? 320 : 300 }}
      data-testid={`card-reciter-${reciter.id}`}
    >
      {/* Decorative top: gradient + initial + pattern, fades into card body */}
      <div
        className="relative flex-shrink-0"
        style={{ height: cardCount === 2 ? 170 : 150, background: reciter.grad }}
      >
        <PatternBg />
        {/* Subtle radial light */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />

        {/* Country pill */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10">
          <img
            src={`https://flagcdn.com/w40/${reciter.flag}.png`}
            alt={reciter.country}
            className="w-3.5 h-2.5 rounded-sm object-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="text-[9px] text-white/85 font-medium" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {reciter.country}
          </span>
        </div>

        {/* Calligraphic initial */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={isPlaying ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Decorative ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: cardCount === 2 ? 100 : 84, height: cardCount === 2 ? 100 : 84,
                border: `2px dashed ${reciter.accent}`, opacity: 0.4,
                transform: 'scale(1.15)',
              }}
            />
            <div
              className="rounded-full flex items-center justify-center backdrop-blur-sm"
              style={{
                width: cardCount === 2 ? 100 : 84, height: cardCount === 2 ? 100 : 84,
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                boxShadow: `0 8px 32px ${reciter.accent}66, inset 0 0 24px rgba(255,255,255,0.08)`,
              }}
            >
              <span
                className="font-bold leading-none"
                style={{
                  fontFamily: '"Amiri", serif',
                  fontSize: cardCount === 2 ? 56 : 48,
                  color: '#fff',
                  textShadow: `0 2px 12px ${reciter.accent}99, 0 0 24px rgba(255,255,255,0.3)`,
                }}
              >
                {reciter.initial}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Bottom fade into the card body */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '55%',
            background: 'linear-gradient(to bottom, transparent 0%, hsl(var(--card)) 100%)',
          }}
        />
      </div>

      {/* Body: info + play */}
      <div className="flex-1 flex flex-col px-3 pt-1 pb-3 -mt-2 relative z-10">
        <div className="text-center mb-2">
          <p
            className="font-bold leading-tight text-foreground truncate"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              fontSize: cardCount === 2 ? 14 : 12,
            }}
            data-testid={`text-reciter-name-${reciter.id}`}
          >
            {cardCount === 2 ? reciter.name : reciter.shortName}
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <p
              className="text-muted-foreground"
              style={{
                fontFamily: '"Amiri", serif',
                fontSize: cardCount === 2 ? 13 : 11,
              }}
            >
              {SURAH_NAMES[surahNum]}
            </p>
            <span className="text-muted-foreground/50 text-[10px]">•</span>
            <p
              className="text-muted-foreground"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: cardCount === 2 ? 11 : 10,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalAyahs} آية
            </p>
          </div>
        </div>

        {/* Ayah indicator */}
        <div className="flex items-center justify-center gap-1 mb-2 min-h-[16px]">
          {isActive && currentAyah ? (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${reciter.accent}25`,
                color: reciter.accent,
                fontFamily: '"Tajawal", sans-serif',
                fontVariantNumeric: 'tabular-nums',
              }}
              data-testid={`text-current-ayah-${reciter.id}`}
            >
              آية {currentAyah} ({completedInRange + 1}/{totalAyahs})
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {fromAyah} ← {toAyah}
            </span>
          )}
        </div>

        {/* Mini progress bar */}
        <div className="h-1 w-full rounded-full bg-secondary overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${isActive ? Math.min(100, (completedInRange / totalAyahs) * 100 + (progress * (1 / totalAyahs) * 100)) : 0}%`,
              background: `linear-gradient(to left, ${reciter.accent}, ${reciter.accent}aa)`,
            }}
          />
        </div>

        {/* Play / Pause button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          data-testid={`button-play-${reciter.id}`}
          className="mt-auto mx-auto w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          style={{
            background: isActive
              ? `linear-gradient(135deg, ${reciter.accent}, ${reciter.accent}cc)`
              : 'linear-gradient(135deg, #C19A6B, #8a6a3a)',
            boxShadow: isActive ? `0 8px 24px ${reciter.accent}77` : '0 6px 18px rgba(193,154,107,0.45)',
          }}
        >
          {isLoading && isActive ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white fill-white" />
          ) : (
            <Play className="w-5 h-5 text-white fill-white translate-x-0.5" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

/* ───────────── Main Page ───────────── */
export function VoiceComparison() {
  const audio = useAudio();
  const [phase, setPhase] = useState<Phase>('reciters');
  const [selected, setSelected] = useState<string[]>([]);
  const [surahNum, setSurahNum] = useState<number>(1);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(1);
  const [showSurahPicker, setShowSurahPicker] = useState(false);

  // Stop the global player when entering this comparison page so audio sources never overlap.
  useEffect(() => { audio.stop(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Playback state for the comparison view (uses its own dedicated <audio>).
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const stateRef = useRef({ activeIdx: null as number | null, currentAyah: null as number | null });

  useEffect(() => { stateRef.current = { activeIdx, currentAyah }; }, [activeIdx, currentAyah]);

  // Lazy-create the audio element once.
  if (!audioRef.current && typeof window !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }

  const selectedReciters = useMemo(
    () => selected.map(id => RECITERS.find(r => r.id === id)!).filter(Boolean),
    [selected]
  );

  const maxAyahs = SURAH_AYAH_COUNT[surahNum] ?? 1;

  // Keep ayah range in valid bounds whenever surah changes.
  useEffect(() => {
    setFromAyah(prev => Math.min(prev, maxAyahs));
    setToAyah(prev => {
      const v = Math.min(prev, maxAyahs);
      return Math.max(v, fromAyah);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahNum]);

  useEffect(() => {
    if (toAyah < fromAyah) setToAyah(fromAyah);
  }, [fromAyah, toAyah]);

  const toggleReciter = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  /* ──────── Audio engine ──────── */
  const stopAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.onended = null;
    el.onloadeddata = null;
    el.ontimeupdate = null;
    el.onwaiting = null;
    el.oncanplay = null;
    el.onerror = null;
    el.pause();
    el.removeAttribute('src');
    el.load();
  }, []);

  const playAyah = useCallback((cardIdx: number, ayahNum: number) => {
    const el = audioRef.current;
    if (!el) return;
    const reciter = selectedReciters[cardIdx];
    if (!reciter) return;

    // Hard-reset previous handlers so a previous src loading doesn't trigger handlers later.
    el.onended = null;
    el.onloadeddata = null;
    el.ontimeupdate = null;
    el.onwaiting = null;
    el.oncanplay = null;
    el.onerror = null;
    el.pause();

    setActiveIdx(cardIdx);
    setCurrentAyah(ayahNum);
    setProgress(0);
    setIsLoading(true);

    el.src = ayahUrl(reciter.folder, surahNum, ayahNum);
    el.load();

    el.oncanplay = () => setIsLoading(false);
    el.onwaiting = () => setIsLoading(true);
    el.ontimeupdate = () => {
      if (el.duration && !Number.isNaN(el.duration)) {
        setProgress(el.currentTime / el.duration);
      }
    };
    el.onerror = () => {
      // skip on error: continue to next ayah / next card
      handleEnded();
    };
    el.onended = () => handleEnded();

    el.play().catch(() => {
      setIsLoading(false);
    });

    function handleEnded() {
      const { activeIdx: ai } = stateRef.current;
      // Use current latest state from refs to advance correctly
      const cIdx = ai ?? cardIdx;
      const nextAyah = ayahNum + 1;
      if (nextAyah <= toAyah) {
        playAyah(cIdx, nextAyah);
      } else {
        // move to next reciter
        const nextCard = cIdx + 1;
        if (nextCard < selectedReciters.length) {
          playAyah(nextCard, fromAyah);
        } else {
          // all done
          stopAudio();
          setActiveIdx(null);
          setCurrentAyah(null);
          setProgress(0);
          setIsLoading(false);
        }
      }
    }
  }, [selectedReciters, surahNum, fromAyah, toAyah, stopAudio]);

  const handlePlayCard = useCallback((cardIdx: number) => {
    // If this card is already active and paused (audio paused but src loaded), resume from where we left.
    const el = audioRef.current;
    if (activeIdx === cardIdx && el && el.src && !el.ended) {
      el.play().catch(() => {});
      return;
    }
    // Otherwise: start this card from the first ayah of the range.
    playAyah(cardIdx, fromAyah);
  }, [activeIdx, fromAyah, playAyah]);

  const handlePauseCard = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
  }, []);

  // Keep "isLoading" in sync with paused/playing state cleanly.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPause = () => setIsLoading(false);
    const onPlay = () => setIsLoading(false);
    el.addEventListener('pause', onPause);
    el.addEventListener('play', onPlay);
    return () => {
      el.removeEventListener('pause', onPause);
      el.removeEventListener('play', onPlay);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const handleReset = () => {
    stopAudio();
    setActiveIdx(null);
    setCurrentAyah(null);
    setProgress(0);
    setIsLoading(false);
  };

  /* ──────── Phase 1: Choose reciters ──────── */
  if (phase === 'reciters') {
    return (
      <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
        <header className="px-4 py-4 flex items-center gap-3 bg-card shadow-sm border-b border-border">
          <Link href="/more">
            <button className="p-2 bg-secondary rounded-full" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>مقارنة الأصوات</h1>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>اختر من 2 إلى 3 قراء</p>
          </div>
        </header>

        <div className="px-4 py-4 flex items-center justify-between bg-card/40 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 space-x-reverse">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                    i < selected.length
                      ? 'bg-primary text-primary-foreground border-card'
                      : 'bg-secondary text-muted-foreground border-card'
                  }`}
                  style={{ fontFamily: '"Tajawal", sans-serif' }}
                >
                  {i < selected.length ? <Check className="w-3.5 h-3.5" /> : '+'}
                </div>
              ))}
            </div>
            <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              <span className="font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>{selected.length}</span> / 3
            </span>
          </div>
          <button
            disabled={selected.length < 2}
            onClick={() => setPhase('range')}
            data-testid="button-next-to-range"
            className="px-5 py-2 rounded-full font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selected.length >= 2 ? 'linear-gradient(135deg, #C19A6B, #8a6a3a)' : 'hsl(var(--secondary))',
              color: selected.length >= 2 ? '#fff' : 'hsl(var(--muted-foreground))',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            التالي
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="grid grid-cols-2 gap-3">
            {RECITERS.map(r => {
              const isSel = selected.includes(r.id);
              const idxInSel = selected.indexOf(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleReciter(r.id)}
                  data-testid={`button-toggle-${r.id}`}
                  className={`relative rounded-2xl overflow-hidden transition-all border-2 ${
                    isSel ? 'border-primary scale-100' : 'border-transparent'
                  } ${selected.length >= 3 && !isSel ? 'opacity-40' : ''}`}
                  style={{ minHeight: 140 }}
                >
                  <div className="relative h-20" style={{ background: r.grad }}>
                    <PatternBg />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm"
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: '1.5px solid rgba(255,255,255,0.25)',
                        }}
                      >
                        <span className="font-bold text-2xl text-white" style={{ fontFamily: '"Amiri", serif' }}>
                          {r.initial}
                        </span>
                      </div>
                    </div>
                    {isSel && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px] shadow-md"
                        style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {idxInSel + 1}
                      </div>
                    )}
                  </div>
                  <div className="bg-card px-2 py-2.5 text-center">
                    <p className="font-bold text-sm text-foreground truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {r.shortName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {r.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ──────── Phase 2: Choose surah & range ──────── */
  if (phase === 'range') {
    return (
      <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
        <header className="px-4 py-4 flex items-center gap-3 bg-card shadow-sm border-b border-border">
          <button onClick={() => setPhase('reciters')} className="p-2 bg-secondary rounded-full" data-testid="button-back-to-reciters">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>اختر السورة والآيات</h1>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {selectedReciters.length} قراء مختارون
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {/* Selected reciter chips */}
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {selectedReciters.map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-full pr-3 pl-1 py-1 flex-shrink-0"
                style={{ background: `${r.accent}20`, border: `1px solid ${r.accent}50` }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: r.grad, color: '#fff', fontFamily: '"Amiri", serif' }}
                >
                  {r.initial}
                </div>
                <span className="text-xs font-bold text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {i + 1}. {r.shortName}
                </span>
              </div>
            ))}
          </div>

          {/* Surah picker */}
          <p className="text-xs text-muted-foreground mb-2 font-medium" style={{ fontFamily: '"Tajawal", sans-serif' }}>السورة</p>
          <button
            onClick={() => setShowSurahPicker(true)}
            data-testid="button-open-surah-picker"
            className="w-full flex items-center justify-between bg-card border border-border rounded-2xl p-4 mb-5 transition-all hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold"
                style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {surahNum}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg" style={{ fontFamily: '"Amiri", serif' }}>{SURAH_NAMES[surahNum]}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {SURAH_AYAH_COUNT[surahNum]} آية
                </p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Ayah range */}
          <p className="text-xs text-muted-foreground mb-2 font-medium" style={{ fontFamily: '"Tajawal", sans-serif' }}>الآيات</p>
          <div className="flex items-center gap-2 mb-3">
            <Stepper label="من آية" value={fromAyah} min={1} max={maxAyahs} onChange={setFromAyah} />
            <Stepper label="إلى آية" value={toAyah} min={fromAyah} max={maxAyahs} onChange={setToAyah} />
          </div>

          <p className="text-center text-xs text-muted-foreground mb-6" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            عدد الآيات للمقارنة: <span className="font-bold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{toAyah - fromAyah + 1}</span>
          </p>

          <button
            onClick={() => setPhase('compare')}
            data-testid="button-start-compare"
            className="w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #8a6a3a)',
              color: '#fff',
              fontFamily: '"Tajawal", sans-serif',
              boxShadow: '0 8px 24px rgba(193,154,107,0.35)',
            }}
          >
            ابدأ المقارنة
          </button>
        </div>

        <AnimatePresence>
          {showSurahPicker && (
            <SurahPickerSheet selected={surahNum} onSelect={setSurahNum} onClose={() => setShowSurahPicker(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ──────── Phase 3: Compare ──────── */
  const cardCount = (selectedReciters.length === 3 ? 3 : 2) as 2 | 3;
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      <header className="px-4 py-4 flex items-center gap-3 bg-card shadow-sm border-b border-border flex-shrink-0">
        <button
          onClick={() => { handleReset(); setPhase('range'); }}
          className="p-2 bg-secondary rounded-full"
          data-testid="button-back-to-range"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-right">
          <h1 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            مقارنة الأصوات
          </h1>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
            {SURAH_NAMES[surahNum]} • من {fromAyah} إلى {toAyah}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="p-2 bg-secondary rounded-full"
          title="إعادة"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 p-3 pb-24 overflow-y-auto">
        <div className={`grid gap-2.5 ${cardCount === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {selectedReciters.map((r, i) => (
            <ComparisonCard
              key={r.id}
              reciter={r}
              surahNum={surahNum}
              fromAyah={fromAyah}
              toAyah={toAyah}
              isActive={activeIdx === i}
              isLoading={activeIdx === i && isLoading}
              currentAyah={activeIdx === i ? currentAyah : null}
              progress={activeIdx === i ? progress : 0}
              onPlay={() => handlePlayCard(i)}
              onPause={handlePauseCard}
              cardCount={cardCount}
            />
          ))}
        </div>

        {/* Helpful hint */}
        <div className="mt-4 mx-1 bg-primary/5 border border-primary/15 rounded-2xl px-3 py-2.5 flex items-start gap-2">
          <div className="w-4 h-4 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>i</div>
          <p className="text-[11px] text-muted-foreground leading-snug" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            اضغط زر التشغيل في أي بطاقة. عند انتهاء قراءة قارئ، يبدأ التالي تلقائياً للمقارنة.
          </p>
        </div>
      </div>
    </div>
  );
}
