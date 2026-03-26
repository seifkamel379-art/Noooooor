import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuranSurahs, useSurah, useTafsir } from '@/hooks/use-api';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { SURAH_NAMES } from '@/lib/constants';
import { Search, Headphones, FileText, Bookmark, X, ChevronRight } from 'lucide-react';
import { padZero, cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

const FONT_MIN = 1.2;
const FONT_MAX = 2.8;
const FONT_STEP = 0.15;

type Mode = 'normal' | 'listen' | 'tafsir';

function getWordAudioUrl(surah: number, ayah: number, wordIdx: number): string {
  return `https://audio.qurancdn.com/wbw/${padZero(surah, 3)}_${padZero(ayah, 3)}_${padZero(wordIdx, 3)}.mp3`;
}

function AyahMarker({ num, bookmarked, dark }: { num: number; bookmarked?: boolean; dark: boolean }) {
  return (
    <span className="inline-block align-middle mx-1" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
      <svg width="28" height="28" viewBox="0 0 100 100" style={{ display: 'inline', verticalAlign: 'middle' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={bookmarked ? '#C19A6B' : dark ? '#7a5c2a' : '#C19A6B'} strokeWidth="2.5" />
        <circle cx="50" cy="50" r="38" fill={bookmarked ? 'rgba(193,154,107,0.25)' : 'rgba(193,154,107,0.08)'} stroke={bookmarked ? '#C19A6B' : dark ? '#5a3e18' : 'rgba(193,154,107,0.5)'} strokeWidth="1.5" />
        <text x="50" y="56" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: num > 99 ? '28px' : '32px', fill: bookmarked ? '#C19A6B' : dark ? '#c9a96e' : '#8B5E3C', fontFamily: 'serif', fontWeight: 'bold' }}>
          {num}
        </text>
      </svg>
    </span>
  );
}

export function Quran() {
  const { data: surahs, isLoading: loadingList } = useQuranSurahs();
  const [theme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [scrollToAyah, setScrollToAyah] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const { data: surahData, isLoading: loadingSurah } = useSurah(selectedSurah ?? 0);

  const [mode, setMode] = useState<Mode>('normal');
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [currentHizb, setCurrentHizb] = useState<number | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);

  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: tafsirData } = useTafsir(selectedSurah ?? 0, activeAyah ?? 0);

  const [bookmark, setBookmark] = useLocalStorage<{ surah: number; ayah: number } | null>('quran_bookmark', null);
  const [fontSize, setFontSize] = useLocalStorage<number>('quran_font_size', 1.75);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + FONT_STEP, FONT_MAX));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - FONT_STEP, FONT_MIN));
  const lineHeight = (fontSize * 2.0).toFixed(2) + 'rem';

  // Theme-dependent color palette
  const C = {
    pageBg: dark ? '#0f0c07' : '#FDFBF5',
    headerBg: dark ? '#130f08' : '#F7EDD6',
    headerBorder: dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.35)',
    headerShadow: dark ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(193,154,107,0.15)',
    mushafBg: dark
      ? 'linear-gradient(180deg, #1c1408 0%, #160f06 100%)'
      : 'linear-gradient(180deg, #FFFDF4 0%, #F8EFDB 100%)',
    mushafBorder: dark ? 'rgba(193,154,107,0.3)' : 'rgba(193,154,107,0.45)',
    mushafShadow: dark
      ? '0 0 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(193,154,107,0.15)'
      : '0 0 20px rgba(193,154,107,0.2), inset 0 1px 0 rgba(193,154,107,0.3)',
    ayahText: dark ? '#ddd0b0' : '#2C1E16',
    surahTitle: dark ? '#d4b483' : '#7a4e25',
    bismillah: dark ? '#b89050' : '#8B5E3C',
    searchBg: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
    searchText: dark ? '#e8d9b8' : '#2C1E16',
    searchBorder: dark ? 'rgba(193,154,107,0.25)' : 'rgba(193,154,107,0.4)',
    itemBg: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)',
    itemBorder: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.25)',
    itemText: dark ? '#e8d9b8' : '#2C1E16',
    subtleText: dark ? 'rgba(193,154,107,0.6)' : '#8B5E3C',
    modalBg: dark ? '#1a1208' : '#FFFDF4',
    modalBorder: dark ? 'rgba(193,154,107,0.3)' : 'rgba(193,154,107,0.4)',
    modalText: dark ? '#ddd0b0' : '#2C1E16',
    hinBg: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
    hintBorder: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.25)',
    btnBg: dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.15)',
    btnBorder: dark ? 'rgba(193,154,107,0.25)' : 'rgba(193,154,107,0.4)',
    bookmarkBg: dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.12)',
    bookmarkBorder: dark ? 'rgba(193,154,107,0.35)' : 'rgba(193,154,107,0.5)',
  };

  useEffect(() => {
    if (!wordAudioRef.current) {
      wordAudioRef.current = new Audio();
      wordAudioRef.current.onended = () => setPlayingWord(null);
      wordAudioRef.current.onerror = () => setPlayingWord(null);
    }
  }, []);

  // Scroll to ayah after surah loads
  useEffect(() => {
    if (!scrollToAyah || !surahData || loadingSurah) return;
    const timer = setTimeout(() => {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-ayah="${scrollToAyah}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollToAyah(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [scrollToAyah, surahData, loadingSurah]);

  const playWord = (surah: number, ayah: number, wordPos: number) => {
    const wordKey = `${surah}:${ayah}:${wordPos}`;
    if (!wordAudioRef.current) return;
    wordAudioRef.current.pause();
    wordAudioRef.current.src = getWordAudioUrl(surah, ayah, wordPos);
    wordAudioRef.current.load();
    wordAudioRef.current.play().catch(() => setPlayingWord(null));
    setPlayingWord(wordKey);
  };

  const handleAyahClick = (ayahNum: number) => {
    if (mode === 'normal') {
      setSelectedAyah(prev => prev === ayahNum ? null : ayahNum);
    } else if (mode === 'tafsir') {
      setActiveAyah(ayahNum);
    }
  };

  const handleWordClick = (ayahNum: number, wordIdx: number) => {
    if (mode !== 'listen' || !selectedSurah) return;
    playWord(selectedSurah, ayahNum, wordIdx);
  };

  const saveBookmark = (ayahNum: number) => {
    if (selectedSurah) setBookmark({ surah: selectedSurah, ayah: ayahNum });
    setSelectedAyah(null);
  };

  const goToBookmark = () => {
    if (!bookmark) return;
    if (bookmark.surah === selectedSurah) {
      const el = scrollRef.current?.querySelector<HTMLElement>(`[data-ayah="${bookmark.ayah}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setSelectedSurah(bookmark.surah);
      setScrollToAyah(bookmark.ayah);
    }
  };

  useEffect(() => {
    setCurrentJuz(null);
    setCurrentHizb(null);
    setSelectedAyah(null);
  }, [selectedSurah]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !surahData) return;
    const container = scrollRef.current;
    const ayahEls = container.querySelectorAll<HTMLElement>('[data-ayah]');
    const containerTop = container.scrollTop;
    for (const el of ayahEls) {
      if (el.offsetTop - containerTop > -10) {
        const juz = el.dataset.juz;
        const hizb = el.dataset.hizb;
        if (juz) setCurrentJuz(parseInt(juz));
        if (hizb) setCurrentHizb(parseFloat(hizb));
        break;
      }
    }
  }, [surahData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const filteredSurahs = surahs?.filter(
    s => (SURAH_NAMES[s.number] ?? s.name).includes(search) || s.englishName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Surah list ──
  if (!selectedSurah) {
    return (
      <div
        className="pb-24 pt-6 px-4 max-w-lg mx-auto h-screen flex flex-col"
        dir="rtl"
        style={{ background: C.pageBg }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}>
            <svg width="18" height="18" viewBox="0 0 40 40" fill="#C19A6B"><polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" /></svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>القرآن الكريم</h1>
        </div>

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#C19A6B', opacity: 0.6 }} />
          <input
            type="text"
            placeholder="ابحث عن سورة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full py-3 pr-10 pl-4 rounded-2xl outline-none text-sm"
            style={{
              background: C.searchBg,
              border: `1px solid ${C.searchBorder}`,
              color: C.searchText,
              fontFamily: '"Tajawal", sans-serif',
            }}
          />
        </div>

        {bookmark && (
          <button
            onClick={() => { setSelectedSurah(bookmark.surah); setScrollToAyah(bookmark.ayah); }}
            className="mb-4 p-4 rounded-2xl flex items-center justify-between transition-all"
            style={{ background: C.bookmarkBg, border: `1px solid ${C.bookmarkBorder}` }}
          >
            <div className="text-right">
              <p className="text-xs mb-1 flex items-center gap-1" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                <Bookmark className="w-3.5 h-3.5 fill-current" /> علامة محفوظة
              </p>
              <p className="font-bold text-sm" style={{ color: C.itemText, fontFamily: '"Tajawal", sans-serif' }}>
                سورة {SURAH_NAMES[bookmark.surah]} — الآية {bookmark.ayah}
              </p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: '#C19A6B' }} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {loadingList ? (
            <div className="text-center py-10 animate-pulse" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>جاري التحميل...</div>
          ) : (
            filteredSurahs?.map(s => (
              <button
                key={s.number}
                onClick={() => { setSelectedSurah(s.number); setMode('normal'); setSelectedAyah(null); setActiveAyah(null); }}
                className="w-full p-4 rounded-2xl flex items-center justify-between transition-all"
                style={{ background: C.itemBg, border: `1px solid ${C.itemBorder}` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: 'rgba(193,154,107,0.15)', border: '1px solid rgba(193,154,107,0.3)', color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
                    {s.number}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-base" style={{ fontFamily: '"Amiri", serif', color: C.itemText }}>{SURAH_NAMES[s.number] ?? s.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
                      {s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {s.numberOfAyahs} آية
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: 'rgba(193,154,107,0.4)' }} />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Surah reader ──
  const surahName = SURAH_NAMES[selectedSurah] ?? surahs?.find(s => s.number === selectedSurah)?.name ?? '';
  const hizbDisplay = currentHizb
    ? `حزب ${Math.ceil(currentHizb / 4)} • ربع ${Math.ceil(currentHizb) % 4 || 4}`
    : '';

  return (
    <div className="h-screen flex flex-col relative" dir="rtl" style={{ background: C.pageBg }}>
      {/* ── Header ── */}
      <div
        className="px-4 py-3 flex items-center justify-between z-10 flex-shrink-0"
        style={{ background: C.headerBg, borderBottom: `1px solid ${C.headerBorder}`, boxShadow: C.headerShadow }}
      >
        <button
          onClick={() => { setSelectedSurah(null); setMode('normal'); setSelectedAyah(null); setActiveAyah(null); wordAudioRef.current?.pause(); }}
          className="p-2 rounded-full"
          style={{ background: C.btnBg, border: `1px solid ${C.btnBorder}` }}
        >
          <X className="w-4 h-4" style={{ color: '#C19A6B' }} />
        </button>

        <div className="text-center flex-1 px-2">
          <h2 className="font-bold text-base" style={{ fontFamily: '"Amiri", serif', color: C.surahTitle }}>{surahName}</h2>
          <p className="text-xs" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>
            الجزء {currentJuz ?? surahData?.ayahs?.[0]?.juz ?? '—'}
            {hizbDisplay ? ` • ${hizbDisplay}` : ''}
          </p>
        </div>

        <div className="flex gap-1.5 items-center">
          {/* Font size controls */}
          <button
            onClick={decreaseFontSize}
            disabled={fontSize <= FONT_MIN}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 32, height: 32,
              background: C.btnBg,
              border: `1px solid ${C.btnBorder}`,
              color: fontSize <= FONT_MIN ? 'rgba(193,154,107,0.3)' : '#C19A6B',
              fontFamily: '"Amiri", serif',
              fontSize: '1rem',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
            title="تصغير الخط"
          >
            أ-
          </button>
          <button
            onClick={increaseFontSize}
            disabled={fontSize >= FONT_MAX}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 32, height: 32,
              background: C.btnBg,
              border: `1px solid ${C.btnBorder}`,
              color: fontSize >= FONT_MAX ? 'rgba(193,154,107,0.3)' : '#C19A6B',
              fontFamily: '"Amiri", serif',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
            title="تكبير الخط"
          >
            أ+
          </button>
          {bookmark && (
            <button
              onClick={goToBookmark}
              className="p-2 rounded-full relative"
              style={{ background: 'rgba(193,154,107,0.15)', border: `1px solid ${C.bookmarkBorder}` }}
              title="انتقل للعلامة المحفوظة"
            >
              <Bookmark className="w-4 h-4 fill-current" style={{ color: '#C19A6B' }} />
            </button>
          )}
          <button
            onClick={() => { setMode(mode === 'listen' ? 'normal' : 'listen'); setSelectedAyah(null); }}
            className="p-2 rounded-full transition-all"
            style={{
              background: mode === 'listen' ? '#C19A6B' : C.btnBg,
              border: `1px solid ${C.btnBorder}`,
            }}
          >
            <Headphones className="w-4 h-4" style={{ color: mode === 'listen' ? '#0f0c07' : '#C19A6B' }} />
          </button>
          <button
            onClick={() => { setMode(mode === 'tafsir' ? 'normal' : 'tafsir'); setSelectedAyah(null); }}
            className="p-2 rounded-full transition-all"
            style={{
              background: mode === 'tafsir' ? '#C19A6B' : C.btnBg,
              border: `1px solid ${C.btnBorder}`,
            }}
          >
            <FileText className="w-4 h-4" style={{ color: mode === 'tafsir' ? '#0f0c07' : '#C19A6B' }} />
          </button>
        </div>
      </div>

      {/* Mode hint */}
      {mode === 'listen' && (
        <div className="px-4 py-2 text-center flex-shrink-0" style={{ background: C.hinBg, borderBottom: `1px solid ${C.hintBorder}` }}>
          <p className="text-xs font-bold" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>👂 اضغط على أي كلمة لسماع نطقها</p>
        </div>
      )}
      {mode === 'tafsir' && (
        <div className="px-4 py-2 text-center flex-shrink-0" style={{ background: C.hinBg, borderBottom: `1px solid ${C.hintBorder}` }}>
          <p className="text-xs font-bold" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>📖 اضغط على أي آية لعرض تفسيرها</p>
        </div>
      )}
      {mode === 'normal' && (
        <div className="px-4 py-2 text-center flex-shrink-0" style={{ background: C.hinBg, borderBottom: `1px solid ${C.hintBorder}` }}>
          <p className="text-xs" style={{ color: C.subtleText, fontFamily: '"Tajawal", sans-serif' }}>اضغط على آية لتعيين علامة الحفظ</p>
        </div>
      )}

      {/* ── Quran Text ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-3">
        {loadingSurah ? (
          <div className="text-center py-20 animate-pulse" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>جاري تحميل السورة...</div>
        ) : (
          <div
            className="rounded-2xl min-h-full overflow-hidden"
            style={{
              background: C.mushafBg,
              border: `1px solid ${C.mushafBorder}`,
              boxShadow: C.mushafShadow,
            }}
          >
            {/* Top ornamental border */}
            <div className="relative overflow-hidden" style={{ height: '6px', background: 'linear-gradient(90deg, #3d2a0a 0%, #C19A6B 20%, #f0c040 50%, #C19A6B 80%, #3d2a0a 100%)' }} />

            {/* Surah name banner */}
            <div
              className="py-5 px-4 text-center"
              style={{ borderBottom: `1px solid ${C.headerBorder}`, background: dark ? 'rgba(193,154,107,0.05)' : 'rgba(193,154,107,0.07)' }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(193,154,107,0.5))' }} />
                <svg width="16" height="16" viewBox="0 0 100 100"><polygon points="50,5 61,35 93,35 68,57 77,88 50,70 23,88 32,57 7,35 39,35" fill="#C19A6B" opacity="0.8" /></svg>
                <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(193,154,107,0.5))' }} />
              </div>
              <h2 className="text-3xl mb-2" style={{ fontFamily: '"Amiri Quran", "Amiri", serif', color: C.surahTitle }}>{surahName}</h2>
              {selectedSurah !== 1 && selectedSurah !== 9 && (
                <p className="text-lg mt-1" style={{ fontFamily: '"Amiri Quran", "Amiri", serif', color: C.bismillah }}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to right, transparent, rgba(193,154,107,0.4))' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.6 }} />
                <div className="w-2 h-2 rounded-full" style={{ background: '#C19A6B' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.6 }} />
                <div className="h-px flex-1 max-w-16" style={{ background: 'linear-gradient(to left, transparent, rgba(193,154,107,0.4))' }} />
              </div>
            </div>

            {/* Ayah text body */}
            <div
              className="p-5 text-justify relative"
              style={{
                fontFamily: '"Amiri Quran", "Amiri", serif',
                color: C.ayahText,
                direction: 'rtl',
                fontSize: `${fontSize}rem`,
                lineHeight,
              }}
            >
              {surahData?.ayahs?.map((ayah: any) => {
                let text: string = ayah.text;
                if (selectedSurah !== 1 && ayah.numberInSurah === 1) {
                  text = text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ', '');
                }
                const isBookmarked = bookmark?.surah === selectedSurah && bookmark?.ayah === ayah.numberInSurah;
                const isSelected = selectedAyah === ayah.numberInSurah;
                const isActive = activeAyah === ayah.numberInSurah;

                // Listen mode: clickable words
                if (mode === 'listen') {
                  const wordList = text.split(/\s+/).filter(Boolean);
                  return (
                    <span
                      key={ayah.numberInSurah}
                      data-ayah={ayah.numberInSurah}
                      data-juz={ayah.juz}
                      data-hizb={ayah.hizbQuarter}
                    >
                      {wordList.map((word, wi) => {
                        const wordKey = `${selectedSurah}:${ayah.numberInSurah}:${wi + 1}`;
                        const isWordPlaying = playingWord === wordKey;
                        return (
                          <span
                            key={wi}
                            onClick={() => handleWordClick(ayah.numberInSurah, wi + 1)}
                            className="cursor-pointer px-0.5 rounded-sm transition-all duration-150"
                            style={{
                              background: isWordPlaying ? 'rgba(193,154,107,0.5)' : 'transparent',
                              color: isWordPlaying ? (dark ? '#fff' : '#2C1E16') : undefined,
                            }}
                          >
                            {word}{' '}
                          </span>
                        );
                      })}
                      <AyahMarker num={ayah.numberInSurah} bookmarked={isBookmarked} dark={dark} />
                    </span>
                  );
                }

                // Normal / tafsir mode
                return (
                  <span
                    key={ayah.numberInSurah}
                    data-ayah={ayah.numberInSurah}
                    data-juz={ayah.juz}
                    data-hizb={ayah.hizbQuarter}
                    onClick={() => handleAyahClick(ayah.numberInSurah)}
                    className="inline cursor-pointer transition-all duration-200 rounded-sm"
                    style={{
                      background: isSelected
                        ? 'rgba(193,154,107,0.18)'
                        : isActive && mode === 'tafsir'
                        ? 'rgba(193,154,107,0.22)'
                        : isBookmarked
                        ? 'rgba(193,154,107,0.1)'
                        : 'transparent',
                      borderBottom: isSelected
                        ? '2px solid rgba(193,154,107,0.7)'
                        : isActive && mode === 'tafsir'
                        ? '2px solid #C19A6B'
                        : 'none',
                      paddingInline: '2px',
                    }}
                  >
                    {text}
                    <AyahMarker num={ayah.numberInSurah} bookmarked={isBookmarked} dark={dark} />
                    {/* Inline bookmark save button when selected */}
                    {isSelected && mode === 'normal' && (
                      <button
                        onClick={e => { e.stopPropagation(); saveBookmark(ayah.numberInSurah); }}
                        className="inline-flex items-center gap-1 mr-1 rounded-full px-2 py-0.5 text-xs align-middle transition-all"
                        style={{
                          background: '#C19A6B',
                          color: '#0f0c07',
                          fontFamily: '"Tajawal", sans-serif',
                          fontSize: '0.6rem',
                          lineHeight: '1.4',
                          verticalAlign: 'middle',
                        }}
                      >
                        <Bookmark className="w-2.5 h-2.5 fill-current" />
                        حفظ
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Bottom ornamental border */}
            <div style={{ height: '6px', background: 'linear-gradient(90deg, #3d2a0a 0%, #C19A6B 20%, #f0c040 50%, #C19A6B 80%, #3d2a0a 100%)' }} />
          </div>
        )}
      </div>

      {/* ── Tafsir modal ── */}
      <Dialog.Root
        open={mode === 'tafsir' && !!activeAyah && !!tafsirData}
        onOpenChange={open => { if (!open) setActiveAyah(null); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <Dialog.Content
            className="fixed bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl p-6 z-50 overflow-y-auto shadow-2xl"
            dir="rtl"
            style={{ background: C.modalBg, border: `1px solid ${C.modalBorder}`, borderBottom: 'none' }}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-5" style={{ background: 'rgba(193,154,107,0.4)' }} />
            <Dialog.Title className="text-base font-bold mb-4" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>
              تفسير الجلالين — الآية {activeAyah}
            </Dialog.Title>
            <div
              className="text-lg leading-loose"
              style={{ fontFamily: '"Amiri", serif', color: C.modalText }}
              dangerouslySetInnerHTML={{ __html: tafsirData?.text ?? 'جاري التحميل...' }}
            />
            <button
              onClick={() => setActiveAyah(null)}
              className="mt-6 w-full py-3 rounded-2xl font-bold transition-all"
              style={{ background: '#C19A6B', color: '#0f0c07', fontFamily: '"Tajawal", sans-serif' }}
            >
              إغلاق
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
