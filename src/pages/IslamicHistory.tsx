import { useState, useEffect } from 'react';
import { ChevronLeft, BookOpen, Search, X, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';

type Era = 'pre' | 'seerah' | 'rashidun' | 'umayyad' | 'abbasid';

type HistoryItem = {
  id: number;
  title: string;
  date: string;
  text: string;
  era: Era;
};

const ERAS: { id: Era; label: string; sub: string; grad: string }[] = [
  { id: 'pre',       label: 'ما قبل الهجرة',      sub: 'من الجاهلية حتى الإسلام',          grad: 'linear-gradient(135deg,#4a2040,#2a1030)' },
  { id: 'seerah',    label: 'السيرة النبوية',       sub: 'من المولد الشريف حتى الوفاة',       grad: 'linear-gradient(135deg,#1b4332,#0d2b1e)' },
  { id: 'rashidun',  label: 'الخلفاء الراشدون',    sub: 'من 11 إلى 40 هـ',                   grad: 'linear-gradient(135deg,#1e3a6e,#0f2040)' },
  { id: 'umayyad',   label: 'الدولة الأموية',       sub: 'من 41 إلى 132 هـ',                  grad: 'linear-gradient(135deg,#6b3a0f,#3d2008)' },
  { id: 'abbasid',   label: 'الدولة العباسية',      sub: 'من 132 إلى 656 هـ',                 grad: 'linear-gradient(135deg,#3a1a5c,#1e0d30)' },
];

function EventSheet({ item, onClose, dark }: { item: HistoryItem; onClose: () => void; dark: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-3xl pb-safe shadow-2xl"
        style={{ background: dark ? '#1a1208' : '#fdfbf0', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: 'rgba(193,154,107,0.4)' }} />
        <div className="flex items-center justify-between px-5 pb-3 border-b" style={{ borderColor: 'rgba(193,154,107,0.2)' }}>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.12)' }}>
            <X size={16} className="text-[#C19A6B]" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#C19A6B]" />
            <span className="text-xs text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.date}</span>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">
          <h2 className="text-lg font-bold mb-4 leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>
            {item.title}
          </h2>
          <p className="text-sm leading-loose" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#b0956a' : '#6D4C41', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
            {item.text}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function IslamicHistory() {
  const [, navigate] = useLocation();
  const [theme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEra, setSelectedEra] = useState<Era>('seerah');
  const [search, setSearch] = useState('');
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    fetch('/data/history.json')
      .then(r => r.json())
      .then((d: HistoryItem[]) => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const eraItems = items.filter(i => i.era === selectedEra);
  const filtered = search.trim()
    ? eraItems.filter(i => i.title.includes(search) || i.text.includes(search))
    : eraItems;

  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const cardBg = dark ? '#1a1208' : '#fff';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';

  return (
    <div className="min-h-screen pb-32" dir="rtl" style={{ background: bg }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto mb-3">
          <button onClick={() => navigate('/more')} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(193,154,107,0.12)' }}>
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>التاريخ الإسلامي</h1>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>
              {loading ? 'جارٍ التحميل...' : `${filtered.length} حدث`}
            </p>
          </div>
          <BookOpen size={22} className="text-[#C19A6B]" />
        </div>
        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C19A6B]/60" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الأحداث..."
            className="w-full pr-9 pl-4 py-2.5 rounded-2xl text-sm outline-none"
            style={{ fontFamily: '"Tajawal", sans-serif', background: dark ? '#1a1208' : '#f5edd8', color: dark ? '#d4b483' : '#5D4037', border: `1px solid ${border}` }}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Era chips */}
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {ERAS.map(era => (
            <button
              key={era.id}
              onClick={() => setSelectedEra(era.id)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: selectedEra === era.id ? era.grad : (dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)'),
                color: selectedEra === era.id ? '#fff' : (dark ? '#C19A6B' : '#8B6B3D'),
                border: selectedEra === era.id ? 'none' : `1px solid ${border}`,
              }}
            >
              {era.label}
            </button>
          ))}
        </div>

        {/* Era subtitle */}
        {!loading && (
          <div className="mb-3 px-1">
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>
              {ERAS.find(e => e.id === selectedEra)?.sub}
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col gap-3 mt-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)' }} />
            ))}
          </div>
        )}

        {/* Events list */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 opacity-50">
            <BookOpen size={32} className="text-[#C19A6B] mx-auto mb-3" />
            <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#C19A6B' : '#8B6B3D' }}>لا توجد نتائج</p>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {filtered.map(item => (
            <motion.button
              key={item.id}
              onClick={() => setActiveItem(item)}
              whileTap={{ scale: 0.98 }}
              className="w-full text-right p-4 rounded-2xl flex items-start gap-3"
              style={{ background: cardBg, border: `1px solid ${border}` }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-snug mb-1.5" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}>
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <Calendar size={11} className="text-[#C19A6B] flex-shrink-0" />
                  <span className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>
                    {item.date}
                  </span>
                </div>
                <p className="text-xs mt-1.5 line-clamp-2" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#7a6040' : '#A08060' }}>
                  {item.text?.substring(0, 120)}...
                </p>
              </div>
              <ChevronLeft size={16} className="text-[#C19A6B]/50 flex-shrink-0 mt-1" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Event detail sheet */}
      <AnimatePresence>
        {activeItem && (
          <EventSheet item={activeItem} onClose={() => setActiveItem(null)} dark={dark} />
        )}
      </AnimatePresence>
    </div>
  );
}
