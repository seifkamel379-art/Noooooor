import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Scroll, ArrowRight } from 'lucide-react';

/* ── Static data ──────────────────────────────────────────────── */

const TAFSIR_BOOKS = [
  { id: 14, name: 'تفسير ابن كثير',       author: 'الحافظ ابن كثير',               color: '#B45309', bg: '#FEF3C7' },
  { id: 15, name: 'تفسير الطبري',          author: 'الإمام محمد بن جرير الطبري',    color: '#065F46', bg: '#D1FAE5' },
  { id: 90, name: 'تفسير القرطبي',         author: 'الإمام القرطبي',                color: '#1D4ED8', bg: '#DBEAFE' },
  { id: 16, name: 'التفسير الميسَّر',      author: 'مجمع الملك فهد',                color: '#6D28D9', bg: '#EDE9FE' },
  { id: 91, name: 'تفسير السعدي',          author: 'الشيخ عبد الرحمن السعدي',      color: '#0E7490', bg: '#CFFAFE' },
  { id: 93, name: 'التفسير الوسيط',        author: 'الشيخ محمد سيد طنطاوي',         color: '#BE185D', bg: '#FCE7F3' },
  { id: 94, name: 'تفسير البغوي',          author: 'الإمام البغوي',                 color: '#92400E', bg: '#FDE68A' },
];

const HADITH_BOOKS = [
  { id: 'bukhari',    name: 'صحيح البخاري',   count: 6638, color: 'hsl(33,42%,45%)', bg: 'hsl(33,42%,93%)' },
  { id: 'muslim',     name: 'صحيح مسلم',      count: 4930, color: 'hsl(25,45%,42%)', bg: 'hsl(25,45%,93%)' },
  { id: 'abu-daud',   name: 'سنن أبي داود',   count: 4419, color: 'hsl(40,50%,40%)', bg: 'hsl(40,50%,92%)' },
  { id: 'tirmidzi',   name: 'جامع الترمذي',   count: 3625, color: 'hsl(18,48%,42%)', bg: 'hsl(18,48%,93%)' },
  { id: 'nasai',      name: 'سنن النسائي',    count: 5364, color: 'hsl(45,55%,38%)', bg: 'hsl(45,55%,92%)' },
  { id: 'ibnu-majah', name: 'سنن ابن ماجه',   count: 4285, color: 'hsl(12,52%,40%)', bg: 'hsl(12,52%,93%)' },
  { id: 'malik',      name: 'موطأ الإمام مالك', count: 1587, color: 'hsl(30,40%,38%)', bg: 'hsl(30,40%,93%)' },
  { id: 'darimi',     name: 'سنن الدارمي',    count: 2949, color: 'hsl(22,44%,44%)', bg: 'hsl(22,44%,93%)' },
];

const SURAH_NAMES: Record<number, string> = {
  1:'الفاتحة',2:'البقرة',3:'آل عمران',4:'النساء',5:'المائدة',6:'الأنعام',7:'الأعراف',
  8:'الأنفال',9:'التوبة',10:'يونس',11:'هود',12:'يوسف',13:'الرعد',14:'إبراهيم',
  15:'الحجر',16:'النحل',17:'الإسراء',18:'الكهف',19:'مريم',20:'طه',21:'الأنبياء',
  22:'الحج',23:'المؤمنون',24:'النور',25:'الفرقان',26:'الشعراء',27:'النمل',28:'القصص',
  29:'العنكبوت',30:'الروم',31:'لقمان',32:'السجدة',33:'الأحزاب',34:'سبأ',35:'فاطر',
  36:'يس',37:'الصافات',38:'ص',39:'الزمر',40:'غافر',41:'فصلت',42:'الشورى',43:'الزخرف',
  44:'الدخان',45:'الجاثية',46:'الأحقاف',47:'محمد',48:'الفتح',49:'الحجرات',50:'ق',
  51:'الذاريات',52:'الطور',53:'النجم',54:'القمر',55:'الرحمن',56:'الواقعة',57:'الحديد',
  58:'المجادلة',59:'الحشر',60:'الممتحنة',61:'الصف',62:'الجمعة',63:'المنافقون',64:'التغابن',
  65:'الطلاق',66:'التحريم',67:'الملك',68:'القلم',69:'الحاقة',70:'المعارج',71:'نوح',
  72:'الجن',73:'المزمل',74:'المدثر',75:'القيامة',76:'الإنسان',77:'المرسلات',78:'النبأ',
  79:'النازعات',80:'عبس',81:'التكوير',82:'الانفطار',83:'المطففين',84:'الانشقاق',85:'البروج',
  86:'الطارق',87:'الأعلى',88:'الغاشية',89:'الفجر',90:'البلد',91:'الشمس',92:'الليل',
  93:'الضحى',94:'الشرح',95:'التين',96:'العلق',97:'القدر',98:'البينة',99:'الزلزلة',
  100:'العاديات',101:'القارعة',102:'التكاثر',103:'العصر',104:'الهمزة',105:'الفيل',
  106:'قريش',107:'الماعون',108:'الكوثر',109:'الكافرون',110:'النصر',111:'المسد',
  112:'الإخلاص',113:'الفلق',114:'الناس',
};

const PAGE_SIZE = 8;

/* ── Sub-components ───────────────────────────────────────────── */

function BookCard({
  title, author, count, color, bg, darkColor,
  onClick, label,
}: {
  title: string; author: string; count?: number; color: string;
  bg: string; darkColor: string; onClick: () => void; label?: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-right bg-card border border-border rounded-2xl overflow-hidden hover-elevate"
    >
      {/* Colored top bar */}
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base text-foreground leading-snug" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {title}
            </p>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {author}
            </p>
            {count !== undefined && (
              <p className="text-xs mt-2 font-bold" style={{ color, fontFamily: '"Tajawal", sans-serif' }}>
                {count.toLocaleString('ar-EG')} {label ?? 'حديث'}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <BookOpen className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs font-bold" style={{ color }}>
          <span style={{ fontFamily: '"Tajawal", sans-serif' }}>ابدأ القراءة</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.button>
  );
}

/* ── Tafsir reader ────────────────────────────────────────────── */

function TafsirReader({ book, onBack }: { book: typeof TAFSIR_BOOKS[0]; onBack: () => void }) {
  const [chapter, setChapter] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['/quran-tafsir', book.id, chapter],
    queryFn: async () => {
      const res = await fetch(`https://api.quran.com/api/v4/tafsirs/${book.id}/by_chapter/${chapter}?language=ar`);
      if (!res.ok) throw new Error('فشل التحميل');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-2 bg-secondary rounded-xl hover-elevate">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>{book.name}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>سورة {SURAH_NAMES[chapter]}</p>
        </div>
      </div>

      {/* Chapter navigator */}
      <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 mb-4">
        <button
          onClick={() => setChapter(c => Math.max(1, c - 1))}
          disabled={chapter === 1}
          className="p-1.5 bg-secondary rounded-lg disabled:opacity-30 hover-elevate"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-bold text-sm text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {SURAH_NAMES[chapter]}
          </p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            سورة {chapter.toLocaleString('ar-EG')}
          </p>
        </div>
        <button
          onClick={() => setChapter(c => Math.min(114, c + 1))}
          disabled={chapter === 114}
          className="p-1.5 bg-secondary rounded-lg disabled:opacity-30 hover-elevate"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Surah quick-jump chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar">
        {[1, 2, 36, 55, 67, 78, 112, 113, 114].map(n => (
          <button
            key={n}
            onClick={() => setChapter(n)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              chapter === n
                ? 'text-white border-transparent'
                : 'bg-card text-muted-foreground border-border'
            }`}
            style={{
              background: chapter === n ? book.color : undefined,
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            {SURAH_NAMES[n]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-secondary rounded-full w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded-full" />
                <div className="h-3 bg-secondary rounded-full w-5/6" />
                <div className="h-3 bg-secondary rounded-full w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tafsir verses */}
      {!isLoading && data?.tafsirs && (
        <div className="space-y-3">
          {data.tafsirs.map((v: { verse_key: string; text: string }) => (
            <div key={v.verse_key} className="bg-card border border-border rounded-2xl p-4">
              <div
                className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
                style={{ background: book.bg, color: book.color, fontFamily: '"Tajawal", sans-serif' }}
              >
                آية {v.verse_key.split(':')[1]}
              </div>
              <p
                className="text-sm text-foreground leading-loose"
                style={{ fontFamily: '"Amiri", serif', lineHeight: '2.2rem' }}
                dangerouslySetInnerHTML={{ __html: v.text ?? '' }}
              />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !data?.tafsirs && (
        <div className="text-center py-12">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            تعذّر تحميل التفسير، حاول مرة أخرى
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Hadith reader ────────────────────────────────────────────── */

function HadithReader({ book, onBack }: { book: typeof HADITH_BOOKS[0]; onBack: () => void }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(book.count / PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ['/hadith-gading', book.id, page],
    queryFn: async () => {
      const start = (page - 1) * PAGE_SIZE + 1;
      const end = start + PAGE_SIZE - 1;
      const res = await fetch(`https://api.hadith.gading.dev/books/${book.id}?range=${start}-${end}`);
      if (!res.ok) throw new Error('فشل التحميل');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-2 bg-secondary rounded-xl hover-elevate">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <p className="font-bold text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{book.name}</p>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            صفحة {page.toLocaleString('ar-EG')} من {totalPages.toLocaleString('ar-EG')} • {book.count.toLocaleString('ar-EG')} حديث
          </p>
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-secondary rounded-full w-1/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-secondary rounded-full" />
                <div className="h-3 bg-secondary rounded-full w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hadiths */}
      {!isLoading && data?.data?.hadiths && (
        <div className="space-y-3">
          {data.data.hadiths.map((h: { number: number; arab: string }) => (
            <div key={h.number} className="bg-card border border-border rounded-2xl p-4">
              <div
                className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
                style={{ background: book.bg, color: book.color, fontFamily: '"Tajawal", sans-serif' }}
              >
                حديث {h.number.toLocaleString('ar-EG')}
              </div>
              <p
                className="text-sm text-foreground"
                style={{ fontFamily: '"Amiri", serif', lineHeight: '2.2rem' }}
              >
                {h.arab}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && data?.data && (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
            disabled={page >= totalPages}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            <ChevronRight className="w-4 h-4" />
            التالي
          </button>

          <span className="text-xs text-muted-foreground whitespace-nowrap" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {page} / {totalPages.toLocaleString('ar-EG')}
          </span>

          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={page === 1}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-secondary rounded-xl font-bold text-sm disabled:opacity-30 hover-elevate"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            السابق
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */

type Tab = 'tafsir' | 'hadith';

export function IslamicLibrary() {
  const [tab, setTab] = useState<Tab>('tafsir');
  const [selectedTafsir, setSelectedTafsir] = useState<typeof TAFSIR_BOOKS[0] | null>(null);
  const [selectedHadith, setSelectedHadith] = useState<typeof HADITH_BOOKS[0] | null>(null);

  const inReader = selectedTafsir || selectedHadith;

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto overflow-y-auto h-full" dir="rtl">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          المكتبة الإسلامية الشاملة
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          تفاسير القرآن الكريم • موسوعة الحديث الشريف
        </p>
      </div>

      {/* Tabs — hidden when inside a reader */}
      {!inReader && (
        <div className="flex gap-2 mb-5 p-1 bg-secondary rounded-xl">
          {([
            { key: 'tafsir', label: 'تفاسير القرآن', Icon: BookOpen },
            { key: 'hadith', label: 'الحديث الشريف', Icon: Scroll  },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
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
      )}

      <AnimatePresence mode="wait">

        {/* ── Tafsir tab ── */}
        {tab === 'tafsir' && !selectedTafsir && (
          <motion.div
            key="tafsir-list"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {TAFSIR_BOOKS.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <BookCard
                  title={b.name} author={b.author}
                  color={b.color} bg={b.bg} darkColor={b.color}
                  label="سورة"
                  onClick={() => setSelectedTafsir(b)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'tafsir' && selectedTafsir && (
          <motion.div
            key="tafsir-reader"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <TafsirReader book={selectedTafsir} onBack={() => setSelectedTafsir(null)} />
          </motion.div>
        )}

        {/* ── Hadith tab ── */}
        {tab === 'hadith' && !selectedHadith && (
          <motion.div
            key="hadith-list"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {HADITH_BOOKS.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <BookCard
                  title={b.name} author=""
                  count={b.count} color={b.color} bg={b.bg} darkColor={b.color}
                  onClick={() => setSelectedHadith(b)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'hadith' && selectedHadith && (
          <motion.div
            key="hadith-reader"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <HadithReader book={selectedHadith} onBack={() => setSelectedHadith(null)} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
