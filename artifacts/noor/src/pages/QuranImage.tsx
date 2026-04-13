import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Download, Type, Palette, ImageIcon, Layers,
  Move, RefreshCw, X, Check,
} from 'lucide-react';
import { Link } from 'wouter';

/* ── Arabic font options ── */
const FONT_OPTIONS = [
  { id: 'amiri',        name: 'أميري',            cssFamily: '"Amiri", serif',                  googleFamily: 'Amiri:wght@400;700' },
  { id: 'amiri-quran',  name: 'أميري قرآن',        cssFamily: '"Amiri Quran", serif',            googleFamily: 'Amiri+Quran' },
  { id: 'scheherazade', name: 'شهرزاد',            cssFamily: '"Scheherazade New", serif',        googleFamily: 'Scheherazade+New:wght@400;700' },
  { id: 'noto',         name: 'نوتو نسخ',          cssFamily: '"Noto Naskh Arabic", serif',      googleFamily: 'Noto+Naskh+Arabic:wght@400;700' },
  { id: 'noto-kufi',    name: 'نوتو كوفي',         cssFamily: '"Noto Kufi Arabic", sans-serif',  googleFamily: 'Noto+Kufi+Arabic:wght@400;700' },
  { id: 'lateef',       name: 'لطيف',              cssFamily: 'Lateef, serif',                   googleFamily: 'Lateef:wght@400;700' },
  { id: 'cairo',        name: 'كايرو',             cssFamily: 'Cairo, sans-serif',               googleFamily: 'Cairo:wght@400;700' },
  { id: 'harmattan',    name: 'هرمطان',            cssFamily: 'Harmattan, serif',                googleFamily: 'Harmattan:wght@400;700' },
  { id: 'markazi',      name: 'مركزي',             cssFamily: '"Markazi Text", serif',           googleFamily: 'Markazi+Text:wght@400;700' },
  { id: 'lalezar',      name: 'لالازار',           cssFamily: 'Lalezar, cursive',                googleFamily: 'Lalezar' },
  { id: 'reem',         name: 'ريم كوفي',          cssFamily: '"Reem Kufi", serif',              googleFamily: 'Reem+Kufi:wght@400;700' },
  { id: 'aref',         name: 'عارف رقعة',         cssFamily: '"Aref Ruqaa Ink", serif',         googleFamily: 'Aref+Ruqaa+Ink:wght@400;700' },
  { id: 'mirza',        name: 'ميرزا',             cssFamily: 'Mirza, cursive',                  googleFamily: 'Mirza:wght@400;700' },
  { id: 'katibeh',      name: 'كاتبة',             cssFamily: 'Katibeh, cursive',                googleFamily: 'Katibeh' },
  { id: 'mada',         name: 'مدى',               cssFamily: 'Mada, sans-serif',                googleFamily: 'Mada:wght@400;700' },
  { id: 'rakkas',       name: 'راقص',              cssFamily: 'Rakkas, cursive',                 googleFamily: 'Rakkas' },
  { id: 'el-messiri',   name: 'المسيري',           cssFamily: '"El Messiri", sans-serif',        googleFamily: 'El+Messiri:wght@400;700' },
  { id: 'lemonada',     name: 'ليموناضة',          cssFamily: 'Lemonada, cursive',               googleFamily: 'Lemonada:wght@400;700' },
  { id: 'tajawal',      name: 'تجوال',             cssFamily: 'Tajawal, sans-serif',             googleFamily: 'Tajawal:wght@400;700' },
  { id: 'changa',       name: 'تشانجا',            cssFamily: 'Changa, sans-serif',              googleFamily: 'Changa:wght@400;700' },
] as const;
type FontId = typeof FONT_OPTIONS[number]['id'];

/* ── Colors ── */
const PRESET_COLORS = [
  /* Whites & Creams */
  '#FFFFFF', '#FFFEF8', '#FFF8E7', '#FFF3D4',
  /* Goldens (app theme) */
  '#C19A6B', '#D4A96A', '#E2B97A', '#F0C850',
  '#FFD700', '#C8991A', '#B8860B', '#8B6914',
  /* Browns */
  '#8B5E3C', '#6B4226', '#4A2C17', '#3B1F0E',
  /* Off-whites / Warm */
  '#E8DCC8', '#D4C4A8', '#C8B89A', '#B8A48A',
  /* Blues */
  '#E0F0FF', '#A8D4F8', '#6BB8F0', '#1E90FF',
  '#1565C0', '#0D47A1', '#1A237E', '#0A1628',
  /* Greens */
  '#E8F5E9', '#A5D6A7', '#4CAF50', '#1B5E20',
  '#00695C', '#004D40', '#E0F2F1', '#80CBC4',
  /* Reds & Pinks */
  '#FFE0E0', '#FFAB91', '#E57373', '#C62828',
  '#FCE4EC', '#F48FB1', '#E91E63', '#880E4F',
  /* Purples */
  '#EDE7F6', '#CE93D8', '#9C27B0', '#4A148C',
  '#E8EAF6', '#9FA8DA', '#3F51B5', '#1A237E',
  /* Blacks & Grays */
  '#F5F5F5', '#BDBDBD', '#757575', '#424242',
  '#212121', '#1C1C1C', '#0D0D0D', '#000000',
];

/* ── Overlay definitions ── */
type OverlayDef = {
  id: string;
  name: string;
  emoji: string;
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number, opacity: number) => void;
};

const OVERLAYS: OverlayDef[] = [
  {
    id: 'none',
    name: 'بدون',
    emoji: '✕',
    draw: () => {},
  },
  {
    id: 'dark-vignette',
    name: 'عتامة',
    emoji: '◉',
    draw: (ctx, W, H, opacity) => {
      const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.85);
      g.addColorStop(0, `rgba(0,0,0,0)`);
      g.addColorStop(1, `rgba(0,0,0,${opacity})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'bottom-gradient',
    name: 'تدرج أسفل',
    emoji: '▽',
    draw: (ctx, W, H, opacity) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(0,0,0,0)`);
      g.addColorStop(0.5, `rgba(0,0,0,${opacity * 0.5})`);
      g.addColorStop(1, `rgba(0,0,0,${opacity})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'top-gradient',
    name: 'تدرج أعلى',
    emoji: '△',
    draw: (ctx, W, H, opacity) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(0,0,0,${opacity})`);
      g.addColorStop(0.5, `rgba(0,0,0,${opacity * 0.5})`);
      g.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'full-dark',
    name: 'داكن',
    emoji: '■',
    draw: (ctx, W, H, opacity) => {
      ctx.fillStyle = `rgba(0,0,0,${opacity})`;
      ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'warm-golden',
    name: 'ذهبي دافئ',
    emoji: '★',
    draw: (ctx, W, H, opacity) => {
      ctx.fillStyle = `rgba(139,80,20,${opacity * 0.7})`;
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, H, W, 0);
      g.addColorStop(0, `rgba(200,153,26,${opacity * 0.5})`);
      g.addColorStop(1, `rgba(100,60,10,${opacity * 0.3})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'cool-blue',
    name: 'أزرق بارد',
    emoji: '❄',
    draw: (ctx, W, H, opacity) => {
      ctx.fillStyle = `rgba(10,30,80,${opacity * 0.6})`;
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, `rgba(30,80,180,${opacity * 0.4})`);
      g.addColorStop(1, `rgba(5,10,50,${opacity * 0.5})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'sepia',
    name: 'سيبيا',
    emoji: '☕',
    draw: (ctx, W, H, opacity) => {
      ctx.fillStyle = `rgba(112,66,20,${opacity * 0.55})`;
      ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'white-haze',
    name: 'ضباب أبيض',
    emoji: '☁',
    draw: (ctx, W, H, opacity) => {
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'purple-dream',
    name: 'بنفسجي',
    emoji: '◈',
    draw: (ctx, W, H, opacity) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, `rgba(80,10,120,${opacity * 0.7})`);
      g.addColorStop(1, `rgba(20,0,60,${opacity * 0.5})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
  {
    id: 'emerald',
    name: 'زمردي',
    emoji: '◆',
    draw: (ctx, W, H, opacity) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(0,80,50,${opacity * 0.6})`);
      g.addColorStop(1, `rgba(0,40,30,${opacity * 0.8})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
  },
];

/* ── Types ── */
type Surah = { id: number; name_arabic: string; verses_count: number };
type TextPos = { x: number; y: number }; /* 0-1 relative to container */

/* ── Helpers ── */
async function loadFontsForCanvas(): Promise<void> {
  try { await document.fonts.ready; } catch { /* ok */ }
}

function wrapRTL(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════ */
export function QuranImage() {
  const [surahs, setSurahs]           = useState<Surah[]>([]);
  const [selectedSurah, setSurah]     = useState(1);
  const [fromAyah, setFromAyah]       = useState(1);
  const [toAyah, setToAyah]           = useState(1);
  const [verseTexts, setVerseTexts]   = useState<string[]>([]);
  const [loadingVerses, setLoadingV]  = useState(false);

  const [bgFile, setBgFile]           = useState<File | null>(null);
  const [bgObjectUrl, setBgObjUrl]    = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const [fontColor, setFontColor]     = useState('#FFFFFF');
  const [selectedFont, setFont]       = useState<FontId>('amiri');
  const [fontSizePct, setFontSizePct] = useState(50);
  const [showColorGrid, setShowColorGrid] = useState(false);
  const [customColor, setCustomColor] = useState('#FFFFFF');

  const [overlayId, setOverlayId]     = useState('dark-vignette');
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);

  const [textPos, setTextPos]         = useState<TextPos>({ x: 0.5, y: 0.5 });
  const [isDragging, setIsDragging]   = useState(false);
  const previewRef                    = useRef<HTMLDivElement>(null);
  const dragStartRef                  = useRef<{ clientX: number; clientY: number; posX: number; posY: number } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded]   = useState(false);

  /* Tab state for controls */
  const [activeTab, setActiveTab] = useState<'settings' | 'text' | 'overlay'>('settings');

  /* Font scale: 0→0.3, 50→1.0, 100→2.8 */
  const fontScale = 0.3 + (fontSizePct / 100) * 2.5;

  /* Load Google Fonts dynamically */
  useEffect(() => {
    const fonts = FONT_OPTIONS.map(f => f.googleFamily).join('&family=');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`;
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch { /* ok */ } };
  }, []);

  /* Fetch surahs */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/chapters?language=ar')
      .then(r => r.json()).then(d => setSurahs(d.chapters ?? [])).catch(() => {});
  }, []);

  const maxAyah      = surahs.find(s => s.id === selectedSurah)?.verses_count ?? 286;
  const currentSurah = surahs.find(s => s.id === selectedSurah);
  const ayahRange    = fromAyah === toAyah ? `آية ${fromAyah}` : `الآيات ${fromAyah}–${toAyah}`;
  const fullText     = verseTexts.join(' ﴾ ﴿ ');

  useEffect(() => { setFromAyah(1); setToAyah(1); }, [selectedSurah]);
  useEffect(() => { if (toAyah < fromAyah) setToAyah(fromAyah); }, [fromAyah, toAyah]);

  /* Fetch verse texts */
  useEffect(() => {
    if (fromAyah > toAyah) return;
    setLoadingV(true); setVerseTexts([]);
    const ctrl  = new AbortController();
    const ayahs = Array.from({ length: toAyah - fromAyah + 1 }, (_, i) => fromAyah + i);
    Promise.all(ayahs.map(a =>
      fetch(`https://api.quran.com/api/v4/verses/by_key/${selectedSurah}:${a}?fields=text_uthmani`, { signal: ctrl.signal })
        .then(r => r.json()).then(d => d.verse?.text_uthmani ?? '').catch(() => '')
    )).then(texts => { setVerseTexts(texts.filter(Boolean)); setLoadingV(false); })
      .catch(e => { if (e.name !== 'AbortError') setLoadingV(false); });
    return () => ctrl.abort();
  }, [selectedSurah, fromAyah, toAyah]);

  /* Background upload */
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    setBgFile(file); setBgObjUrl(URL.createObjectURL(file));
  }, [bgObjectUrl]);

  /* Drag handlers */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: textPos.x,
      posY: textPos.y,
    };
    setIsDragging(true);
  }, [textPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartRef.current.clientX) / rect.width;
    const dy = (e.clientY - dragStartRef.current.clientY) / rect.height;
    setTextPos({
      x: Math.max(0.05, Math.min(0.95, dragStartRef.current.posX + dx)),
      y: Math.max(0.05, Math.min(0.95, dragStartRef.current.posY + dy)),
    });
  }, [isDragging]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  /* ── Generate & Download PNG ── */
  const generateImage = useCallback(async () => {
    if (verseTexts.length === 0) return;
    setIsGenerating(true);
    setDownloaded(false);

    try {
      await loadFontsForCanvas();

      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      const fontFamily = FONT_OPTIONS.find(f => f.id === selectedFont)!.cssFamily;

      /* Background */
      if (bgObjectUrl) {
        const img = new Image();
        img.src = bgObjectUrl;
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
        const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        ctx.drawImage(img,
          (W - img.naturalWidth  * sc) / 2,
          (H - img.naturalHeight * sc) / 2,
          img.naturalWidth * sc, img.naturalHeight * sc);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#1a1008');
        g.addColorStop(1, '#0a0804');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      /* Overlay */
      const overlay = OVERLAYS.find(o => o.id === overlayId);
      overlay?.draw(ctx, W, H, overlayOpacity);

      /* Compute text position on canvas */
      const textCX = textPos.x * W;
      const textCY = textPos.y * H;

      /* Draw text */
      const charCount  = fullText.length;
      const baseFontPx = Math.max(48, Math.min(220, Math.round(9200 / Math.sqrt(charCount + 1))));
      const fontSize   = Math.round(baseFontPx * fontScale);
      const lineH      = Math.round(fontSize * 2.1);

      ctx.font      = `bold ${fontSize}px ${fontFamily}`;
      ctx.direction = 'rtl'; ctx.textAlign = 'center';
      const lines   = wrapRTL(ctx, fullText, W * 0.85);
      const textH   = lines.length * lineH;
      let ty        = textCY - textH / 2 + lineH / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 22;
      ctx.fillStyle   = fontColor;
      for (const line of lines) {
        ctx.fillText(line, textCX, ty);
        ty += lineH;
      }
      ctx.restore();

      /* Surah reference */
      ctx.globalAlpha = 1;
      const refFontPx = Math.max(40, Math.round(fontSize * 0.42));
      ctx.font = `${refFontPx}px ${fontFamily}`;
      ctx.fillStyle = 'rgba(200,153,26,0.90)';
      ctx.direction = 'rtl'; ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
      const refY = Math.min(textCY + textH / 2 + refFontPx * 2.5, H - 220);
      ctx.fillText(`﴿ ${currentSurah?.name_arabic} — ${ayahRange} ﴾`, W / 2, refY);
      ctx.shadowBlur = 0;

      /* Watermark */
      try {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.src = `${window.location.origin}/logo.png`;
        await new Promise<void>(r => { logo.onload = () => r(); logo.onerror = () => r(); });
        if (logo.complete && logo.naturalWidth > 0) {
          ctx.globalAlpha = 0.85;
          ctx.drawImage(logo, 60, H - 195, 100, 100);
          ctx.globalAlpha = 1;
        }
      } catch { /* ok */ }
      ctx.direction = 'ltr'; ctx.textAlign = 'left';
      ctx.font = `bold 44px 'Segoe UI',sans-serif`; ctx.fillStyle = '#C8991A';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
      ctx.fillText('Noor App', 180, H - 134);
      ctx.font = `30px Tajawal,sans-serif`; ctx.fillStyle = 'rgba(200,153,26,0.72)';
      ctx.fillText('تطبيق نور الإسلامي', 180, H - 96);
      ctx.shadowBlur = 0;

      /* Download */
      canvas.toBlob((blob) => {
        if (!blob) { setIsGenerating(false); return; }
        const filename = `noor-image-${selectedSurah}-${fromAyah}${fromAyah !== toAyah ? `-${toAyah}` : ''}.png`;
        if (typeof navigator.share === 'function') {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            navigator.share({ files: [file], title: 'صورة قرآنية', text: 'من تطبيق نور الإسلامي' })
              .catch(() => { /* fallback to download */ fallbackDownload(blob, filename); });
            setDownloaded(true); setIsGenerating(false); return;
          }
        }
        fallbackDownload(blob, filename);
        setDownloaded(true); setIsGenerating(false);
      }, 'image/png');
    } catch {
      setIsGenerating(false);
    }
  }, [
    verseTexts, bgObjectUrl, overlayId, overlayOpacity, textPos, fontColor, selectedFont,
    fontScale, fullText, currentSurah, ayahRange, selectedSurah, fromAyah, toAyah,
  ]);

  function fallbackDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
  }

  useEffect(() => {
    return () => { if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived preview ── */
  const fontFamily    = FONT_OPTIONS.find(f => f.id === selectedFont)!.cssFamily;
  const previewFontPx = Math.round(16 * fontScale);
  const overlayDef    = OVERLAYS.find(o => o.id === overlayId);

  /* Build overlay CSS for preview */
  function overlayStyle(): React.CSSProperties {
    switch (overlayId) {
      case 'none':           return {};
      case 'dark-vignette':  return { background: `radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(0,0,0,${overlayOpacity}) 85%)` };
      case 'bottom-gradient':return { background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${overlayOpacity * 0.5}) 50%, rgba(0,0,0,${overlayOpacity}) 100%)` };
      case 'top-gradient':   return { background: `linear-gradient(to top, transparent 0%, rgba(0,0,0,${overlayOpacity * 0.5}) 50%, rgba(0,0,0,${overlayOpacity}) 100%)` };
      case 'full-dark':      return { background: `rgba(0,0,0,${overlayOpacity})` };
      case 'warm-golden':    return { background: `rgba(139,80,20,${overlayOpacity * 0.65})` };
      case 'cool-blue':      return { background: `rgba(10,30,80,${overlayOpacity * 0.65})` };
      case 'sepia':          return { background: `rgba(112,66,20,${overlayOpacity * 0.55})` };
      case 'white-haze':     return { background: `rgba(255,255,255,${overlayOpacity})` };
      case 'purple-dream':   return { background: `linear-gradient(135deg, rgba(80,10,120,${overlayOpacity * 0.7}) 0%, rgba(20,0,60,${overlayOpacity * 0.5}) 100%)` };
      case 'emerald':        return { background: `linear-gradient(to bottom, rgba(0,80,50,${overlayOpacity * 0.6}) 0%, rgba(0,40,30,${overlayOpacity * 0.8}) 100%)` };
      default:               return {};
    }
  }

  /* ════════════════════════════════════ Render ── */
  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden bg-background" dir="rtl">

      {/* ── Header ── */}
      <div className="relative z-10 px-4 py-3 flex items-center gap-3 flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md">
        <Link href="/more">
          <button className="p-2 rounded-full bg-primary/10 hover-elevate" data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/15">
            <ImageIcon size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              إنشاء صورة قرآنية
            </h1>
            <p className="text-xs leading-tight text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              صمّم صورة واحفظها على جهازك
            </p>
          </div>
        </div>
        {/* Download button */}
        <button
          onClick={generateImage}
          disabled={verseTexts.length === 0 || isGenerating}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            fontFamily: '"Tajawal",sans-serif',
            background: verseTexts.length === 0 ? 'hsl(var(--muted))' : downloaded
              ? 'hsl(var(--primary)/0.3)'
              : 'linear-gradient(135deg, hsl(var(--primary)), hsl(33 55% 45%))',
            color: verseTexts.length === 0 ? 'hsl(var(--muted-foreground))' : downloaded
              ? 'hsl(var(--primary))'
              : 'hsl(var(--primary-foreground))',
          }}
          data-testid="button-download"
        >
          {isGenerating ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : downloaded ? (
            <Check size={14} />
          ) : (
            <Download size={14} />
          )}
          <span>{isGenerating ? 'جاري...' : downloaded ? 'تم' : 'تحميل'}</span>
        </button>
      </div>

      {/* ── Preview Panel ── */}
      <div className="relative z-10 flex-shrink-0 mx-4 mt-3">
        <div
          ref={previewRef}
          className="w-full rounded-2xl overflow-hidden relative border border-primary/20 select-none"
          style={{ aspectRatio: '9/16', maxHeight: '42vh' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Background */}
          {bgObjectUrl ? (
            <img src={bgObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#1a1008 0%,#0f0904 100%)' }} />
          )}

          {/* Overlay */}
          <div className="absolute inset-0" style={overlayStyle()} />

          {/* Draggable text block */}
          <div
            className="absolute"
            style={{
              left: `${textPos.x * 100}%`,
              top: `${textPos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              maxWidth: '92%',
              zIndex: 10,
            }}
            onPointerDown={onPointerDown}
          >
            {/* Drag indicator ring */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none transition-all"
              style={{
                border: isDragging ? '1.5px dashed rgba(193,154,107,0.7)' : '1px dashed rgba(193,154,107,0.3)',
                margin: '-6px',
                borderRadius: '10px',
              }}
            />
            {loadingVerses ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <RefreshCw size={10} className="animate-spin text-primary" />
                <span style={{ fontFamily: '"Tajawal",sans-serif', fontSize: '8px', color: 'rgba(200,153,26,0.7)' }}>جاري التحميل...</span>
              </div>
            ) : fullText ? (
              <p style={{
                fontFamily,
                fontSize: `${previewFontPx}px`,
                color: fontColor,
                direction: 'rtl',
                textAlign: 'center',
                textShadow: '0 2px 14px rgba(0,0,0,0.95)',
                lineHeight: 2.1,
                whiteSpace: 'normal',
                wordBreak: 'break-word',
              }}>
                {fullText}
              </p>
            ) : (
              <p style={{ fontFamily: '"Tajawal",sans-serif', fontSize: '9px', color: 'rgba(200,153,26,0.5)', direction: 'rtl', textAlign: 'center' }}>
                اختر سورة وآية
              </p>
            )}
          </div>

          {/* Surah tag */}
          {verseTexts.length > 0 && !loadingVerses && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full text-center"
                style={{
                  fontFamily: '"Tajawal",sans-serif', fontSize: '7px',
                  background: 'rgba(0,0,0,0.55)', color: 'rgba(200,153,26,0.92)',
                  border: '1px solid rgba(200,153,26,0.28)', backdropFilter: 'blur(4px)',
                }}>
                ﴿ {currentSurah?.name_arabic} — {ayahRange} ﴾
              </span>
            </div>
          )}

          {/* Drag hint */}
          {fullText && !isDragging && (
            <div className="absolute top-2 left-2 pointer-events-none">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.45)' }}>
                <Move size={8} style={{ color: 'rgba(193,154,107,0.8)' }} />
                <span style={{ fontFamily: '"Tajawal",sans-serif', fontSize: '6px', color: 'rgba(193,154,107,0.8)' }}>حرّك النص</span>
              </div>
            </div>
          )}

          {/* Watermark */}
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1 pointer-events-none" style={{ direction: 'ltr' }}>
            <img src="/logo.png" alt="Noor" style={{ width: 14, height: 14, borderRadius: '50%', opacity: 0.85 }} />
            <span style={{ fontFamily: "'Segoe UI',sans-serif", fontSize: '5.5px', fontWeight: 700, color: 'rgba(200,153,26,0.72)' }}>Noor App</span>
          </div>
        </div>
      </div>

      {/* ── Control Tabs ── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {/* Tab Bar */}
        <div className="flex gap-1 px-4 pt-2.5 pb-1.5">
          {([
            { id: 'settings', label: 'السورة', icon: <ImageIcon size={12} /> },
            { id: 'text',     label: 'النص',   icon: <Type size={12} /> },
            { id: 'overlay',  label: 'التراكب', icon: <Layers size={12} /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                fontFamily: '"Tajawal",sans-serif',
                background: activeTab === tab.id ? 'hsl(var(--primary)/0.18)' : 'hsl(var(--muted))',
                color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                border: `1px solid ${activeTab === tab.id ? 'hsl(var(--primary)/0.4)' : 'hsl(var(--border))'}`,
              }}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-24 space-y-2.5">

          {/* ── Settings Tab ── */}
          {activeTab === 'settings' && (
            <>
              {/* Background upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl p-3 flex items-center gap-3 text-right border bg-card hover-elevate"
                style={{ borderColor: bgFile ? 'hsl(var(--primary)/0.5)' : 'hsl(var(--border))' }}
                data-testid="button-upload-bg"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <Upload size={17} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                    {bgFile ? bgFile.name : 'رفع صورة خلفية'}
                  </p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                    {bgFile ? 'صورة خلفية محددة' : 'اختر صورة من جهازك'}
                  </p>
                </div>
                {bgFile && (
                  <button
                    onClick={e => { e.stopPropagation(); setBgFile(null); if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl); setBgObjUrl(null); }}
                    className="p-1.5 rounded-full bg-muted"
                  >
                    <X size={13} className="text-muted-foreground" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </button>

              {/* Surah / From / To */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'السورة',
                    content: (
                      <select
                        value={selectedSurah} onChange={e => setSurah(Number(e.target.value))}
                        className="w-full bg-transparent font-bold text-xs outline-none truncate text-primary"
                        style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
                        data-testid="select-surah"
                      >
                        {surahs.map(s => (
                          <option key={s.id} value={s.id}
                            style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                            {s.id}. {s.name_arabic}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    label: 'من آية',
                    content: (
                      <select
                        value={fromAyah} onChange={e => setFromAyah(Number(e.target.value))}
                        className="w-full bg-transparent font-bold text-sm outline-none text-primary"
                        style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
                        data-testid="select-from-ayah"
                      >
                        {Array.from({ length: maxAyah }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}
                            style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>{n}</option>
                        ))}
                      </select>
                    ),
                  },
                  {
                    label: 'إلى آية',
                    content: (
                      <select
                        value={toAyah} onChange={e => setToAyah(Number(e.target.value))}
                        className="w-full bg-transparent font-bold text-sm outline-none text-primary"
                        style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
                        data-testid="select-to-ayah"
                      >
                        {Array.from({ length: maxAyah - fromAyah + 1 }, (_, i) => fromAyah + i).map(n => (
                          <option key={n} value={n}
                            style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>{n}</option>
                        ))}
                      </select>
                    ),
                  },
                ].map(({ label, content }) => (
                  <div key={label} className="rounded-2xl p-2.5 bg-card border border-border">
                    <p className="text-xs mb-1 text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>{label}</p>
                    {content}
                  </div>
                ))}
              </div>

              {/* Position reset */}
              <button
                onClick={() => setTextPos({ x: 0.5, y: 0.5 })}
                className="w-full rounded-2xl p-2.5 flex items-center gap-2.5 bg-card border border-border hover-elevate"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                  <Move size={15} className="text-primary" />
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm font-bold text-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>إعادة موضع النص للمركز</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>اسحب النص في المعاينة لتغيير مكانه</p>
                </div>
              </button>
            </>
          )}

          {/* ── Text Tab ── */}
          {activeTab === 'text' && (
            <>
              {/* Font picker */}
              <div className="rounded-2xl p-3 bg-card border border-border">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>نوع الخط</p>
                  <Type size={13} className="text-primary" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFont(f.id as FontId)}
                      className="py-2 px-1 rounded-xl text-center text-xs transition-all"
                      style={{
                        fontFamily: f.cssFamily,
                        background: selectedFont === f.id ? 'hsl(var(--primary)/0.18)' : 'hsl(var(--muted))',
                        border: `1px solid ${selectedFont === f.id ? 'hsl(var(--primary)/0.5)' : 'hsl(var(--border))'}`,
                        color: selectedFont === f.id ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                        fontWeight: selectedFont === f.id ? 700 : 400,
                      }}
                      data-testid={`button-font-${f.id}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div className="rounded-2xl p-3 bg-card border border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>حجم الخط</p>
                  <span className="text-xs font-bold text-primary" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                    {Math.round(fontScale * 100)}%
                  </span>
                </div>
                <input
                  type="range" min={10} max={100} value={fontSizePct}
                  onChange={e => setFontSizePct(Number(e.target.value))}
                  className="w-full accent-primary"
                  data-testid="slider-font-size"
                />
              </div>

              {/* Color picker */}
              <div className="rounded-2xl p-3 bg-card border border-border">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>لون النص</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-primary/40"
                      style={{ background: fontColor }}
                    />
                    <Palette size={13} className="text-primary" />
                  </div>
                </div>
                {/* Quick preset colors */}
                <div className="grid grid-cols-8 gap-1.5 mb-2.5">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => { setFontColor(color); setCustomColor(color); }}
                      className="rounded-full transition-all"
                      style={{
                        background: color,
                        width: '100%',
                        aspectRatio: '1',
                        border: fontColor === color
                          ? '2.5px solid hsl(var(--primary))'
                          : color === '#FFFFFF' || color === '#FFFEF8' || color === '#FFF8E7'
                            ? '1.5px solid hsl(var(--border))'
                            : '1.5px solid transparent',
                        transform: fontColor === color ? 'scale(1.15)' : 'scale(1)',
                      }}
                      data-testid={`button-color-${color.replace('#', '')}`}
                    />
                  ))}
                </div>
                {/* Custom color input */}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => { setCustomColor(e.target.value); setFontColor(e.target.value); }}
                    className="w-8 h-8 rounded-lg border border-border cursor-pointer flex-shrink-0"
                    style={{ padding: '2px' }}
                  />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                    اختر لوناً مخصصاً
                  </p>
                  <span className="text-xs font-mono text-primary ml-auto">{fontColor}</span>
                </div>
              </div>
            </>
          )}

          {/* ── Overlay Tab ── */}
          {activeTab === 'overlay' && (
            <>
              {/* Overlay grid */}
              <div className="rounded-2xl p-3 bg-card border border-border">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>نوع التراكب</p>
                  <Layers size={13} className="text-primary" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {OVERLAYS.map(ov => (
                    <button
                      key={ov.id}
                      onClick={() => setOverlayId(ov.id)}
                      className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all"
                      style={{
                        background: overlayId === ov.id ? 'hsl(var(--primary)/0.18)' : 'hsl(var(--muted))',
                        border: `1px solid ${overlayId === ov.id ? 'hsl(var(--primary)/0.5)' : 'hsl(var(--border))'}`,
                      }}
                      data-testid={`button-overlay-${ov.id}`}
                    >
                      <span
                        className="text-sm font-bold leading-none"
                        style={{ color: overlayId === ov.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                      >
                        {ov.emoji}
                      </span>
                      <span
                        className="text-[10px] font-medium leading-tight text-center"
                        style={{
                          fontFamily: '"Tajawal",sans-serif',
                          color: overlayId === ov.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        {ov.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity slider */}
              {overlayId !== 'none' && (
                <div className="rounded-2xl p-3 bg-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>شفافية التراكب</p>
                    <span className="text-xs font-bold text-primary" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                      {Math.round(overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={Math.round(overlayOpacity * 100)}
                    onChange={e => setOverlayOpacity(Number(e.target.value) / 100)}
                    className="w-full accent-primary"
                    data-testid="slider-overlay-opacity"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>شفاف</span>
                    <span className="text-[9px] text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>معتم</span>
                  </div>
                </div>
              )}

              {/* Preview of current overlay */}
              <div
                className="rounded-2xl p-3 flex items-center justify-between bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg,#1a1008,#0a0804)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={overlayStyle()}
                    />
                    <span style={{ position: 'relative', zIndex: 1, color: 'rgba(200,153,26,0.9)', fontFamily: '"Amiri",serif', fontSize: '16px' }}>
                      ن
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                      {overlayDef?.name ?? 'بدون تراكب'}
                    </p>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
                      {overlayId === 'none' ? 'لا يوجد تراكب' : `الشفافية: ${Math.round(overlayOpacity * 100)}%`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
