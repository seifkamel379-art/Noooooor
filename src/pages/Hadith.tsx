import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/* ── Book definitions with bold colors matching reference design ── */
const BOOKS = [
  {
    slug: 'sahih-bukhari',
    name: 'صحيح البخاري',
    iconBg: '#8B1A1A',
    total: 6638,
  },
  {
    slug: 'sahih-muslim',
    name: 'صحيح مسلم',
    iconBg: '#1A3A7A',
    total: 4930,
  },
  {
    slug: 'al-tirmidhi',
    name: 'جامع الترمذي',
    iconBg: '#1C2F6E',
    total: 3625,
  },
  {
    slug: 'abu-dawood',
    name: 'سنن أبي داود',
    iconBg: '#6B3010',
    total: 4419,
  },
  {
    slug: 'ibn-e-majah',
    name: 'سنن ابن ماجه',
    iconBg: '#7A5010',
    total: 4285,
  },
  {
    slug: 'sunan-nasai',
    name: 'سنن النسائي',
    iconBg: '#9B1515',
    total: 5364,
  },
];

type Book = typeof BOOKS[0];

interface HadithItem {
  id: number;
  hadithNumber: string;
  hadithArabic: string;
  hadithEnglish?: string;
  englishNarrator?: string;
}

interface HadithResponse {
  status: number;
  hadiths?: {
    current_page: number;
    last_page: number;
    total: number;
    data: HadithItem[];
  };
  error?: string;
}

const PAGE_SIZE = 10;

/* ── Book icon SVG (open book in white) ── */
function BookSvg() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
      <rect x="5" y="8" width="13" height="24" rx="2" stroke="white" strokeWidth="2" fill="none"/>
      <rect x="22" y="8" width="13" height="24" rx="2" stroke="white" strokeWidth="2" fill="none"/>
      <line x1="18" y1="8" x2="18" y2="32" stroke="white" strokeWidth="2"/>
      <line x1="22" y1="8" x2="22" y2="32" stroke="white" strokeWidth="2"/>
      <line x1="8" y1="14" x2="15" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="18" x2="15" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="22" x2="15" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="14" x2="32" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="18" x2="32" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Single Hadith card ────────────────────────────────────────── */
function HadithCard({ hadith, book }: { hadith: HadithItem; book: Book }) {
  const isDark = useDarkMode();
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: isDark ? 'rgba(193,154,107,0.04)' : 'rgba(193,154,107,0.03)',
        border: `1px solid rgba(193,154,107,${isDark ? '0.18' : '0.2'})`,
      }}
    >
      {/* شريط لوني رفيع للتمييز بين الكتب */}
      <div className="h-[3px] w-full" style={{ background: book.iconBg, opacity: isDark ? 0.8 : 0.7 }} />
      <div className="p-4">
        {/* رقم الحديث بألوان التطبيق */}
        <div
          className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
          style={{
            background: isDark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.12)',
            border: `1px solid rgba(193,154,107,${isDark ? '0.35' : '0.3'})`,
            color: isDark ? '#E8C98A' : '#7A4F1E',
            fontFamily: '"Tajawal", sans-serif',
          }}
        >
          حديث {parseInt(hadith.hadithNumber).toLocaleString('ar-EG')}
        </div>
        {hadith.englishNarrator && (
          <p
            className="text-xs mb-2 text-right"
            style={{
              color: isDark ? 'rgba(193,154,107,0.55)' : 'rgba(122,79,30,0.6)',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            {hadith.englishNarrator}
          </p>
        )}
        <p
          className="text-sm text-right"
          style={{
            fontFamily: '"Amiri", serif',
            lineHeight: '2.2rem',
            color: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(30,20,10,0.88)',
          }}
        >
          {hadith.hadithArabic}
        </p>
      </div>
    </div>
  );
}

/* ── Hadith reader ─────────────────────────────────────────────── */
function HadithReader({ book, onBack }: { book: Book; onBack: () => void }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<HadithResponse>({
    queryKey: ['/api/hadith/hadiths', book.slug, page],
    queryFn: async () => {
      const res = await fetch(`/api/hadith/hadiths?book=${book.slug}&page=${page}&paginate=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('فشل التحميل');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const hadiths = data?.hadiths?.data ?? [];
  const totalPages = data?.hadiths?.last_page ?? 1;
  const total = data?.hadiths?.total ?? book.total;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 bg-secondary rounded-xl hover-elevate"
          data-testid="button-hadith-back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {book.name}
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')} • {total.toLocaleString('ar-EG')} حديث
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 animate-pulse"
              style={{ background: 'rgba(193,154,107,0.04)', border: '1px solid rgba(193,154,107,0.15)' }}
            >
              <div className="h-3 rounded-full w-1/4 mb-3" style={{ background: 'rgba(193,154,107,0.12)' }} />
              <div className="space-y-2">
                <div className="h-3 rounded-full" style={{ background: 'rgba(193,154,107,0.08)' }} />
                <div className="h-3 rounded-full w-5/6" style={{ background: 'rgba(193,154,107,0.08)' }} />
                <div className="h-3 rounded-full w-4/5" style={{ background: 'rgba(193,154,107,0.08)' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 text-center">
          <p className="text-destructive text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            حدث خطأ أثناء التحميل
          </p>
          <p className="text-muted-foreground text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            تحقق من اتصال الإنترنت وأعد المحاولة
          </p>
        </div>
      )}

      {!isLoading && hadiths.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {hadiths.map((h) => (
              <HadithCard key={h.id} hadith={h} book={book} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => { setPage(p => p + 1); scrollToTop(); }}
            disabled={page >= totalPages}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
            data-testid="button-hadith-next"
          >
            <ChevronRight className="w-4 h-4" />
            التالي
          </button>

          <span
            className="text-xs text-muted-foreground whitespace-nowrap px-1"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            {page} / {totalPages.toLocaleString('ar-EG')}
          </span>

          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); scrollToTop(); }}
            disabled={page === 1}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
            data-testid="button-hadith-prev"
          >
            السابق
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Book list ─────────────────────────────────────────────────── */
function BookList({ onSelect }: { onSelect: (b: Book) => void }) {
  return (
    <div className="flex flex-col gap-3" dir="rtl">
      {BOOKS.map((book, i) => (
        <motion.button
          key={book.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(book)}
          className="w-full text-right bg-card border border-border rounded-2xl overflow-hidden hover-elevate"
          data-testid={`button-book-${book.slug}`}
        >
          <div className="p-4 flex items-center gap-4">
            {/* Left arrow */}
            <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />

            {/* Name + count — center */}
            <div className="flex-1 min-w-0 text-right">
              <p className="font-bold text-base text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {book.name}
              </p>
              <p
                className="text-xs font-semibold mt-0.5"
                style={{ color: book.iconBg, fontFamily: '"Tajawal", sans-serif', opacity: 0.9 }}
              >
                {book.total.toLocaleString('ar-EG')} حديث
              </p>
            </div>

            {/* Colored icon — right side */}
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: book.iconBg }}
            >
              <BookSvg />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export function Hadith() {
  const [selected, setSelected] = useState<Book | null>(null);

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0 sticky top-0 z-50">
        {selected ? (
          <button
            onClick={() => setSelected(null)}
            className="p-2 bg-secondary rounded-full hover-elevate"
            data-testid="button-back-to-books"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/more">
            <button className="p-2 bg-secondary rounded-full hover-elevate" data-testid="button-nav-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-xl truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {selected ? selected.name : 'الأحاديث الشريفة'}
          </h1>
          {!selected && (
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              كتب الحديث الكبرى
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="books"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-5 text-center">
                  <p
                    className="text-2xl font-black text-primary"
                    style={{ fontFamily: '"Amiri", serif' }}
                  >
                    الأحاديث النبوية الشريفة
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    اختر كتاباً للقراءة
                  </p>
                </div>
                <BookList onSelect={setSelected} />
                <div className="mt-5 text-center">
                  <p className="text-xs text-muted-foreground/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    المصدر: hadithapi.com
                  </p>
                </div>
                <div className="mt-6 mb-4 text-center px-2">
                  <div className="h-px mb-4 opacity-20" style={{ background: 'linear-gradient(to left, transparent, currentColor, transparent)' }} />
                  <p className="text-sm leading-loose text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
                    إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى ۝ متفق عليه
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selected.slug}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <HadithReader book={selected} onBack={() => setSelected(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
