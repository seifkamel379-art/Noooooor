import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Search } from 'lucide-react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Static book definitions ──────────────────────────────────── */
const BOOKS = [
  { slug: 'sahih-bukhari',     name: 'صحيح البخاري',       color: '#B45309', bg: '#FEF3C7', darkColor: '#FBBF24', total: 6638 },
  { slug: 'sahih-muslim',      name: 'صحيح مسلم',          color: '#065F46', bg: '#D1FAE5', darkColor: '#34D399', total: 4930 },
  { slug: 'al-tirmidhi',       name: 'جامع الترمذي',        color: '#6D28D9', bg: '#EDE9FE', darkColor: '#A78BFA', total: 3625 },
  { slug: 'abu-dawood',        name: 'سنن أبي داود',        color: '#1D4ED8', bg: '#DBEAFE', darkColor: '#60A5FA', total: 4419 },
  { slug: 'ibn-e-majah',       name: 'سنن ابن ماجه',        color: '#BE185D', bg: '#FCE7F3', darkColor: '#F472B6', total: 4285 },
  { slug: 'sunan-nasai',       name: 'سنن النسائي',         color: '#0E7490', bg: '#CFFAFE', darkColor: '#22D3EE', total: 5364 },
  { slug: 'mishkat-ul-masabih',name: 'مشكاة المصابيح',      color: '#92400E', bg: '#FDE68A', darkColor: '#FCD34D', total: 4005 },
  { slug: 'musnad-ahmad',      name: 'مسند الإمام أحمد',    color: '#166534', bg: '#DCFCE7', darkColor: '#4ADE80', total: 4305 },
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

/* ── Single Hadith card ────────────────────────────────────────── */
function HadithCard({ hadith, book }: { hadith: HadithItem; book: Book }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="h-1 w-full" style={{ background: book.color }} />
      <div className="p-4">
        <div
          className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
          style={{ background: book.bg, color: book.color, fontFamily: '"Tajawal", sans-serif' }}
        >
          حديث {parseInt(hadith.hadithNumber).toLocaleString('ar-EG')}
        </div>
        {hadith.englishNarrator && (
          <p className="text-xs text-muted-foreground mb-2 text-right" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {hadith.englishNarrator}
          </p>
        )}
        <p
          className="text-sm text-foreground leading-loose text-right"
          style={{ fontFamily: '"Amiri", serif', lineHeight: '2.2rem' }}
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
      {/* Sub-header */}
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

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-secondary rounded-full w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded-full" />
                <div className="h-3 bg-secondary rounded-full w-5/6" />
                <div className="h-3 bg-secondary rounded-full w-4/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
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

      {/* Hadiths list */}
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

      {/* Pagination */}
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
    <div className="grid grid-cols-1 gap-3" dir="rtl">
      {BOOKS.map((book, i) => (
        <motion.button
          key={book.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelect(book)}
          className="w-full text-right bg-card border border-border rounded-2xl overflow-hidden hover-elevate"
          data-testid={`button-book-${book.slug}`}
        >
          <div className="h-1.5 w-full" style={{ background: book.color }} />
          <div className="p-4 flex items-center gap-4">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: book.bg }}
            >
              <BookOpen className="w-6 h-6" style={{ color: book.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {book.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-bold" style={{ color: book.color, fontFamily: '"Tajawal", sans-serif' }}>
                {book.total.toLocaleString('ar-EG')} حديث
              </p>
            </div>
            <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
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
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
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
                {/* Decorative header */}
                <div className="mb-5 text-center">
                  <div className="inline-flex flex-col items-center gap-1">
                    <p
                      className="text-2xl font-black text-primary"
                      style={{ fontFamily: '"Amiri", serif' }}
                    >
                      الأحاديث النبوية الشريفة
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      اختر كتاباً للقراءة
                    </p>
                  </div>
                </div>
                <BookList onSelect={setSelected} />

                {/* Data source note */}
                <div className="mt-5 text-center">
                  <p className="text-xs text-muted-foreground/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    المصدر: hadithapi.com
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
