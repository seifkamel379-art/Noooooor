import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Play, Pause, Share2, Palette, Check, Film,
} from 'lucide-react';
import { Link } from 'wouter';

/* ── Reciters ───────────────────────────────────────────────── */
const RECITERS = [
  { id: 'Alafasy_128kbps',              name: 'مشاري العفاسي' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'عبد الباسط عبد الصمد' },
  { id: 'Husary_128kbps',               name: 'محمود خليل الحصري' },
  { id: 'Ghamadi_40kbps',               name: 'سعد الغامدي' },
  { id: 'Minshawi_Murattal_128kbps',    name: 'محمد صديق المنشاوي' },
  { id: 'Mohammad_al_Tablawi_128kbps',  name: 'محمد الطبلاوي' },
  { id: 'Maher_AlMuaiqly_128kbps',      name: 'ماهر المعيقلي' },
];

/* ── Preset font colors ─────────────────────────────────────── */
const PRESET_COLORS = [
  '#FFFFFF', '#FFF8E7', '#FFD700', '#C8991A',
  '#86efac', '#93c5fd', '#fca5a5', '#e9d5ff',
];

/* ── Canvas text wrapping (RTL) ─────────────────────────────── */
function wrapTextRTL(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/* ── Load a font into document.fonts (for canvas) ──────────── */
async function loadFontForCanvas(name: string, url: string): Promise<void> {
  try {
    const f = new FontFace(name, `url(${url})`);
    const loaded = await f.load();
    document.fonts.add(loaded);
  } catch {
    /* silently fall back to system serif */
  }
}

type Surah = { id: number; name_arabic: string; verses_count: number };

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export function QuranStatus() {
  /* ── Background ── */
  const [bgFile, setBgFile]       = useState<File | null>(null);
  const [bgObjectUrl, setBgObjUrl] = useState<string | null>(null);
  const [bgType, setBgType]       = useState<'image' | 'video'>('image');
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const videoRef                  = useRef<HTMLVideoElement>(null);

  /* ── Quran selection ── */
  const [surahs, setSurahs]             = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedAyah, setSelectedAyah]   = useState(1);
  const [verseText, setVerseText]         = useState('');
  const [loadingVerse, setLoadingVerse]   = useState(false);

  /* ── Audio ── */
  const [selectedReciter, setSelectedReciter] = useState('Alafasy_128kbps');
  const [isPlaying, setIsPlaying]             = useState(false);
  const [audioLoading, setAudioLoading]       = useState(false);
  const audioRef                              = useRef<HTMLAudioElement | null>(null);

  /* ── Appearance ── */
  const [fontColor, setFontColor] = useState('#FFFFFF');

  /* ── Share state ── */
  const [isSharing, setIsSharing]     = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  /* ─────────────────────────────── Fetch Surah list ── */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/chapters?language=ar')
      .then(r => r.json())
      .then(d => setSurahs(d.chapters ?? []))
      .catch(() => {});
  }, []);

  /* ─────────────────────────── Clamp ayah on surah change ── */
  const maxAyah = surahs.find(s => s.id === selectedSurah)?.verses_count ?? 286;
  useEffect(() => {
    if (selectedAyah > maxAyah) setSelectedAyah(1);
  }, [selectedSurah]);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────────────────────────── Fetch verse text ── */
  useEffect(() => {
    setLoadingVerse(true);
    setVerseText('');
    const ctrl = new AbortController();
    fetch(
      `https://api.quran.com/api/v4/verses/by_key/${selectedSurah}:${selectedAyah}?fields=text_uthmani`,
      { signal: ctrl.signal },
    )
      .then(r => r.json())
      .then(d => {
        setVerseText(d.verse?.text_uthmani ?? '');
        setLoadingVerse(false);
      })
      .catch(e => { if (e.name !== 'AbortError') setLoadingVerse(false); });
    return () => ctrl.abort();
  }, [selectedSurah, selectedAyah]);

  /* ─────────────────────────── Reset audio on change ── */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [selectedSurah, selectedAyah, selectedReciter]);

  /* ─────────────────────────────── Background upload ── */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    const url = URL.createObjectURL(file);
    setBgFile(file);
    setBgObjUrl(url);
    setBgType(file.type.startsWith('video') ? 'video' : 'image');
  }, [bgObjectUrl]);

  /* ─────────────────────────────────── Audio toggle ── */
  const audioUrl = `https://everyayah.com/data/${selectedReciter}/${
    String(selectedSurah).padStart(3, '0')
  }${String(selectedAyah).padStart(3, '0')}.mp3`;

  const togglePlay = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.onended        = () => setIsPlaying(false);
      a.oncanplaythrough = () => setAudioLoading(false);
      a.onerror        = () => { setAudioLoading(false); setIsPlaying(false); };
      audioRef.current = a;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioLoading(true);
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => { setAudioLoading(false); setIsPlaying(false); });
    }
  }, [isPlaying, audioUrl]);

  /* ────────────────────── Generate image & share/download ── */
  const generateAndShare = useCallback(async () => {
    if (!verseText) return;
    setIsSharing(true);
    try {
      /* ── Canvas (1080 × 1920 story format) ── */
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      /* Background */
      if (bgObjectUrl && bgType === 'image') {
        const img = new Image();
        img.src = bgObjectUrl;
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = rej;
        });
        const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dx = (W - img.naturalWidth  * scale) / 2;
        const dy = (H - img.naturalHeight * scale) / 2;
        ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);

      } else if (bgObjectUrl && bgType === 'video' && videoRef.current) {
        const v = videoRef.current;
        const scale = Math.max(W / v.videoWidth, H / v.videoHeight);
        const dx = (W - v.videoWidth  * scale) / 2;
        const dy = (H - v.videoHeight * scale) / 2;
        ctx.drawImage(v, dx, dy, v.videoWidth * scale, v.videoHeight * scale);

      } else {
        /* Default Islamic dark background */
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#0d1b0a');
        grad.addColorStop(1, '#060e04');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        /* Subtle dot pattern */
        ctx.fillStyle = 'rgba(200,153,26,0.06)';
        for (let xi = 0; xi < W; xi += 80) {
          for (let yi = 0; yi < H; yi += 80) {
            ctx.beginPath();
            ctx.arc(xi, yi, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      /* Dark gradient overlay */
      const overlay = ctx.createLinearGradient(0, 0, 0, H);
      overlay.addColorStop(0,    'rgba(0,0,0,0.30)');
      overlay.addColorStop(0.45, 'rgba(0,0,0,0.55)');
      overlay.addColorStop(1,    'rgba(0,0,0,0.78)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, W, H);

      /* Load Amiri font into canvas context */
      await loadFontForCanvas(
        '_AmiriQS',
        'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.woff2',
      );
      await document.fonts.ready;
      const amiriFont = '_AmiriQS, Amiri, "Traditional Arabic", serif';

      /* Top decorative line */
      ctx.strokeStyle = 'rgba(200,153,26,0.65)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(140, 290); ctx.lineTo(940, 290); ctx.stroke();

      /* Bismillah */
      ctx.font      = `60px ${amiriFont}`;
      ctx.fillStyle = 'rgba(200,153,26,0.90)';
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';
      ctx.fillText('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', W / 2, 260);

      /* Verse text — dynamic font size */
      const charCount  = verseText.length;
      const fontSize   = Math.max(52, Math.min(88, Math.round(5200 / Math.sqrt(charCount + 1))));
      const lineHeight = Math.round(fontSize * 1.75);
      ctx.font      = `bold ${fontSize}px ${amiriFont}`;
      ctx.fillStyle = fontColor;
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      const lines        = wrapTextRTL(ctx, verseText, W * 0.82);
      const textBlockH   = lines.length * lineHeight;
      let ty             = (H - textBlockH) / 2;
      for (const line of lines) {
        ctx.fillText(line, W / 2, ty);
        ty += lineHeight;
      }

      /* Surah reference tag */
      const surahName = surahs.find(s => s.id === selectedSurah)?.name_arabic ?? '';
      ctx.font      = `48px ${amiriFont}`;
      ctx.fillStyle = 'rgba(200,153,26,0.85)';
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.fillText(`﴿ ${surahName} — آية ${selectedAyah} ﴾`, W / 2, ty + 50);

      /* Bottom decorative line */
      ctx.strokeStyle = 'rgba(200,153,26,0.65)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(140, H - 280); ctx.lineTo(940, H - 280); ctx.stroke();

      /* ── Logo watermark (bottom-left) ── */
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = `${window.location.origin}/logo.png`;
        await new Promise<void>(res => { logo.onload = () => res(); logo.onerror = () => res(); });
        const logoSz = 104;
        ctx.globalAlpha = 0.88;
        ctx.drawImage(logo, 60, H - 210, logoSz, logoSz);
        ctx.globalAlpha = 1;
      } catch { /* logo optional */ }

      /* "Noor App" text beside logo */
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.font      = `bold 54px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText('Noor App', 182, H - 145);

      ctx.font      = `36px 'Tajawal', sans-serif`;
      ctx.fillStyle = 'rgba(200,153,26,0.75)';
      ctx.fillText('تطبيق نور الإسلامي', 182, H - 100);

      /* ── Export & Share ── */
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png'),
      );
      const file = new File([blob], 'noor-ayah.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `آية قرآنية – Noor App`,
          text: verseText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        /* Fallback: download */
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'noor-ayah.png';
        a.click();
        URL.revokeObjectURL(url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err) {
      console.error('[QuranStatus] share error:', err);
    } finally {
      setIsSharing(false);
    }
  }, [bgObjectUrl, bgType, verseText, fontColor, selectedSurah, selectedAyah, surahs]);

  /* ─────────────────────────────────────────── Cleanup ── */
  useEffect(() => {
    return () => {
      if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  /* ─────────────────────────────────── Derived values ── */
  const currentSurah = surahs.find(s => s.id === selectedSurah);
  const ayahFontSize = verseText.length > 130 ? '13px'
    : verseText.length > 80 ? '15px'
    : verseText.length > 50 ? '17px'
    : '19px';

  /* ═════════════════════════════════════════════ Render ── */
  return (
    <div
      className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #0d1b0a 0%, #060e04 100%)' }}
    >
      {/* ── Header ── */}
      <div
        className="relative z-10 px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b"
        style={{
          background: 'rgba(0,0,0,0.55)',
          borderColor: 'rgba(200,153,26,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/more">
          <button className="p-2 rounded-full" style={{ background: 'rgba(200,153,26,0.15)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#C8991A' }} />
          </button>
        </Link>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
          >
            <Film className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
              بطاقات الآيات
            </h1>
            <p className="text-xs leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>
              إنشاء ستاتوس قرآني وإرساله
            </p>
          </div>
        </div>
      </div>

      {/* ── Preview Panel ── */}
      <div className="relative z-10 flex-shrink-0 mx-4 mt-3">
        <div
          className="w-full rounded-3xl overflow-hidden relative flex items-center justify-center"
          style={{ aspectRatio: '9/16', maxHeight: '42vh', border: '1.5px solid rgba(200,153,26,0.35)' }}
        >
          {/* Background layer */}
          {bgObjectUrl && bgType === 'image' && (
            <img src={bgObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {bgObjectUrl && bgType === 'video' && (
            <video
              ref={videoRef}
              src={bgObjectUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay loop muted playsInline
            />
          )}
          {!bgObjectUrl && (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #0e1f0b 0%, #142e10 40%, #060e04 100%)' }}
            />
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.75) 100%)' }}
          />

          {/* Bismillah */}
          <div className="absolute top-2.5 inset-x-0 flex justify-center pointer-events-none">
            <span
              style={{
                fontFamily: '"Amiri", "Traditional Arabic", serif',
                fontSize: '10px',
                color: 'rgba(200,153,26,0.88)',
                direction: 'rtl',
              }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
          </div>

          {/* Verse text */}
          <div className="relative z-10 px-4 text-center">
            {loadingVerse ? (
              <div
                className="w-7 h-7 rounded-full border-2 animate-spin mx-auto"
                style={{ borderColor: 'rgba(200,153,26,0.25)', borderTopColor: '#C8991A' }}
              />
            ) : (
              <p
                style={{
                  fontFamily: '"Amiri", "Traditional Arabic", serif',
                  fontSize: ayahFontSize,
                  color: fontColor,
                  direction: 'rtl',
                  textShadow: '0 2px 14px rgba(0,0,0,0.95)',
                  lineHeight: 2.1,
                }}
              >
                {verseText || 'اختر سورة وآية لعرضها هنا'}
              </p>
            )}
          </div>

          {/* Surah reference */}
          {verseText && !loadingVerse && (
            <div className="absolute bottom-7 inset-x-0 flex justify-center pointer-events-none">
              <span
                className="px-2.5 py-0.5 rounded-full text-center"
                style={{
                  fontFamily: '"Tajawal", sans-serif',
                  fontSize: '9px',
                  background: 'rgba(0,0,0,0.55)',
                  color: 'rgba(200,153,26,0.92)',
                  border: '1px solid rgba(200,153,26,0.3)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                ﴿ {currentSurah?.name_arabic ?? ''} — آية {selectedAyah} ﴾
              </span>
            </div>
          )}

          {/* Watermark: logo + Noor App */}
          <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5 pointer-events-none" style={{ direction: 'ltr' }}>
            <img
              src="/logo.png"
              alt="Noor"
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                opacity: 0.9,
                filter: 'drop-shadow(0 1px 5px rgba(0,0,0,0.9))',
              }}
            />
            <span
              style={{
                fontFamily: "'Segoe UI', sans-serif",
                fontSize: '9px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.88)',
                textShadow: '0 1px 6px rgba(0,0,0,1)',
                letterSpacing: '0.04em',
              }}
            >
              Noor App
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-3 pb-2 space-y-2.5">

        {/* Upload Background */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl p-3 flex items-center gap-3 text-right"
          style={{
            background: bgFile ? 'rgba(74,222,128,0.07)' : 'rgba(200,153,26,0.07)',
            border: `1px solid ${bgFile ? 'rgba(74,222,128,0.3)' : 'rgba(200,153,26,0.25)'}`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bgFile ? 'rgba(74,222,128,0.15)' : 'rgba(200,153,26,0.15)' }}
          >
            <Upload className="w-5 h-5" style={{ color: bgFile ? '#4ade80' : '#C8991A' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ fontFamily: '"Tajawal", sans-serif', color: bgFile ? '#4ade80' : '#E8C060' }}>
              {bgFile ? bgFile.name : 'رفع صورة أو فيديو خلفية'}
            </p>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>
              {bgFile ? (bgType === 'video' ? 'فيديو خلفية' : 'صورة خلفية') : 'اختر من جهازك (صورة أو فيديو)'}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </button>

        {/* Surah & Ayah selectors */}
        <div className="grid grid-cols-2 gap-2">
          {/* Surah */}
          <div
            className="rounded-2xl p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>السورة</p>
            <select
              value={selectedSurah}
              onChange={e => setSelectedSurah(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-sm outline-none"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}
            >
              {surahs.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0d1b0a', color: '#E8C060' }}>
                  {s.id}. {s.name_arabic}
                </option>
              ))}
            </select>
          </div>

          {/* Ayah */}
          <div
            className="rounded-2xl p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>الآية</p>
            <select
              value={selectedAyah}
              onChange={e => setSelectedAyah(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-sm outline-none"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}
            >
              {Array.from({ length: maxAyah }, (_, i) => i + 1).map(n => (
                <option key={n} value={n} style={{ background: '#0d1b0a', color: '#E8C060' }}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reciter */}
        <div
          className="rounded-2xl p-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>القارئ</p>
          <select
            value={selectedReciter}
            onChange={e => setSelectedReciter(e.target.value)}
            className="w-full bg-transparent font-bold text-sm outline-none"
            style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}
          >
            {RECITERS.map(r => (
              <option key={r.id} value={r.id} style={{ background: '#0d1b0a', color: '#E8C060' }}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Color */}
        <div
          className="rounded-2xl p-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <p className="text-xs mb-2" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>لون الخط</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setFontColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: c,
                  border: fontColor === c ? '3px solid #C8991A' : '2px solid rgba(255,255,255,0.18)',
                  transform: fontColor === c ? 'scale(1.22)' : 'scale(1)',
                  boxShadow: fontColor === c ? '0 0 10px rgba(200,153,26,0.7)' : 'none',
                  transition: 'all 0.18s',
                  flexShrink: 0,
                }}
              />
            ))}
            {/* Custom color picker */}
            <label
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                border: '2px solid rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Palette style={{ width: 15, height: 15, color: '#9CA3AF', position: 'relative', zIndex: 1 }} />
              <input
                type="color"
                value={fontColor}
                onChange={e => setFontColor(e.target.value)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              />
            </label>

            {/* Current color preview */}
            <div
              className="flex items-center gap-1.5 mr-auto"
              style={{ direction: 'rtl' }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, background: fontColor, border: '1px solid rgba(255,255,255,0.25)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6B7A60' }}>{fontColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div
        className="relative z-10 flex-shrink-0 px-4 py-3 flex gap-2 border-t"
        style={{
          borderColor: 'rgba(200,153,26,0.15)',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Play / Pause audio */}
        <button
          onClick={togglePlay}
          disabled={audioLoading || loadingVerse}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm flex-shrink-0 transition-all"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: isPlaying ? 'rgba(74,222,128,0.12)' : 'rgba(200,153,26,0.12)',
            border: `1px solid ${isPlaying ? 'rgba(74,222,128,0.4)' : 'rgba(200,153,26,0.35)'}`,
            color: isPlaying ? '#4ade80' : '#C8991A',
            minWidth: 96,
          }}
        >
          {audioLoading ? (
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(200,153,26,0.25)', borderTopColor: '#C8991A' }} />
          ) : isPlaying ? (
            <><Pause className="w-4 h-4" /> إيقاف</>
          ) : (
            <><Play className="w-4 h-4" /> تشغيل</>
          )}
        </button>

        {/* Share / Download */}
        <button
          onClick={generateAndShare}
          disabled={isSharing || !verseText || loadingVerse}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: shareSuccess
              ? 'linear-gradient(135deg, rgba(74,222,128,0.22), rgba(34,197,94,0.12))'
              : 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(76,29,149,0.15))',
            border: `1px solid ${shareSuccess ? 'rgba(74,222,128,0.5)' : 'rgba(124,58,237,0.5)'}`,
            color: shareSuccess ? '#4ade80' : '#c4b5fd',
            opacity: (!verseText || loadingVerse) ? 0.4 : 1,
          }}
        >
          {isSharing ? (
            <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: '#c4b5fd' }} />
          ) : shareSuccess ? (
            <><Check className="w-4 h-4" /> تمت المشاركة!</>
          ) : (
            <><Share2 className="w-4 h-4" /> مشاركة الآية</>
          )}
        </button>
      </div>
    </div>
  );
}
