import { useState, type ReactNode, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, RotateCcw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getTodayKey, cn } from '@/lib/utils';
import {
  MorningIcon, EveningIcon, SleepIcon, DuaHandsIcon, SupplicationIcon,
  MosqueIcon, HomeEnterIcon, FoodIcon, TravelIcon, RainIcon, ShieldHeartIcon, ProphetIcon,
  IslamicStarIcon,
} from '@/components/NoorIcons';

/* ── Types ──────────────────────────────────────── */
interface HisnCategory {
  ID: number;
  TITLE: string;
  AUDIO_URL: string;
  TEXT: string; // URL to items
}

interface HisnItem {
  ID: number;
  ARABIC_TEXT: string;
  REPEAT: number;
}

/* ── Icon map by category ID ─────────────────────*/
type IconComp = (props: { className?: string; size?: number }) => ReactElement;
const ICON_MAP: Record<number, IconComp> = {
  27: MorningIcon,   // أذكار الصباح والمساء
  28: SleepIcon,     // أذكار النوم
  1:  MorningIcon,   // أذكار الاستيقاظ
  6:  DuaHandsIcon,  // دعاء دخول الخلاء
  7:  DuaHandsIcon,  // دعاء الخروج من الخلاء
  8:  SupplicationIcon, // الذكر قبل الوضوء
  9:  SupplicationIcon, // الذكر بعد الوضوء
  10: HomeEnterIcon, // الذكر عند الخروج من المنزل
  11: HomeEnterIcon, // الذكر عند دخول المنزل
  12: MosqueIcon,    // المسجد
  13: MosqueIcon,    // المسجد
  14: DuaHandsIcon,  // صلاة
  15: DuaHandsIcon,  // أذان
  16: ProphetIcon,   // النبي
  17: ProphetIcon,
  18: DuaHandsIcon,
  19: FoodIcon,      // طعام
  20: FoodIcon,
  21: FoodIcon,
  22: TravelIcon,    // سفر
  23: TravelIcon,
  24: TravelIcon,
  25: ShieldHeartIcon, // كرب
  26: ShieldHeartIcon,
  29: RainIcon,      // مطر
  30: RainIcon,
  31: EveningIcon,
  32: EveningIcon,
};

function getCategoryIcon(id: number): IconComp {
  return ICON_MAP[id] ?? IslamicStarIcon;
}

/* ── Ornament ────────────────────────────────────*/
function IslamicOrnament({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 20" className={cn('w-full opacity-30', className)} preserveAspectRatio="xMidYMid meet">
      <g fill="currentColor">
        <polygon points="60,2 63,8 70,8 64,12 66,19 60,15 54,19 56,12 50,8 57,8" opacity="0.8" />
        <polygon points="20,10 22,14 26,14 23,16 24,20 20,18 16,20 17,16 14,14 18,14" opacity="0.5" transform="scale(0.7) translate(14,0)" />
        <polygon points="100,10 102,14 106,14 103,16 104,20 100,18 96,20 97,16 94,14 98,14" opacity="0.5" transform="scale(0.7) translate(-14,0)" />
        <line x1="0" y1="10" x2="40" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <line x1="80" y1="10" x2="120" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
        <circle cx="42" cy="10" r="1.5" opacity="0.5"/>
        <circle cx="78" cy="10" r="1.5" opacity="0.5"/>
      </g>
    </svg>
  );
}

/* ── IslamicCard ─────────────────────────────────*/
function IslamicCard({ children, isDone, className = '' }: { children: ReactNode; isDone: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-3xl p-5 shadow-sm transition-all duration-500 overflow-hidden',
        isDone
          ? 'border-2 border-green-500/40 bg-green-50/20 dark:bg-green-900/10'
          : 'border-2 border-[#C19A6B]/20 bg-card',
        className
      )}
    >
      {[['top-2 right-2', ''], ['top-2 left-2', 'scaleX(-1)'], ['bottom-2 right-2', 'scaleY(-1)'], ['bottom-2 left-2', 'scale(-1)']].map(([pos, t], i) => (
        <svg key={i} className={`absolute ${pos} w-8 h-8 opacity-10 text-[#C19A6B]`} viewBox="0 0 40 40" fill="currentColor" style={{ transform: t }}>
          <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
          <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ))}
      {children}
    </div>
  );
}

/* ── Reset dialog ────────────────────────────────*/
function ResetConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.2 }}
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
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >إلغاء</button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #C19A6B, #a07a4a)', color: '#fff', fontFamily: '"Tajawal", sans-serif' }}
          >تصفير</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Skeleton loader ─────────────────────────────*/
function SkeletonCard() {
  return (
    <div className="rounded-3xl p-5 border-2 border-[#C19A6B]/10 bg-card animate-pulse space-y-3">
      <div className="h-3 bg-primary/10 rounded-full w-full" />
      <div className="h-16 bg-primary/8 rounded-xl" />
      <div className="h-3 bg-primary/10 rounded-full w-2/3 mx-auto" />
      <div className="flex justify-between items-center mt-2">
        <div className="h-4 w-20 bg-secondary rounded-full" />
        <div className="w-16 h-16 rounded-full bg-secondary" />
      </div>
    </div>
  );
}

/* ── Category grid skeleton ──────────────────────*/
function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-border/40 p-4 animate-pulse flex flex-col items-center gap-2" style={{ minHeight: 96 }}>
          <div className="w-12 h-12 rounded-2xl bg-primary/10" />
          <div className="h-3 bg-secondary rounded-full w-3/4" />
        </div>
      ))}
    </div>
  );
}

/* ── fetch helpers ───────────────────────────────*/
const API_BASE = 'http://www.hisnmuslim.com/api/ar';

async function fetchCategories(): Promise<HisnCategory[]> {
  const res = await fetch(`${API_BASE}/husn_ar.json`);
  if (!res.ok) throw new Error('فشل تحميل الأقسام');
  const data = await res.json();
  return data['العربية'] as HisnCategory[];
}

async function fetchItems(id: number): Promise<HisnItem[]> {
  const res = await fetch(`${API_BASE}/${id}.json`);
  if (!res.ok) throw new Error('فشل تحميل الأذكار');
  const data = await res.json();
  const key = Object.keys(data)[0];
  return (data[key] as HisnItem[]).filter(item => item.ARABIC_TEXT?.trim());
}

/* ── Items view ──────────────────────────────────*/
function ItemsView({
  category,
  onBack,
}: {
  category: HisnCategory;
  onBack: () => void;
}) {
  const todayKey = getTodayKey();
  const storageKey = `azkar_api_${todayKey}_${category.ID}`;
  const [progress, setProgress] = useLocalStorage<Record<string, number>>(storageKey, {});
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { data: items = [], isLoading, isError } = useQuery<HisnItem[]>({
    queryKey: ['hisnItems', category.ID],
    queryFn: () => fetchItems(category.ID),
    staleTime: 1000 * 60 * 60,
  });

  const totalDone = items.filter(z => (progress[z.ID] ?? 0) >= z.REPEAT).length;
  const allDone = items.length > 0 && totalDone === items.length;

  const handleTap = (id: number, max: number) => {
    setProgress(prev => {
      const cur = prev[id] ?? 0;
      if (cur >= max) return prev;
      return { ...prev, [id]: cur + 1 };
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleResetConfirm = () => {
    setProgress({});
    setShowResetDialog(false);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showResetDialog && (
          <ResetConfirmDialog onConfirm={handleResetConfirm} onCancel={() => setShowResetDialog(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground text-sm"
          style={{ fontFamily: '"Tajawal", sans-serif' }}
        >
          <ChevronRight className="w-5 h-5" />
          الأقسام
        </button>
        <button
          onClick={() => setShowResetDialog(true)}
          className="p-2 bg-secondary text-primary rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <h1
        className="text-xl font-bold mb-3 text-center"
        style={{ fontFamily: '"Tajawal", sans-serif' }}
      >
        {category.TITLE}
      </h1>

      {/* Progress bar */}
      {!isLoading && items.length > 0 && (
        <div className="mb-4 bg-card rounded-2xl px-4 py-2.5 border border-[#C19A6B]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(totalDone / items.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {totalDone}/{items.length}
            </span>
          </div>
          {allDone && (
            <span className="text-green-600 text-sm font-bold flex items-center gap-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              <Check className="w-4 h-4" />أحسنت!
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-12 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          حدث خطأ في تحميل الأذكار. تحقق من اتصالك بالإنترنت.
        </div>
      )}

      {/* Items */}
      {!isLoading && !isError && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => {
              const cur = progress[item.ID] ?? 0;
              const isDone = cur >= item.REPEAT;
              return (
                <motion.div
                  key={item.ID}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02, duration: 0.25 }}
                >
                  <IslamicCard isDone={isDone}>
                    <div className="text-[#C19A6B] mb-3"><IslamicOrnament /></div>

                    <p
                      className="text-lg leading-loose mb-1 whitespace-pre-wrap text-center"
                      style={{ fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif' }}
                    >
                      {item.ARABIC_TEXT}
                    </p>

                    <div className="text-[#C19A6B] mt-2 mb-4"><IslamicOrnament /></div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {isDone ? (
                          <span className="text-green-600 font-bold">✓ مكتمل</span>
                        ) : (
                          <span>متبقي: <strong>{item.REPEAT - cur}</strong> / {item.REPEAT}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleTap(item.ID, item.REPEAT)}
                        disabled={isDone}
                        className={cn(
                          'w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 shadow-md',
                          isDone
                            ? 'bg-green-500 text-white scale-105 shadow-green-500/30 cursor-not-allowed'
                            : 'text-primary-foreground hover:scale-105 active:scale-95 cursor-pointer'
                        )}
                        style={!isDone ? {
                          background: 'linear-gradient(135deg, #C19A6B, #a07a4a)',
                          boxShadow: '0 4px 15px rgba(193,154,107,0.4)',
                        } : {}}
                      >
                        {isDone
                          ? <Check className="w-7 h-7" />
                          : <span style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.REPEAT - cur}</span>
                        }
                      </button>
                    </div>

                    <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500 rounded-full', isDone ? 'bg-green-500' : 'bg-primary')}
                        style={{ width: `${Math.min((cur / item.REPEAT) * 100, 100)}%` }}
                      />
                    </div>
                  </IslamicCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ── Categories grid ─────────────────────────────*/
function CategoriesView({ onSelect }: { onSelect: (cat: HisnCategory) => void }) {
  const todayKey = getTodayKey();

  const { data: categories = [], isLoading, isError } = useQuery<HisnCategory[]>({
    queryKey: ['hisnCategories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60 * 24,
  });

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>الأذكار والأدعية</h1>
      <p className="text-[11px] text-muted-foreground mb-4" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        من حصن المسلم — تتجدد الأذكار تلقائياً كل يوم
      </p>

      {isLoading && <CategoriesSkeleton />}

      {isError && (
        <div className="text-center py-16 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          تعذّر تحميل الأقسام. تحقق من اتصالك بالإنترنت.
        </div>
      )}

      {!isLoading && !isError && (
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {categories.map((cat, idx) => {
            const Icon = getCategoryIcon(cat.ID);
            // Read progress from localStorage for badge
            const storageKey = `azkar_api_${todayKey}_${cat.ID}`;
            const stored = localStorage.getItem(storageKey);
            const prog: Record<string, number> = stored ? JSON.parse(stored) : {};
            const doneCount = Object.keys(prog).length;
            const hasDone = doneCount > 0;

            return (
              <motion.button
                key={cat.ID}
                onClick={() => onSelect(cat)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.22 }}
                className="flex flex-col items-center gap-2.5 bg-card border border-border/40 rounded-2xl p-4 text-center hover-elevate relative"
              >
                {hasDone && (
                  <div
                    className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(193,154,107,0.18)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#C19A6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(193,154,107,0.18), rgba(193,154,107,0.06))' }}
                >
                  <Icon size={24} className="text-primary" />
                </div>
                <p
                  className="text-xs font-bold leading-tight text-foreground"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}
                >
                  {cat.TITLE}
                </p>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ── Main export ─────────────────────────────────*/
export function Azkar() {
  const [selected, setSelected] = useState<HisnCategory | null>(null);

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div
          key="items"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.22 }}
        >
          <ItemsView category={selected} onBack={() => setSelected(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="categories"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
        >
          <CategoriesView onSelect={setSelected} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
