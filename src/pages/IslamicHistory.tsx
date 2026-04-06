import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, BookOpen, Search, X, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { useLocalStorage } from '@/hooks/use-local-storage';

type Era = 'pre' | 'seerah' | 'rashidun' | 'umayyad' | 'abbasid' | 'ottoman';

type HistoryItem = {
  id: number;
  title: string;
  date: string;
  text: string;
  era: Era;
};

const ERAS: { id: Era; label: string; sub: string; grad: string }[] = [
  { id: 'pre',      label: 'ما قبل الهجرة',    sub: 'من الجاهلية حتى فجر الإسلام',             grad: 'linear-gradient(135deg,#4a2040,#2a1030)' },
  { id: 'seerah',   label: 'السيرة النبوية',     sub: 'من المولد الشريف حتى الوفاة الشريفة',      grad: 'linear-gradient(135deg,#1b4332,#0d2b1e)' },
  { id: 'rashidun', label: 'الخلفاء الراشدون',  sub: 'من 11 إلى 40 هـ',                          grad: 'linear-gradient(135deg,#1e3a6e,#0f2040)' },
  { id: 'umayyad',  label: 'الدولة الأموية',     sub: 'من 41 إلى 132 هـ',                         grad: 'linear-gradient(135deg,#6b3a0f,#3d2008)' },
  { id: 'abbasid',  label: 'الدولة العباسية',    sub: 'من 132 إلى 656 هـ',                        grad: 'linear-gradient(135deg,#3a1a5c,#1e0d30)' },
  { id: 'ottoman',  label: 'الدولة العثمانية',   sub: 'من 657 إلى 1342 هـ',                       grad: 'linear-gradient(135deg,#0f3d2e,#072218)' },
];

/* ── Footer Dhikr ── */
const DHIKR = 'إِنَّ فِي ذَٰلِكَ لَذِكْرَىٰ لِمَن كَانَ لَهُ قَلْبٌ أَوْ أَلْقَى السَّمْعَ وَهُوَ شَهِيدٌ ۝ ق: 37';

/* ── Event Detail Sheet ── */
function EventSheet({ item, onClose, dark }: { item: HistoryItem | null; onClose: () => void; dark: boolean }) {
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [item]);

  if (!item) return null;

  const bg = dark ? '#1a1208' : '#fdfbf0';
  const border = dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.25)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      dir="rtl"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-t-3xl shadow-2xl flex flex-col"
        style={{ background: bg, maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2" style={{ background: 'rgba(193,154,107,0.4)' }} />
        <div className="flex items-center justify-between px-5 pb-3 border-b flex-shrink-0" style={{ borderColor: border }}>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)' }}
          >
            <X size={16} className="text-[#C19A6B]" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#C19A6B]" />
            <span className="text-xs text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.date}</span>
          </div>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1">
          <h2
            className="text-lg font-bold mb-4 leading-relaxed"
            style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}
          >
            {item.title}
          </h2>
          <p
            className="text-sm leading-loose"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              color: dark ? '#b0956a' : '#6D4C41',
              paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            }}
          >
            {item.text}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── HistoryCard (memoized to avoid re-render lag) ── */
const HistoryCard = ({
  item, dark, cardBg, border, onSelect,
}: {
  item: HistoryItem;
  dark: boolean;
  cardBg: string;
  border: string;
  onSelect: (i: HistoryItem) => void;
}) => {
  const handleClick = useCallback(() => onSelect(item), [item, onSelect]);
  return (
    <button
      onClick={handleClick}
      className="w-full text-right p-4 rounded-2xl flex items-start gap-3 active:scale-[0.99] transition-transform"
      style={{ background: cardBg, border: `1px solid ${border}` }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="font-bold text-sm leading-snug mb-1.5"
          style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#d4b483' : '#5D4037' }}
        >
          {item.title}
        </p>
        <div className="flex items-center gap-1.5">
          <Calendar size={11} className="text-[#C19A6B] flex-shrink-0" />
          <span className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#8B6B3D' : '#9E7B4A' }}>
            {item.date}
          </span>
        </div>
        {item.text && item.text !== item.title && (
          <p
            className="text-xs mt-1.5 line-clamp-2"
            style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#7a6040' : '#A08060' }}
          >
            {item.text.substring(0, 120)}...
          </p>
        )}
      </div>
      <ChevronLeft size={16} className="text-[#C19A6B]/50 flex-shrink-0 mt-1" />
    </button>
  );
};

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

  /* Memoize filtered list to avoid recompute on every render */
  const filtered = useMemo(() => {
    const eraItems = items.filter(i => i.era === selectedEra);
    if (!search.trim()) return eraItems;
    const q = search.trim();
    return eraItems.filter(i => i.title.includes(q) || i.text.includes(q));
  }, [items, selectedEra, search]);

  const handleSelect = useCallback((item: HistoryItem) => setActiveItem(item), []);

  const bg = dark ? '#0f0c07' : '#FDFBF0';
  const cardBg = dark ? '#1a1208' : '#fff';
  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';
  const textPrimary = dark ? '#d4b483' : '#5D4037';
  const textSec = dark ? '#8B6B3D' : '#9E7B4A';

  return (
    <div className="min-h-screen pb-36" dir="rtl" style={{ background: bg }}>

      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-4 pb-3" style={{ background: bg, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto mb-3">
          <button
            onClick={() => navigate('/more')}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)' }}
          >
            <ChevronLeft size={20} className="text-[#C19A6B]" style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: textPrimary }}>
              التاريخ الإسلامي
            </h1>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
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
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: dark ? '#1a1208' : '#f5edd8',
              color: textPrimary,
              border: `1px solid ${border}`,
            }}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">

        {/* Era chips */}
        <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
          {ERAS.map(era => (
            <button
              key={era.id}
              onClick={() => { setSelectedEra(era.id); setSearch(''); }}
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
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: textSec }}>
              {ERAS.find(e => e.id === selectedEra)?.sub}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col gap-3 mt-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)' }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 opacity-50">
            <BookOpen size={32} className="text-[#C19A6B] mx-auto mb-3" />
            <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: dark ? '#C19A6B' : '#8B6B3D' }}>لا توجد نتائج</p>
          </div>
        )}

        {/* Events list */}
        <div className="flex flex-col gap-2.5">
          {filtered.map(item => (
            <HistoryCard
              key={item.id}
              item={item}
              dark={dark}
              cardBg={cardBg}
              border={border}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Footer dhikr */}
        {!loading && (
          <div className="mt-8 mb-4 text-center px-4">
            <div className="h-px mb-4" style={{ background: `linear-gradient(to left, transparent, ${border}, transparent)` }} />
            <p className="text-sm leading-loose" style={{ fontFamily: '"Amiri", serif', color: dark ? '#8B6B3D' : '#B8946A' }}>
              {DHIKR}
            </p>
          </div>
        )}
      </div>

      {/* Sheet */}
      <EventSheet item={activeItem} onClose={() => setActiveItem(null)} dark={dark} />
    </div>
  );
}
