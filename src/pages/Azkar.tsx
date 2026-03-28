import { useState } from 'react';
import {
  MORNING_AZKAR, EVENING_AZKAR, AZKAR_AFTER_PRAYER, AZKAR_SLEEP, AZKAR_VARIOUS,
  PROPHETIC_DUAS, AZKAR_WAKEUP, AZKAR_HOME, AZKAR_MASJID, AZKAR_FOOD, AZKAR_TRAVEL, AZKAR_DISTRESS, AZKAR_WEATHER,
} from '@/lib/constants';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getTodayKey, cn } from '@/lib/utils';
import { Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MorningIcon, EveningIcon, SleepIcon, DuaHandsIcon, SupplicationIcon,
  MosqueIcon, HomeEnterIcon, FoodIcon, TravelIcon, RainIcon, ShieldHeartIcon, ProphetIcon,
} from '@/components/NoorIcons';

type TabId = 'morning' | 'evening' | 'sleep' | 'after' | 'various'
           | 'wakeup' | 'home' | 'masjid' | 'food' | 'travel' | 'distress' | 'weather' | 'prophetic';

const TAB_ICONS: Record<TabId, React.ComponentType<{ className?: string; size?: number }>> = {
  morning:   MorningIcon,
  evening:   EveningIcon,
  sleep:     SleepIcon,
  after:     DuaHandsIcon,
  various:   SupplicationIcon,
  wakeup:    MorningIcon,
  home:      HomeEnterIcon,
  masjid:    MosqueIcon,
  food:      FoodIcon,
  travel:    TravelIcon,
  distress:  ShieldHeartIcon,
  weather:   RainIcon,
  prophetic: ProphetIcon,
};

const TABS = [
  { id: 'morning'   as TabId, label: 'الصباح',     data: MORNING_AZKAR },
  { id: 'evening'   as TabId, label: 'المساء',     data: EVENING_AZKAR },
  { id: 'sleep'     as TabId, label: 'النوم',       data: AZKAR_SLEEP },
  { id: 'wakeup'    as TabId, label: 'الاستيقاظ',  data: AZKAR_WAKEUP },
  { id: 'after'     as TabId, label: 'بعد الصلاة', data: AZKAR_AFTER_PRAYER },
  { id: 'masjid'    as TabId, label: 'المسجد',     data: AZKAR_MASJID },
  { id: 'home'      as TabId, label: 'البيت',       data: AZKAR_HOME },
  { id: 'food'      as TabId, label: 'الطعام',      data: AZKAR_FOOD },
  { id: 'travel'    as TabId, label: 'السفر',       data: AZKAR_TRAVEL },
  { id: 'distress'  as TabId, label: 'الكرب',       data: AZKAR_DISTRESS },
  { id: 'weather'   as TabId, label: 'المطر',       data: AZKAR_WEATHER },
  { id: 'prophetic' as TabId, label: 'أدعية النبي ﷺ', data: PROPHETIC_DUAS },
  { id: 'various'   as TabId, label: 'أدعية قرآنية', data: AZKAR_VARIOUS },
];

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

function IslamicCard({ children, isDone, className = '' }: { children: React.ReactNode; isDone: boolean; className?: string }) {
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
      <svg className="absolute top-2 right-2 w-8 h-8 opacity-10 text-[#C19A6B]" viewBox="0 0 40 40" fill="currentColor">
        <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
        <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <svg className="absolute top-2 left-2 w-8 h-8 opacity-10 text-[#C19A6B]" viewBox="0 0 40 40" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
        <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
        <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <svg className="absolute bottom-2 right-2 w-8 h-8 opacity-10 text-[#C19A6B]" viewBox="0 0 40 40" fill="currentColor" style={{ transform: 'scaleY(-1)' }}>
        <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
        <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      <svg className="absolute bottom-2 left-2 w-8 h-8 opacity-10 text-[#C19A6B]" viewBox="0 0 40 40" fill="currentColor" style={{ transform: 'scale(-1)' }}>
        <path d="M0,0 L20,0 L20,5 L5,5 L5,20 L0,20 Z"/>
        <circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
      {children}
    </div>
  );
}

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
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-colors"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #a07a4a)',
              color: '#fff',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            تصفير
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function Azkar() {
  const [tab, setTab] = useState<TabId>('morning');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const todayKey = getTodayKey();
  const [progress, setProgress] = useLocalStorage<Record<string, number>>(`azkar_${todayKey}`, {});

  const currentTab = TABS.find(t => t.id === tab)!;
  const azkarList = currentTab.data;

  const totalDone = azkarList.filter(z => (progress[z.id] ?? 0) >= z.count).length;
  const allDone = totalDone === azkarList.length;

  const handleTap = (id: string, max: number) => {
    setProgress(prev => {
      const current = prev[id] ?? 0;
      if (current >= max) return prev;
      return { ...prev, [id]: current + 1 };
    });
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleResetConfirm = () => {
    const toRemove = azkarList.map(z => z.id);
    setProgress(prev => {
      const next = { ...prev };
      toRemove.forEach(id => delete next[id]);
      return next;
    });
    setShowResetDialog(false);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showResetDialog && (
          <ResetConfirmDialog
            onConfirm={handleResetConfirm}
            onCancel={() => setShowResetDialog(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>الأذكار والأدعية</h1>
        <button
          onClick={() => setShowResetDialog(true)}
          className="p-2 bg-secondary text-primary rounded-full hover:bg-primary/20 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        تتجدد الأذكار تلقائياً كل يوم عند منتصف الليل
      </p>

      {/* Tabs — scrollable row */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar">
        {TABS.map(t => {
          const done = t.data.filter(z => (progress[z.id] ?? 0) >= z.count).length;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-card text-muted-foreground border-border hover:bg-secondary'
              )}
            >
              {(() => { const Icon = TAB_ICONS[t.id]; return <Icon size={16} />; })()}
              <span style={{ fontFamily: '"Tajawal", sans-serif' }}>{t.label}</span>
              {done > 0 && !isActive && (
                <span className="bg-green-500 text-white text-[9px] px-1 rounded-full">{done}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress summary */}
      <div className="mb-4 bg-card rounded-2xl px-4 py-2.5 border border-[#C19A6B]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${azkarList.length ? (totalDone / azkarList.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {totalDone}/{azkarList.length}
          </span>
        </div>
        {allDone && (
          <span className="text-green-600 text-sm font-bold flex items-center gap-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            <Check className="w-4 h-4" />أحسنت!
          </span>
        )}
      </div>

      {/* Azkar list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {azkarList.map((zekr, index) => {
            const current = progress[zekr.id] ?? 0;
            const isDone = current >= zekr.count;

            return (
              <motion.div
                key={`${tab}-${zekr.id}`}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02, duration: 0.25 }}
              >
                <IslamicCard isDone={isDone}>
                  <div className="text-[#C19A6B] mb-3">
                    <IslamicOrnament />
                  </div>

                  <p
                    className="text-lg leading-loose mb-1 whitespace-pre-wrap text-center"
                    style={{ fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif' }}
                  >
                    {zekr.text}
                  </p>

                  <div className="text-[#C19A6B] mt-2 mb-3">
                    <IslamicOrnament />
                  </div>

                  <p className="text-xs text-primary/70 mb-4 bg-primary/5 inline-block px-3 py-1 rounded-lg border border-primary/10" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    {zekr.source}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {isDone ? (
                        <span className="text-green-600 font-bold">✓ مكتمل</span>
                      ) : (
                        <span>متبقي: <strong>{zekr.count - current}</strong> / {zekr.count}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleTap(zekr.id, zekr.count)}
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
                      {isDone ? <Check className="w-7 h-7" /> : (
                        <span style={{ fontFamily: '"Tajawal", sans-serif' }}>{zekr.count - current}</span>
                      )}
                    </button>
                  </div>

                  <div className="w-full bg-secondary h-1.5 rounded-full mt-4 overflow-hidden">
                    <div
                      className={cn('h-full transition-all duration-500 rounded-full', isDone ? 'bg-green-500' : 'bg-primary')}
                      style={{ width: `${Math.min((current / zekr.count) * 100, 100)}%` }}
                    />
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
