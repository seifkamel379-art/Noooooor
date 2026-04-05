import { useState, type ReactNode, type ReactElement } from 'react';
import { Check, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getTodayKey, cn } from '@/lib/utils';
import { HISN_CATEGORIES, HISN_ITEMS, type HisnCategory } from '@/lib/hisnData';
import {
  MorningIcon, EveningIcon, SleepIcon, DuaHandsIcon, SupplicationIcon,
  MosqueIcon, HomeEnterIcon, FoodIcon, TravelIcon, RainIcon, ShieldHeartIcon,
  ProphetIcon, IslamicStarIcon,
} from '@/components/NoorIcons';

/* ── Icon map by category ID ─────────────────────*/
type IconComp = (props: { className?: string; size?: number }) => ReactElement;
const ICON_MAP: Record<number, IconComp> = {
  27: MorningIcon,      // أذكار الصباح والمساء
  28: SleepIcon,        // أذكار النوم
  1:  MorningIcon,      // الاستيقاظ
  6:  DuaHandsIcon,
  7:  DuaHandsIcon,
  8:  SupplicationIcon,
  9:  SupplicationIcon,
  10: HomeEnterIcon,
  11: HomeEnterIcon,
  12: MosqueIcon,
  13: MosqueIcon,
  14: MosqueIcon,
  15: SupplicationIcon,
  16: DuaHandsIcon,
  17: DuaHandsIcon,
  18: DuaHandsIcon,
  19: DuaHandsIcon,
  20: DuaHandsIcon,
  21: DuaHandsIcon,
  22: SupplicationIcon,
  23: ProphetIcon,
  24: DuaHandsIcon,
  25: SupplicationIcon,
  26: DuaHandsIcon,
  29: SleepIcon,
  30: SleepIcon,
  31: SleepIcon,
  32: SupplicationIcon,
  33: SupplicationIcon,
  34: ShieldHeartIcon,
  35: ShieldHeartIcon,
  36: ShieldHeartIcon,
  37: ShieldHeartIcon,
  38: ShieldHeartIcon,
  39: ShieldHeartIcon,
  40: ShieldHeartIcon,
  41: DuaHandsIcon,
  42: DuaHandsIcon,
  43: DuaHandsIcon,
  44: DuaHandsIcon,
  45: ShieldHeartIcon,
  46: DuaHandsIcon,
  47: DuaHandsIcon,
  48: DuaHandsIcon,
  49: DuaHandsIcon,
  51: ShieldHeartIcon,
  55: DuaHandsIcon,
  56: DuaHandsIcon,
  57: DuaHandsIcon,
  60: MosqueIcon,
  61: RainIcon,
  62: RainIcon,
  63: RainIcon,
  64: RainIcon,
  65: RainIcon,
  67: EveningIcon,
  68: FoodIcon,
  69: FoodIcon,
  70: FoodIcon,
  71: FoodIcon,
  74: FoodIcon,
  75: FoodIcon,
  76: FoodIcon,
  95: TravelIcon,
  96: TravelIcon,
  97: TravelIcon,
  98: TravelIcon,
  99: TravelIcon,
  100: TravelIcon,
  101: TravelIcon,
  102: TravelIcon,
  103: TravelIcon,
  104: TravelIcon,
  105: TravelIcon,
  107: ProphetIcon,
  115: MosqueIcon,
  116: MosqueIcon,
  117: MosqueIcon,
  118: MosqueIcon,
  119: MosqueIcon,
  120: MosqueIcon,
  121: MosqueIcon,
  129: SupplicationIcon,
  130: SupplicationIcon,
  131: ProphetIcon,
};
function getIcon(id: number): IconComp { return ICON_MAP[id] ?? IslamicStarIcon; }

/* ── Ornament ────────────────────────────────────*/
function IslamicOrnament() {
  return (
    <svg viewBox="0 0 120 20" className="w-full opacity-30" preserveAspectRatio="xMidYMid meet">
      <g fill="currentColor">
        <polygon points="60,2 63,8 70,8 64,12 66,19 60,15 54,19 56,12 50,8 57,8" opacity="0.8"/>
        <polygon points="20,10 22,14 26,14 23,16 24,20 20,18 16,20 17,16 14,14 18,14" opacity="0.5" transform="scale(0.7) translate(14,0)"/>
        <polygon points="100,10 102,14 106,14 103,16 104,20 100,18 96,20 97,16 94,14 98,14" opacity="0.5" transform="scale(0.7) translate(-14,0)"/>
        <line x1="0" y1="10" x2="40" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <line x1="80" y1="10" x2="120" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <circle cx="42" cy="10" r="1.5" opacity="0.5"/>
        <circle cx="78" cy="10" r="1.5" opacity="0.5"/>
      </g>
    </svg>
  );
}

/* ── Card ────────────────────────────────────────*/
function IslamicCard({ children, isDone }: { children: ReactNode; isDone: boolean }) {
  return (
    <div className={cn(
      'relative rounded-3xl p-5 shadow-sm transition-all duration-500 overflow-hidden',
      isDone ? 'border-2 border-green-500/40 bg-green-50/20 dark:bg-green-900/10'
             : 'border-2 border-[#C19A6B]/20 bg-card',
    )}>
      {(['top-2 right-2 ', 'top-2 left-2 scaleX(-1)', 'bottom-2 right-2 scaleY(-1)', 'bottom-2 left-2 scale(-1)'] as const).map((pos, i) => {
        const [p1, p2, t] = pos.split(' ');
        return (
          <svg key={i} className={`absolute ${p1} ${p2} w-8 h-8 opacity-10 text-[#C19A6B]`} viewBox="0 0 40 40" fill="currentColor" style={{ transform: t }}>
            <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
            <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      })}
      {children}
    </div>
  );
}

/* ── Reset dialog ────────────────────────────────*/
function ResetDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}/>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
      >
        <svg width="32" height="32" viewBox="0 0 40 40" className="mx-auto mb-3 text-primary opacity-60">
          <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" fill="currentColor"/>
        </svg>
        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>تصفير الأذكار</h3>
        <p className="text-muted-foreground text-sm mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          هل تريد تصفير هذا القسم لليوم؟
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', color: '#fff', fontFamily: '"Tajawal", sans-serif' }}>تصفير</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Items view ──────────────────────────────────*/
function ItemsView({ category, onBack }: { category: HisnCategory; onBack: () => void }) {
  const todayKey = getTodayKey();
  const [progress, setProgress] = useLocalStorage<Record<number, number>>(
    `azkar_hisn_${todayKey}_${category.id}`, {}
  );
  const [showReset, setShowReset] = useState(false);

  const items = HISN_ITEMS[category.id] ?? [];
  const totalDone = items.filter(z => (progress[z.id] ?? 0) >= z.count).length;
  const allDone = items.length > 0 && totalDone === items.length;

  const handleTap = (id: number, max: number) => {
    setProgress(prev => {
      const cur = prev[id] ?? 0;
      if (cur >= max) return prev;
      return { ...prev, [id]: cur + 1 };
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showReset && (
          <ResetDialog
            onConfirm={() => { setProgress({}); setShowReset(false); }}
            onCancel={() => setShowReset(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="flex items-center gap-1 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          <ChevronRight className="w-5 h-5"/>
          الأقسام
        </button>
        <button onClick={() => setShowReset(true)} className="p-2 bg-secondary text-primary rounded-full">
          <RotateCcw className="w-4 h-4"/>
        </button>
      </div>

      <h1 className="text-xl font-bold mb-3 text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        {category.title}
      </h1>

      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-4 bg-card rounded-2xl px-4 py-2.5 border border-[#C19A6B]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(totalDone / items.length) * 100}%` }}/>
            </div>
            <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{totalDone}/{items.length}</span>
          </div>
          {allDone && (
            <span className="text-green-600 text-sm font-bold flex items-center gap-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              <Check className="w-4 h-4"/>أحسنت!
            </span>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          لا توجد أذكار في هذا القسم.
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => {
            const cur = progress[item.id] ?? 0;
            const isDone = cur >= item.count;
            return (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ delay: idx * 0.02, duration: 0.25 }}>
                <IslamicCard isDone={isDone}>
                  <div className="text-[#C19A6B] mb-3"><IslamicOrnament/></div>

                  <p className="text-lg leading-loose whitespace-pre-wrap text-center mb-1"
                    style={{ fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif' }}>
                    {item.text}
                  </p>

                  <div className="text-[#C19A6B] mt-2 mb-4"><IslamicOrnament/></div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {isDone
                        ? <span className="text-green-600 font-bold">✓ مكتمل</span>
                        : <span>متبقي: <strong>{item.count - cur}</strong> / {item.count}</span>
                      }
                    </div>
                    <button
                      onClick={() => handleTap(item.id, item.count)}
                      disabled={isDone}
                      className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-md',
                        isDone ? 'bg-green-500 text-white scale-105 shadow-green-500/30 cursor-not-allowed'
                               : 'text-primary-foreground hover:scale-105 active:scale-95 cursor-pointer'
                      )}
                      style={!isDone ? { background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', boxShadow: '0 4px 15px rgba(193,154,107,0.4)' } : {}}
                    >
                      {isDone ? <Check className="w-7 h-7"/> : <span style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.count - cur}</span>}
                    </button>
                  </div>

                  <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className={cn('h-full transition-all duration-500 rounded-full', isDone ? 'bg-green-500' : 'bg-primary')}
                      style={{ width: `${Math.min((cur / item.count) * 100, 100)}%` }}/>
                  </div>
                </IslamicCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Categories grid ─────────────────────────────*/
function CategoriesView({ onSelect }: { onSelect: (cat: HisnCategory) => void }) {
  const todayKey = getTodayKey();

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>الأذكار والأدعية</h1>
      <p className="text-[11px] text-muted-foreground mb-4" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        من حصن المسلم — تتجدد الأذكار تلقائياً كل يوم
      </p>

      <div className="grid grid-cols-2 gap-3">
        {HISN_CATEGORIES.map((cat, idx) => {
          const Icon = getIcon(cat.id);
          const stored = localStorage.getItem(`azkar_hisn_${todayKey}_${cat.id}`);
          const prog: Record<number, number> = stored ? JSON.parse(stored) : {};
          const items = HISN_ITEMS[cat.id] ?? [];
          const done = items.filter(z => (prog[z.id] ?? 0) >= z.count).length;
          const allDone = items.length > 0 && done === items.length;
          const hasDone = done > 0;

          return (
            <motion.button
              key={cat.id}
              onClick={() => onSelect(cat)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.015, duration: 0.2 }}
              className="flex flex-col items-center gap-2.5 bg-card border border-border/40 rounded-2xl p-4 text-center hover-elevate relative"
            >
              {/* progress badge */}
              {allDone && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center bg-green-500">
                  <Check className="w-3 h-3 text-white"/>
                </div>
              )}
              {hasDone && !allDone && (
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.25)' }}>
                  <span className="text-[8px] font-bold text-primary">{done}</span>
                </div>
              )}

              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(193,154,107,0.18), rgba(193,154,107,0.06))' }}>
                <Icon size={24} className="text-primary"/>
              </div>
              <p className="text-xs font-bold leading-tight text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {cat.title}
              </p>
              {items.length > 0 && (
                <p className="text-[10px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {items.length} ذكر
                </p>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────*/
export function Azkar() {
  const [selected, setSelected] = useState<HisnCategory | null>(null);

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div key="items"
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.22 }}>
          <ItemsView category={selected} onBack={() => setSelected(null)}/>
        </motion.div>
      ) : (
        <motion.div key="cats"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
          <CategoriesView onSelect={setSelected}/>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
