import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, FileText, Headphones, Video, Monitor, Scale,
  Scroll, ChevronLeft, ChevronRight, ExternalLink, Library,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LIBRARY_CATEGORIES = [
  {
    id: 'books',
    label: 'الكتب الإسلامية',
    Icon: BookOpen,
    desc: 'آلاف الكتب في شتى العلوم الشرعية',
    url: 'https://islamhouse.com/ar/books/',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    id: 'fatawa',
    label: 'الفتاوى الشرعية',
    Icon: Scale,
    desc: 'فتاوى العلماء في المسائل الشرعية',
    url: 'https://islamhouse.com/ar/fatwas/',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'articles',
    label: 'المقالات والأبحاث',
    Icon: FileText,
    desc: 'مقالات ودراسات في مجالات متعددة',
    url: 'https://islamhouse.com/ar/articles/',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'audio',
    label: 'المحاضرات الصوتية',
    Icon: Headphones,
    desc: 'دروس ومحاضرات لكبار العلماء',
    url: 'https://islamhouse.com/ar/audios/',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    id: 'video',
    label: 'المحاضرات المرئية',
    Icon: Video,
    desc: 'مقاطع ودروس مرئية متنوعة',
    url: 'https://islamhouse.com/ar/videos/',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'programs',
    label: 'البرامج والتطبيقات',
    Icon: Monitor,
    desc: 'تطبيقات وبرامج إسلامية متخصصة',
    url: 'https://islamhouse.com/ar/programs/',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const HADITH_BOOKS = [
  { id: 'bukhari',   name: 'صحيح البخاري',  count: 7563, color: 'text-amber-600',   bg: 'bg-amber-500/10' },
  { id: 'muslim',    name: 'صحيح مسلم',     count: 5362, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { id: 'abu-daud',  name: 'سنن أبي داود',  count: 5274, color: 'text-blue-600',    bg: 'bg-blue-500/10' },
  { id: 'tirmizi',   name: 'جامع الترمذي',  count: 3956, color: 'text-purple-600',  bg: 'bg-purple-500/10' },
  { id: 'nasai',     name: 'سنن النسائي',   count: 5758, color: 'text-rose-600',    bg: 'bg-rose-500/10' },
  { id: 'ibnu-majah',name: 'سنن ابن ماجه',  count: 4341, color: 'text-cyan-600',    bg: 'bg-cyan-500/10' },
];

const PAGE_SIZE = 8;

export function IslamicLibrary() {
  const [tab, setTab] = useState<'library' | 'hadith'>('library');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const currentBook = HADITH_BOOKS.find(b => b.id === selectedBook);

  const { data: hadithData, isLoading } = useQuery({
    queryKey: ['/hadith-gading', selectedBook, page],
    queryFn: async () => {
      const start = (page - 1) * PAGE_SIZE + 1;
      const end = start + PAGE_SIZE - 1;
      const res = await fetch(
        `https://api.hadith.gading.dev/books/${selectedBook}?range=${start}-${end}`
      );
      if (!res.ok) throw new Error('فشل تحميل الأحاديث');
      return res.json();
    },
    enabled: !!selectedBook,
    staleTime: 5 * 60 * 1000,
  });

  const totalPages = currentBook
    ? Math.ceil(currentBook.count / PAGE_SIZE)
    : 1;

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto overflow-y-auto h-full" dir="rtl">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          المكتبة الإسلامية الشاملة
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          أبحاث، كتب، وموسوعة الحديث الشريف
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-secondary rounded-xl">
        {[
          { key: 'library', label: 'المكتبة الشاملة', Icon: Library },
          { key: 'hadith',  label: 'الحديث الشريف',   Icon: Scroll  },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key as 'library' | 'hadith'); setSelectedBook(null); setPage(1); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
              tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Library Tab ── */}
        {tab === 'library' && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Info card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="bg-primary/15 p-2 rounded-xl mt-0.5">
                  <Library className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-primary text-sm mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    إسلام هاوس — IslamHouse
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    مكتبة إسلامية شاملة تضم آلاف الكتب والمقالات والفتاوى بأكثر من ١٢٠ لغة، مع تصنيفات دقيقة ومواد دعوية متنوعة.
                  </p>
                  <a
                    href="https://islamhouse.com/ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-bold"
                    style={{ fontFamily: '"Tajawal", sans-serif' }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    زيارة الموقع الرئيسي
                  </a>
                </div>
              </div>
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-2 gap-3">
              {LIBRARY_CATEGORIES.map((cat, i) => (
                <motion.a
                  key={cat.id}
                  href={cat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover-elevate"
                >
                  <div className={`w-11 h-11 rounded-xl ${cat.bg} flex items-center justify-center`}>
                    <cat.Icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground leading-snug" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {cat.desc}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${cat.color} font-bold`}>
                    <ExternalLink className="w-3 h-3" />
                    <span style={{ fontFamily: '"Tajawal", sans-serif' }}>فتح القسم</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Hadith Tab ── */}
        {tab === 'hadith' && (
          <motion.div
            key="hadith"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {!selectedBook ? (
              /* Book selector */
              <div>
                <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  اختر كتاباً من الكتب الستة:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {HADITH_BOOKS.map((book, i) => (
                    <motion.button
                      key={book.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      onClick={() => { setSelectedBook(book.id); setPage(1); }}
                      className="bg-card border border-border rounded-2xl p-4 text-right hover-elevate"
                    >
                      <div className={`w-11 h-11 rounded-xl ${book.bg} flex items-center justify-center mb-3`}>
                        <Scroll className={`w-5 h-5 ${book.color}`} />
                      </div>
                      <p className="font-bold text-sm text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {book.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                        {book.count.toLocaleString('ar-EG')} حديث
                      </p>
                    </motion.button>
                  ))}
                </div>

                {/* HadithAPI info */}
                <div className="mt-5 bg-secondary/60 border border-border rounded-2xl p-4">
                  <p className="font-bold text-sm text-foreground mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    موسوعة الحديث الشريف
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    الكتب الستة كاملة: البخاري، مسلم، أبو داود، الترمذي، النسائي، وابن ماجه — مع درجة صحة كل حديث.
                  </p>
                </div>
              </div>
            ) : (
              /* Hadiths list */
              <div>
                {/* Back button + book title */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="p-2 bg-secondary rounded-xl hover-elevate"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="font-bold text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {currentBook?.name}
                    </h2>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>

                {/* Loading skeletons */}
                {isLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                        <div className="h-3 bg-secondary rounded-full w-1/4 mb-3" />
                        <div className="h-3 bg-secondary rounded-full mb-2" />
                        <div className="h-3 bg-secondary rounded-full w-5/6 mb-2" />
                        <div className="h-3 bg-secondary rounded-full w-4/6" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Hadiths */}
                {!isLoading && hadithData?.data?.hadiths && (
                  <div className="space-y-3">
                    {hadithData.data.hadiths.map((h: { number: number; arab: string }) => (
                      <motion.div
                        key={h.number}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-card border border-border rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold"
                            style={{ fontFamily: '"Tajawal", sans-serif' }}
                          >
                            حديث {h.number.toLocaleString('ar-EG')}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${currentBook?.bg.replace('/10', '')}`} />
                        </div>
                        <p
                          className="text-sm leading-loose text-foreground"
                          style={{ fontFamily: '"Amiri", serif', lineHeight: '2rem' }}
                        >
                          {h.arab}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Error state */}
                {!isLoading && !hadithData?.data && (
                  <div className="text-center py-12">
                    <Scroll className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      تعذّر تحميل الأحاديث، حاول مرة أخرى
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {!isLoading && hadithData?.data && (
                  <div className="flex items-center justify-between mt-4 gap-3">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
                      style={{ fontFamily: '"Tajawal", sans-serif' }}
                    >
                      <ChevronRight className="w-4 h-4" />
                      التالي
                    </button>

                    <span
                      className="text-sm text-muted-foreground whitespace-nowrap"
                      style={{ fontFamily: '"Tajawal", sans-serif' }}
                    >
                      {page} / {totalPages.toLocaleString('ar-EG')}
                    </span>

                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
                      style={{ fontFamily: '"Tajawal", sans-serif' }}
                    >
                      السابق
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
