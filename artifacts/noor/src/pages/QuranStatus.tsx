import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Play, Pause, Share2, Film, Loader2, Type, Check, Palette,
} from 'lucide-react';
import { Link } from 'wouter';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

/* ── Capacitor detection (no import needed) ── */
const isNative = !!((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
  .Capacitor?.isNativePlatform?.());

/* ── CDN base ── */
const QURAN_CDN_BASE = 'https://verses.quran.com/';

/* ── Arabic font options ── */
const FONT_OPTIONS = [
  { id: 'amiri',        name: 'أميري',        cssFamily: '"Amiri", serif' },
  { id: 'amiri-quran',  name: 'أميري قرآن',   cssFamily: '"Amiri Quran", serif' },
  { id: 'scheherazade', name: 'شهرزاد',        cssFamily: '"Scheherazade New", serif' },
  { id: 'noto',         name: 'نوتو نسخ',     cssFamily: '"Noto Naskh Arabic", serif' },
  { id: 'lateef',       name: 'لطيف',          cssFamily: 'Lateef, serif' },
  { id: 'cairo',        name: 'كايرو',         cssFamily: 'Cairo, sans-serif' },
  { id: 'harmattan',    name: 'هرمطان',        cssFamily: 'Harmattan, serif' },
  { id: 'markazi',      name: 'مركزي',         cssFamily: '"Markazi Text", serif' },
  { id: 'lalezar',      name: 'لالازار',       cssFamily: 'Lalezar, cursive' },
  { id: 'reem',         name: 'ريم كوفي',      cssFamily: '"Reem Kufi", serif' },
  { id: 'aref',         name: 'عارف رقعة',     cssFamily: '"Aref Ruqaa Ink", serif' },
] as const;
type FontId = typeof FONT_OPTIONS[number]['id'];

const CANVAS_FONT: Record<FontId, string> = {
  'amiri':        '"Amiri","Traditional Arabic",serif',
  'amiri-quran':  '"Amiri Quran","Traditional Arabic",serif',
  'scheherazade': '"Scheherazade New","Traditional Arabic",serif',
  'noto':         '"Noto Naskh Arabic","Traditional Arabic",serif',
  'lateef':       'Lateef,"Traditional Arabic",serif',
  'cairo':        'Cairo,"Traditional Arabic",sans-serif',
  'harmattan':    'Harmattan,"Traditional Arabic",serif',
  'markazi':      '"Markazi Text","Traditional Arabic",serif',
  'lalezar':      'Lalezar,"Traditional Arabic",cursive',
  'reem':         '"Reem Kufi","Traditional Arabic",serif',
  'aref':         '"Aref Ruqaa Ink","Traditional Arabic",serif',
};

const PRESET_COLORS = [
  '#FFFFFF', '#FFF8E7', '#FFD700', '#C8991A',
  '#FBBF24', '#E2D9C0', '#F0E68C', '#D4B896',
];

/* ── Helpers ── */
function resolveAudioUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return QURAN_CDN_BASE + raw.replace(/^\/+/, '');
}
function getAudioUrl(raw: string): string {
  const resolved = resolveAudioUrl(raw);
  // In native Capacitor, use direct URL; in browser, proxy to avoid CORS
  return isNative ? resolved : `/api/audio-proxy?url=${encodeURIComponent(resolved)}`;
}

async function shareOrDownload(blob: Blob, filename: string) {
  if (typeof navigator.share === 'function') {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'فيديو قرآني',
          text: 'من تطبيق نور الإسلامي',
        });
        return;
      } catch { /* user cancelled — fall through to download */ }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
}

async function loadFontForCanvas(): Promise<void> {
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

/* ── Types ── */
type Surah        = { id: number; name_arabic: string; verses_count: number };
type Recitation   = { id: number; name: string };
type VerseAudio   = Record<string, string>;
type WordTiming   = Record<string, number[][]>;
type CompletedVid = { blob: Blob; filename: string };
type WordEntry    = { word: string; startMs: number; endMs: number; globalIdx: number };

/* WebCodecs availability check */
const hasWebCodecs = typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder !== 'undefined'
  && typeof (window as unknown as { AudioEncoder?: unknown }).AudioEncoder !== 'undefined';

/* ════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════ */
export function QuranStatus() {

  const [surahs, setSurahs]               = useState<Surah[]>([]);
  const [recitations, setRecitations]     = useState<Recitation[]>([]);
  const [selectedSurah, setSurah]         = useState(1);
  const [fromAyah, setFromAyah]           = useState(1);
  const [toAyah, setToAyah]               = useState(1);
  const [selectedRec, setSelectedRec]     = useState<number>(0);
  const [verseTexts, setVerseTexts]       = useState<string[]>([]);
  const [loadingVerses, setLoadingV]      = useState(false);
  const [audioMap, setAudioMap]           = useState<VerseAudio>({});
  const [loadingAudio, setLoadingAudio]   = useState(false);
  const [wordTimingMap, setWordTimingMap] = useState<WordTiming>({});
  const audioCacheRef  = useRef<Map<string, VerseAudio>>(new Map());
  const timingCacheRef = useRef<Map<string, WordTiming>>(new Map());

  const [bgFile, setBgFile]               = useState<File | null>(null);
  const [bgObjectUrl, setBgObjUrl]        = useState<string | null>(null);
  const [bgType, setBgType]               = useState<'image' | 'video'>('image');
  const fileInputRef                      = useRef<HTMLInputElement>(null);
  const videoRef                          = useRef<HTMLVideoElement>(null);

  const [fontColor, setFontColor]         = useState('#FFFFFF');
  const [selectedFont, setFont]           = useState<FontId>('amiri');
  const [fontSizePct, setFontSizePct]     = useState(50); /* 0-100 */
  const [wordsPerPage, setWordsPerPage]   = useState(1);  /* 1-6 */

  /* Preview state */
  const [isPlaying, setIsPlaying]         = useState(false);
  const [audioLoading, setAudioLoad]      = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null);
  const stoppedRef                        = useRef(false);
  const previewAudiosRef                  = useRef<HTMLAudioElement[]>([]);
  const previewTicksRef                   = useRef<ReturnType<typeof setInterval>[]>([]);
  const [revealedSet, setRevealedSet]     = useState<Set<number>>(new Set());

  /* Recording */
  const [isRecording, setIsRecording]     = useState(false);
  const [recordPct, setRecordPct]         = useState(0);
  const [recordError, setRecordError]     = useState('');
  const [completedVid, setCompletedVid]   = useState<CompletedVid | null>(null);

  /* fontScale derived from 0-100 slider: 0→0.3, 50→1.0, 100→2.8 */
  const fontScale = 0.3 + (fontSizePct / 100) * 2.5;

  /* ── Fetch surahs ── */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/chapters?language=ar')
      .then(r => r.json()).then(d => setSurahs(d.chapters ?? [])).catch(() => {});
  }, []);

  /* ── Fetch recitations — filter out المنشاوي ── */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/resources/recitations?language=ar')
      .then(r => r.json())
      .then(d => {
        const EXCLUDED_NAMES = /منشاوي|manshawi|minshawi/i;
        const EXCLUDED_IDS   = new Set([7]); /* محمد صديق المنشاوي */
        const list: Recitation[] = (d.recitations ?? [])
          .map((r: { id: number; translated_name?: { name?: string }; reciter_name?: string }) => ({
            id: r.id,
            name: r.translated_name?.name ?? r.reciter_name ?? `قارئ ${r.id}`,
          }))
          .filter((r: Recitation) => !EXCLUDED_IDS.has(r.id) && !EXCLUDED_NAMES.test(r.name));
        setRecitations(list);
        if (list.length) setSelectedRec(list[0].id);
      }).catch(() => {});
  }, []);

  const maxAyah      = surahs.find(s => s.id === selectedSurah)?.verses_count ?? 286;
  const currentSurah = surahs.find(s => s.id === selectedSurah);
  const ayahRange    = fromAyah === toAyah ? `آية ${fromAyah}` : `الآيات ${fromAyah}–${toAyah}`;
  const allWords     = verseTexts.join(' ').split(' ').filter(Boolean);

  useEffect(() => { setFromAyah(1); setToAyah(1); }, [selectedSurah]);
  useEffect(() => { if (toAyah < fromAyah) setToAyah(fromAyah); }, [fromAyah, toAyah]);

  /* ── Fetch verse texts ── */
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

  /* ── Fetch audio URLs ── */
  useEffect(() => {
    if (!selectedRec) return;
    const key    = `${selectedRec}:${selectedSurah}`;
    const cached = audioCacheRef.current.get(key);
    if (cached) { setAudioMap(cached); return; }
    setLoadingAudio(true);
    fetch(`https://api.quran.com/api/v4/recitations/${selectedRec}/by_chapter/${selectedSurah}?per_page=300`)
      .then(r => r.json())
      .then(d => {
        const map: VerseAudio = {};
        for (const f of (d.audio_files ?? [])) map[f.verse_key] = f.url;
        audioCacheRef.current.set(key, map);
        setAudioMap(map);
      }).catch(() => {}).finally(() => setLoadingAudio(false));
  }, [selectedRec, selectedSurah]);

  /* ── Fetch word timing — FIX: s[1]=startMs, s[2]=endMs (s[0] is word position) ── */
  useEffect(() => {
    if (!selectedRec) return;
    const key    = `${selectedRec}:${selectedSurah}`;
    const cached = timingCacheRef.current.get(key);
    if (cached) { setWordTimingMap(cached); return; }
    fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${selectedRec}/audio_files?chapter_number=${selectedSurah}&per_page=300&segments=true`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const map: WordTiming = {};
        for (const f of (d.audio_files ?? [])) {
          if (f.verse_key && Array.isArray(f.segments)) {
            /* segments format: [word_position, start_ms, end_ms] — sort by word_position */
            map[f.verse_key] = (f.segments as number[][])
              .sort((a, b) => a[0] - b[0])
              .map((s: number[]) => [s[1], s[2]]); /* [start_ms, end_ms] */
          }
        }
        timingCacheRef.current.set(key, map);
        setWordTimingMap(map);
      }).catch(() => {});
  }, [selectedRec, selectedSurah]);

  /* ── Reset on change ── */
  useEffect(() => { stopPreview(); setCompletedVid(null); }, [selectedSurah, fromAyah, toAyah, selectedRec]);

  /* ── Background upload ── */
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    setBgFile(file); setBgObjUrl(URL.createObjectURL(file));
    setBgType(file.type.startsWith('video') ? 'video' : 'image');
  }, [bgObjectUrl]);

  /* ── Stop preview ── */
  function stopPreview() {
    stoppedRef.current = true;
    for (const t of previewTicksRef.current) clearInterval(t);
    previewTicksRef.current = [];
    for (const a of previewAudiosRef.current) { try { a.pause(); a.src = ''; } catch { /* ok */ } }
    previewAudiosRef.current = [];
    setIsPlaying(false);
    setCurrentWordIdx(null);
    setAudioLoad(false);
    setRevealedSet(new Set());
  }

  /* ── Preview (word-by-word, synced to audio.currentTime) ── */
  const togglePreview = useCallback(async () => {
    if (isPlaying) { stopPreview(); return; }
    if (verseTexts.length === 0) return;

    stoppedRef.current = false;
    setIsPlaying(true);
    setAudioLoad(true);
    setCurrentWordIdx(0);
    setRevealedSet(new Set([0]));

    let wordOffset = 0;

    for (let vi = 0; vi < verseTexts.length; vi++) {
      if (stoppedRef.current) break;
      const ayah   = fromAyah + vi;
      const vKey   = `${selectedSurah}:${ayah}`;
      const rawUrl = audioMap[vKey];
      const vWords = verseTexts[vi].split(' ').filter(Boolean);
      const timing = wordTimingMap[vKey];
      const hasTiming = Array.isArray(timing) && timing.length >= vWords.length;
      const capturedOffset = wordOffset;

      await new Promise<void>(resolve => {
        let settled = false;
        const settle = () => { if (!settled) { settled = true; resolve(); } };
        const kill = setTimeout(settle, 90_000);

        if (!rawUrl) {
          setAudioLoad(false);
          const lastIdx = capturedOffset + vWords.length - 1;
          setCurrentWordIdx(lastIdx);
          setRevealedSet(prev => {
            const next = new Set(prev);
            for (let i = capturedOffset; i <= lastIdx; i++) next.add(i);
            return next;
          });
          clearTimeout(kill); setTimeout(settle, 1500); return;
        }

        const audio = new Audio(getAudioUrl(rawUrl));
        audio.preload = 'auto';
        previewAudiosRef.current.push(audio);

        audio.onloadedmetadata = () => {
          if (stoppedRef.current) { clearTimeout(kill); settle(); return; }
          setAudioLoad(false);
          const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 5;

          audio.play().then(() => {
            const tick = setInterval(() => {
              if (stoppedRef.current) { clearInterval(tick); settle(); return; }
              const elapsedMs = audio.currentTime * 1000;

              let newIdx = capturedOffset;
              if (hasTiming) {
                for (let wi = 0; wi < vWords.length; wi++) {
                  if (elapsedMs >= (timing[wi]?.[0] ?? 0)) newIdx = capturedOffset + wi;
                }
              } else {
                const msPerWord = (dur * 1000) / vWords.length;
                newIdx = Math.min(
                  capturedOffset + vWords.length - 1,
                  capturedOffset + Math.floor(elapsedMs / msPerWord),
                );
              }
              setCurrentWordIdx(newIdx);
              setRevealedSet(prev => {
                const next = new Set(prev);
                for (let i = capturedOffset; i <= newIdx; i++) next.add(i);
                return next;
              });
              if (audio.ended || elapsedMs >= dur * 1000) clearInterval(tick);
            }, 16); /* ~60fps polling */

            previewTicksRef.current.push(tick);
            audio.onended = () => {
              clearInterval(tick); clearTimeout(kill);
              const last = capturedOffset + vWords.length - 1;
              setCurrentWordIdx(last);
              setRevealedSet(prev => {
                const next = new Set(prev);
                for (let i = capturedOffset; i <= last; i++) next.add(i);
                return next;
              });
              setTimeout(settle, 120);
            };
            audio.onerror = () => { clearInterval(tick); clearTimeout(kill); settle(); };
          }).catch(() => { clearTimeout(kill); settle(); });
        };

        audio.onerror = () => {
          setAudioLoad(false);
          clearTimeout(kill); setTimeout(settle, 1500);
        };
        audio.load();
      });

      wordOffset += vWords.length;
    }

    if (!stoppedRef.current) stopPreview();
  }, [isPlaying, verseTexts, fromAyah, selectedSurah, audioMap, wordTimingMap]);

  /* ── Video generation (MP4 via WebCodecs + mp4-muxer, fallback to MediaRecorder) ── */
  const generateVideo = useCallback(async () => {
    if (verseTexts.length === 0) return;
    setIsRecording(true); setRecordPct(2); setRecordError(''); setCompletedVid(null);

    try {
      const fontFamily = CANVAS_FONT[selectedFont];
      await loadFontForCanvas();

      /* Decode audio buffers */
      const audioCtx = new AudioContext();
      const buffers: AudioBuffer[] = [];

      for (let vi = 0; vi < verseTexts.length; vi++) {
        setRecordPct(5 + Math.round((vi / verseTexts.length) * 25));
        const vKey   = `${selectedSurah}:${fromAyah + vi}`;
        const rawUrl = audioMap[vKey];
        if (!rawUrl) { buffers.push(audioCtx.createBuffer(2, Math.round(audioCtx.sampleRate * 1.5), audioCtx.sampleRate)); continue; }
        try {
          const resp = await fetch(getAudioUrl(rawUrl));
          if (!resp.ok) throw new Error('audio fetch failed');
          buffers.push(await audioCtx.decodeAudioData(await resp.arrayBuffer()));
        } catch {
          buffers.push(audioCtx.createBuffer(2, Math.round(audioCtx.sampleRate * 1.5), audioCtx.sampleRate));
        }
      }

      setRecordPct(32);
      const totalDurationS  = buffers.reduce((s, b) => s + b.duration, 0);
      const totalDurationMs = totalDurationS * 1000;

      /* Build word timeline — uses fixed timing per word (ms accurate) */
      const timeline: WordEntry[] = [];
      let tOffset = 0, globalIdx = 0;
      for (let vi = 0; vi < verseTexts.length; vi++) {
        const words  = verseTexts[vi].split(' ').filter(Boolean);
        const dur    = buffers[vi].duration;
        const vKey   = `${selectedSurah}:${fromAyah + vi}`;
        const timing = wordTimingMap[vKey];
        const hasTiming = Array.isArray(timing) && timing.length >= words.length;
        words.forEach((w, wi) => {
          const startMs = hasTiming
            ? tOffset + (timing[wi]?.[0] ?? 0)
            : tOffset + (dur * 1000 / words.length) * wi;
          const endMs = hasTiming
            ? tOffset + (timing[wi]?.[1] ?? startMs + 500)
            : startMs + (dur * 1000 / words.length);
          timeline.push({ word: w, startMs, endMs, globalIdx: globalIdx++ });
        });
        tOffset += dur * 1000;
      }

      /* Canvas setup */
      const W = 1080, H = 1920, FPS = 30;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;
      const FADE_MS = 150;

      /* Load background */
      let bgImg: HTMLImageElement | null = null;
      if (bgObjectUrl && bgType === 'image') {
        const img = new Image(); img.src = bgObjectUrl;
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
        bgImg = img;
      }

      /* Load logo */
      let logoImg: HTMLImageElement | null = null;
      try {
        const l = new Image(); l.crossOrigin = 'anonymous';
        l.src = `${window.location.origin}/logo.png`;
        await new Promise<void>(r => { l.onload = () => r(); l.onerror = () => r(); });
        if (l.complete && l.naturalWidth > 0) logoImg = l;
      } catch { /* ok */ }

      const surahName = currentSurah?.name_arabic ?? '';

      const drawFrame = (elapsedMs: number) => {
        /* Background */
        if (bgImg) {
          const sc = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
          ctx.drawImage(bgImg,
            (W - bgImg.naturalWidth  * sc) / 2,
            (H - bgImg.naturalHeight * sc) / 2,
            bgImg.naturalWidth * sc, bgImg.naturalHeight * sc);
        } else if (bgObjectUrl && bgType === 'video' && videoRef.current) {
          const v = videoRef.current;
          const sc = Math.max(W / v.videoWidth, H / v.videoHeight);
          ctx.drawImage(v,
            (W - v.videoWidth  * sc) / 2,
            (H - v.videoHeight * sc) / 2,
            v.videoWidth * sc, v.videoHeight * sc);
        } else {
          const g = ctx.createLinearGradient(0, 0, W, H);
          g.addColorStop(0, '#0d1b0a'); g.addColorStop(1, '#060e04');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }

        /* Dark overlay */
        const ov = ctx.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, 'rgba(0,0,0,0.28)');
        ov.addColorStop(0.5, 'rgba(0,0,0,0.52)');
        ov.addColorStop(1, 'rgba(0,0,0,0.80)');
        ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);

        /* Basmala */
        ctx.font = `62px ${fontFamily}`; ctx.fillStyle = 'rgba(200,153,26,0.90)';
        ctx.textAlign = 'center'; ctx.direction = 'rtl';
        ctx.fillText('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', W / 2, 265);
        ctx.strokeStyle = 'rgba(200,153,26,0.45)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(160, 298); ctx.lineTo(920, 298); ctx.stroke();

        /* Current page */
        let currentIdxInTimeline = 0;
        for (let i = 0; i < timeline.length; i++) {
          if (timeline[i].startMs <= elapsedMs) currentIdxInTimeline = i;
        }
        const pageStart = Math.floor(currentIdxInTimeline / wordsPerPage) * wordsPerPage;
        const pageTL    = timeline.slice(pageStart, pageStart + wordsPerPage);
        const pageText  = pageTL.map(t => t.word).join(' ');

        const charCount  = pageText.length;
        const baseFontPx = Math.max(48, Math.min(200, Math.round(8800 / Math.sqrt(charCount + 1))));
        const fontSize   = Math.round(baseFontPx * fontScale);
        const lineH      = Math.round(fontSize * 2.0);

        ctx.font      = `bold ${fontSize}px ${fontFamily}`;
        ctx.direction = 'rtl'; ctx.textAlign = 'center';
        const lines   = wrapRTL(ctx, pageText, W * 0.86);
        const textH   = lines.length * lineH;
        let ty        = H / 2 - textH / 2 + 60;

        let wi = 0;
        ctx.save();
        for (const line of lines) {
          const lineWords  = line.split(' ');
          const totalLineW = ctx.measureText(line).width;
          let x = W / 2 + totalLineW / 2;
          for (const word of lineWords) {
            const wm    = ctx.measureText(word + ' ').width;
            const entry = pageTL[wi];
            if (entry) {
              const since  = elapsedMs - entry.startMs;
              const opacity = entry.startMs > elapsedMs
                ? 0
                : Math.min(1, since / FADE_MS);
              /* subtle translate-up on fade-in */
              const translateY = opacity < 1 ? (1 - opacity) * 18 : 0;
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.translate(0, translateY);
              ctx.shadowColor   = 'rgba(0,0,0,0.9)';
              ctx.shadowBlur    = 18;
              ctx.fillStyle     = fontColor;
              ctx.fillText(word, x - wm / 2, ty);
              ctx.restore();
            }
            x -= wm; wi++;
          }
          ty += lineH;
        }
        ctx.restore();

        /* Surah reference */
        ctx.globalAlpha = 1;
        ctx.font = `48px ${fontFamily}`; ctx.fillStyle = 'rgba(200,153,26,0.88)';
        ctx.direction = 'rtl'; ctx.textAlign = 'center';
        const refY = Math.max(H / 2 + textH / 2 + 80 + 60, H - 370);
        ctx.fillText(`﴿ ${surahName} — ${ayahRange} ﴾`, W / 2, refY);

        /* Logo + watermark */
        if (logoImg) { ctx.globalAlpha = 0.88; ctx.drawImage(logoImg, 60, H - 215, 108, 108); ctx.globalAlpha = 1; }
        ctx.direction = 'ltr'; ctx.textAlign = 'left';
        ctx.font = `bold 52px 'Segoe UI',sans-serif`; ctx.fillStyle = '#C8991A';
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
        ctx.fillText('Noor App', 188, H - 148);
        ctx.font = `34px Tajawal,sans-serif`; ctx.fillStyle = 'rgba(200,153,26,0.72)';
        ctx.fillText('تطبيق نور الإسلامي', 188, H - 104);
        ctx.shadowBlur = 0;
      };

      setRecordPct(36);

      /* ── Try WebCodecs MP4 muxer first ── */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const VideoEncoderClass = (window as any).VideoEncoder as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioEncoderClass = (window as any).AudioEncoder as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const VideoFrameClass   = (window as any).VideoFrame   as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioDataClass    = (window as any).AudioData    as any;

      let webCodecsDone = false;

      if (hasWebCodecs && VideoEncoderClass && AudioEncoderClass) {
        try {
          /* ── Find a supported H.264 codec config (most → least demanding) ── */
          const W_ = W, H_ = H, FPS_ = FPS;
          const codecCandidates = [
            { codec: 'avc1.4D4028', bitrate: 6_000_000 }, /* Main Profile Level 4.0   */
            { codec: 'avc1.42E028', bitrate: 5_000_000 }, /* Baseline Level 4.0        */
            { codec: 'avc1.42E01E', bitrate: 4_000_000 }, /* Baseline Level 3.0        */
            { codec: 'avc1.420015', bitrate: 3_000_000 }, /* Baseline Level 2.1        */
          ];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let videoConfig: any = null;
          for (const cand of codecCandidates) {
            try {
              const cfg = { ...cand, width: W_, height: H_, framerate: FPS_ };
              const sup = await VideoEncoderClass.isConfigSupported(cfg);
              if (sup.supported) { videoConfig = cfg; break; }
            } catch { /* try next */ }
          }
          if (!videoConfig) throw new Error('No supported H.264 encoder config found on this device');

          const target = new ArrayBufferTarget();
          const muxer  = new Muxer({
            target,
            video: { codec: 'avc', width: W_, height: H_ },
            audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 },
            fastStart: 'in-memory',
          });

          /* ── Video encoder ── */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let encodeError: any = null;
          const videoEncoder = new VideoEncoderClass({
            output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
            error:  (e: any) => { encodeError = e; },
          });
          videoEncoder.configure(videoConfig);
          /* Give the encoder a tick to settle */
          await new Promise(r => setTimeout(r, 0));
          if (videoEncoder.state === 'closed') throw new Error('VideoEncoder closed after configure — codec unsupported');

          /* ── Audio encoder ── */
          const SR = 44100;
          const audioEncoder = new AudioEncoderClass({
            output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
            error:  (e: any) => { encodeError = e; },
          });
          audioEncoder.configure({
            codec:            'mp4a.40.2',
            numberOfChannels: 2,
            sampleRate:       SR,
            bitrate:          192_000,
          });
          await new Promise(r => setTimeout(r, 0));
          if (audioEncoder.state === 'closed') throw new Error('AudioEncoder closed after configure');

          /* ── Encode audio buffers ── */
          const CHUNK = 2048;
          let audioTimestampUs = 0;
          for (const buf of buffers) {
            const ch0 = buf.getChannelData(0);
            const ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : ch0;
            for (let offset = 0; offset < buf.length; offset += CHUNK) {
              if (encodeError) throw encodeError;
              const len    = Math.min(CHUNK, buf.length - offset);
              const planar = new Float32Array(len * 2);
              for (let i = 0; i < len; i++) {
                planar[i]       = ch0[offset + i];
                planar[len + i] = ch1[offset + i];
              }
              const ad = new AudioDataClass({
                format:           'f32-planar',
                sampleRate:       SR,
                numberOfFrames:   len,
                numberOfChannels: 2,
                timestamp:        audioTimestampUs,
                data:             planar,
              });
              /* Backpressure */
              while (audioEncoder.encodeQueueSize > 30) await new Promise(r => setTimeout(r, 4));
              audioEncoder.encode(ad);
              ad.close();
              audioTimestampUs += Math.round((len / SR) * 1_000_000);
            }
          }

          /* ── Encode video frames ── */
          const totalFrames = Math.ceil(totalDurationS * FPS_);
          const frameDurUs  = 1_000_000 / FPS_;
          for (let fi = 0; fi < totalFrames; fi++) {
            if (encodeError) throw encodeError;
            /* Backpressure: yield if encoder queue is saturated */
            while (videoEncoder.encodeQueueSize > 15) await new Promise(r => setTimeout(r, 4));
            if (videoEncoder.state === 'closed') throw new Error('VideoEncoder was closed mid-encode');

            const elapsedMs = (fi / FPS_) * 1000;
            drawFrame(elapsedMs);
            const tsUs   = Math.round(fi * frameDurUs);
            const vf     = new VideoFrameClass(canvas, { timestamp: tsUs, duration: Math.round(frameDurUs) });
            const keyFrame = fi % (FPS_ * 2) === 0;
            videoEncoder.encode(vf, { keyFrame });
            vf.close();
            setRecordPct(36 + Math.round((fi / totalFrames) * 58));
            if (fi % 10 === 0) await new Promise(r => setTimeout(r, 0));
          }

          if (encodeError) throw encodeError;
          await videoEncoder.flush();
          await audioEncoder.flush();
          muxer.finalize();

          const blob = new Blob([target.buffer], { type: 'video/mp4' });
          await audioCtx.close();
          setCompletedVid({
            blob,
            filename: `noor-${selectedSurah}-${fromAyah}${fromAyah !== toAyah ? `-${toAyah}` : ''}.mp4`,
          });
          setRecordPct(100);
          webCodecsDone = true;

        } catch (wcErr) {
          console.warn('[WebCodecs] failed, falling back to MediaRecorder:', wcErr);
          /* fall through to MediaRecorder below */
        }
      }

      if (!webCodecsDone) {
        /* ── Fallback: MediaRecorder ── */
        const dest     = audioCtx.createMediaStreamDestination();
        const vStream  = canvas.captureStream(FPS);
        const combined = new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
        const mimes    = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
        const mimeType = mimes.find(m => MediaRecorder.isTypeSupported(m)) ?? '';
        const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
        const chunks: Blob[] = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.start(100);

        let schedTime = audioCtx.currentTime + 0.05;
        for (const buf of buffers) {
          const src = audioCtx.createBufferSource();
          src.buffer = buf; src.connect(dest); src.connect(audioCtx.destination);
          src.start(schedTime); schedTime += buf.duration;
        }
        const recStart = audioCtx.currentTime + 0.05;

        await new Promise<void>(resolve => {
          let raf: number;
          const loop = () => {
            const elapsed = (audioCtx.currentTime - recStart) * 1000;
            setRecordPct(36 + Math.round(Math.min(elapsed / totalDurationMs, 1) * 58));
            drawFrame(Math.max(0, elapsed));
            if (elapsed < totalDurationMs + 600) raf = requestAnimationFrame(loop);
            else { cancelAnimationFrame(raf); resolve(); }
          };
          raf = requestAnimationFrame(loop);
          setTimeout(() => { cancelAnimationFrame(raf); resolve(); }, (totalDurationS + 8) * 1000);
        });

        recorder.stop();
        await new Promise<void>(r => { recorder.onstop = () => r(); setTimeout(r, 3000); });
        await audioCtx.close();

        const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        setCompletedVid({
          blob,
          filename: `noor-${selectedSurah}-${fromAyah}${fromAyah !== toAyah ? `-${toAyah}` : ''}.${ext}`,
        });
        setRecordPct(100);
      }

    } catch (err: unknown) {
      setRecordError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الفيديو');
    } finally {
      setIsRecording(false);
    }
  }, [
    verseTexts, fromAyah, toAyah, selectedSurah, currentSurah,
    audioMap, wordTimingMap, bgObjectUrl, bgType,
    fontColor, selectedFont, fontScale, wordsPerPage, ayahRange,
  ]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => { if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl); stopPreview(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived preview values ── */
  const fontFamily    = FONT_OPTIONS.find(f => f.id === selectedFont)!.cssFamily;
  const previewFontPx = Math.round(22 * fontScale);

  /* Preview page words */
  const pageStart = currentWordIdx !== null
    ? Math.floor(currentWordIdx / wordsPerPage) * wordsPerPage
    : 0;
  const pageWords = currentWordIdx !== null
    ? allWords.slice(pageStart, pageStart + wordsPerPage)
    : [];

  /* ════════════════════════════════════ Render ── */
  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden bg-background" dir="rtl">

      {/* ── Header ── */}
      <div className="relative z-10 px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-md">
        <Link href="/more">
          <button className="p-2 rounded-full bg-primary/10 hover-elevate" data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/15">
            <Film size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              إنشاء فيديو قرآني
            </h1>
            <p className="text-xs leading-tight text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {hasWebCodecs ? 'جودة عالية MP4' : 'صوت القارئ كلمةً بكلمة'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Video Preview Panel ── */}
      <div className="relative z-10 flex-shrink-0 mx-4 mt-3">
        <div
          className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center border border-primary/25"
          style={{ aspectRatio: '9/16', maxHeight: '38vh' }}
        >
          {/* Background layer */}
          {bgObjectUrl && bgType === 'image' && (
            <img src={bgObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {bgObjectUrl && bgType === 'video' && (
            <video ref={videoRef} src={bgObjectUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay loop muted playsInline />
          )}
          {!bgObjectUrl && (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#0e1f0b 0%,#142e10 40%,#060e04 100%)' }} />
          )}

          {/* Dark wash */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0.20) 0%,rgba(0,0,0,0.48) 50%,rgba(0,0,0,0.75) 100%)' }} />

          {/* Basmala */}
          <div className="absolute top-2.5 inset-x-0 flex flex-col items-center pointer-events-none gap-1">
            <span style={{ fontFamily: '"Amiri Quran","Amiri","Traditional Arabic",serif', fontSize: '8px', color: 'rgba(200,153,26,0.90)', direction: 'rtl' }}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
            <div style={{ width: 34, height: 1, background: 'rgba(200,153,26,0.32)' }} />
          </div>

          {/* Verse content */}
          <div className="relative z-10 px-4 text-center w-full">
            {loadingVerses ? (
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-primary" />
            ) : allWords.length === 0 ? (
              <p style={{ fontFamily: '"Tajawal",sans-serif', fontSize: '10px', color: 'rgba(200,153,26,0.45)', direction: 'rtl' }}>
                اختر سورة وآية لعرضها هنا
              </p>
            ) : currentWordIdx !== null ? (
              /* Playback: show page words with per-word fade-in */
              <div style={{ direction: 'rtl', lineHeight: 2.1 }}>
                {pageWords.map((word, i) => {
                  const globalI = pageStart + i;
                  const isRevealed = revealedSet.has(globalI);
                  return (
                    <span
                      key={`${pageStart}-${i}`}
                      style={{
                        fontFamily,
                        fontSize: `${previewFontPx}px`,
                        color: fontColor,
                        textShadow: '0 2px 12px rgba(0,0,0,0.95)',
                        display: 'inline-block',
                        marginRight: '0.25em',
                        opacity: isRevealed ? 1 : 0,
                        transform: isRevealed ? 'translateY(0)' : 'translateY(6px)',
                        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ) : (
              /* Static preview */
              <p style={{
                fontFamily,
                fontSize: `${Math.round(14 * fontScale)}px`,
                color: fontColor,
                direction: 'rtl',
                textShadow: '0 2px 12px rgba(0,0,0,0.95)',
                lineHeight: 2.2,
              }}>
                {allWords.join(' ')}
              </p>
            )}
          </div>

          {/* Surah tag */}
          {verseTexts.length > 0 && !loadingVerses && (
            <div className="absolute bottom-5 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full text-center"
                style={{
                  fontFamily: '"Tajawal",sans-serif', fontSize: '7.5px',
                  background: 'rgba(0,0,0,0.55)', color: 'rgba(200,153,26,0.92)',
                  border: '1px solid rgba(200,153,26,0.28)', backdropFilter: 'blur(4px)',
                }}>
                ﴿ {currentSurah?.name_arabic} — {ayahRange} ﴾
              </span>
            </div>
          )}

          {/* Watermark */}
          <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1 pointer-events-none" style={{ direction: 'ltr' }}>
            <img src="/logo.png" alt="Noor" style={{ width: 18, height: 18, borderRadius: '50%', opacity: 0.88 }} />
            <span style={{ fontFamily: "'Segoe UI',sans-serif", fontSize: '6.5px', fontWeight: 700, color: 'rgba(200,153,26,0.72)' }}>Noor App</span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-2.5 pb-2 space-y-2">

        {/* Upload */}
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl p-2.5 flex items-center gap-3 text-right border bg-card hover-elevate"
          style={{ borderColor: bgFile ? 'hsl(var(--primary)/0.5)' : 'hsl(var(--border))' }}
          data-testid="button-upload-bg">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
            <Upload size={17} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate text-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
              {bgFile ? bgFile.name : 'رفع صورة أو فيديو خلفية'}
            </p>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>
              {bgFile ? (bgType === 'video' ? 'فيديو خلفية' : 'صورة خلفية') : 'اختر من جهازك'}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        </button>

        {/* Surah / From / To */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'السورة', content: (
              <select value={selectedSurah} onChange={e => setSurah(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-xs outline-none truncate text-primary"
                style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
                data-testid="select-surah">
                {surahs.map(s => (
                  <option key={s.id} value={s.id}
                    style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                    {s.id}. {s.name_arabic}
                  </option>
                ))}
              </select>
            )},
            { label: 'من آية', content: (
              <select value={fromAyah} onChange={e => setFromAyah(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm outline-none text-primary"
                style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
                data-testid="select-from-ayah">
                {Array.from({ length: maxAyah }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}
                    style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>{n}</option>
                ))}
              </select>
            )},
            { label: 'إلى آية', content: (
              <select value={toAyah} onChange={e => setToAyah(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm outline-none text-primary"
                style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
                data-testid="select-to-ayah">
                {Array.from({ length: maxAyah - fromAyah + 1 }, (_, i) => fromAyah + i).map(n => (
                  <option key={n} value={n}
                    style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>{n}</option>
                ))}
              </select>
            )},
          ].map(({ label, content }) => (
            <div key={label} className="rounded-2xl p-2.5 bg-card border border-border">
              <p className="text-xs mb-1 text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>{label}</p>
              {content}
            </div>
          ))}
        </div>

        {/* Reciter */}
        <div className="rounded-2xl p-2.5 bg-card border border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>القارئ</p>
            {loadingAudio && <Loader2 size={12} className="animate-spin text-primary" />}
          </div>
          <select value={selectedRec} onChange={e => setSelectedRec(Number(e.target.value))}
            className="w-full bg-transparent font-bold text-sm outline-none text-primary"
            style={{ fontFamily: '"Tajawal",sans-serif', direction: 'rtl' }}
            disabled={recitations.length === 0}
            data-testid="select-reciter">
            {recitations.length === 0
              ? <option>جارٍ التحميل...</option>
              : recitations.map(r => (
                <option key={r.id} value={r.id}
                  style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                  {r.name}
                </option>
              ))
            }
          </select>
        </div>

        {/* Words per page */}
        <div className="rounded-2xl p-2.5 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>عدد الكلمات في الصفحة</p>
            <span className="text-xs font-bold text-primary" style={{ fontFamily: '"Tajawal",sans-serif' }}>
              {wordsPerPage} {wordsPerPage === 1 ? 'كلمة' : 'كلمات'}
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setWordsPerPage(n)}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  fontFamily: '"Tajawal",sans-serif',
                  background: wordsPerPage === n ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--muted))',
                  border: `1px solid ${wordsPerPage === n ? 'hsl(var(--primary)/0.6)' : 'hsl(var(--border))'}`,
                  color: wordsPerPage === n ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
                data-testid={`button-words-${n}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Font picker */}
        <div className="rounded-2xl p-2.5 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>نوع الخط</p>
            <Type size={13} className="text-primary" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FONT_OPTIONS.map(f => (
              <button key={f.id} onClick={() => setFont(f.id as FontId)}
                className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all"
                style={{
                  fontFamily: f.cssFamily,
                  background: selectedFont === f.id ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--muted))',
                  border: `1px solid ${selectedFont === f.id ? 'hsl(var(--primary)/0.6)' : 'hsl(var(--border))'}`,
                  color: selectedFont === f.id ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                }}
                data-testid={`button-font-${f.id}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Color */}
        <div className="rounded-2xl p-2.5 bg-card border border-border">
          <p className="text-xs mb-2 text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>لون الخط</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setFontColor(c)}
                style={{
                  width: 27, height: 27, borderRadius: '50%', background: c, flexShrink: 0,
                  border: fontColor === c ? '3px solid hsl(var(--primary))' : '2px solid hsl(var(--border))',
                  transform: fontColor === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s',
                }} />
            ))}
            <label style={{
              width: 27, height: 27, borderRadius: '50%', flexShrink: 0,
              background: 'hsl(var(--muted))', border: '2px solid hsl(var(--border))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
              <Palette style={{ width: 13, height: 13, color: 'hsl(var(--muted-foreground))', position: 'relative', zIndex: 1 }} />
              <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            </label>
          </div>
        </div>

        {/* Font Size Slider 0-100 */}
        <div className="rounded-2xl p-2.5 bg-card border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif' }}>حجم الخط</p>
            <span className="text-xs font-bold text-primary" style={{ fontFamily: '"Tajawal",sans-serif' }}>
              {fontSizePct}
            </span>
          </div>
          <input
            type="range" min={0} max={100} step={1}
            value={fontSizePct}
            onChange={e => setFontSizePct(parseInt(e.target.value))}
            data-testid="slider-font-size"
            dir="ltr"
            style={{
              width: '100%', accentColor: 'hsl(var(--primary))', cursor: 'pointer',
              height: 4, borderRadius: 2, outline: 'none', appearance: 'none',
              background: `linear-gradient(to right, hsl(var(--primary)) ${fontSizePct}%, hsl(var(--muted)) ${fontSizePct}%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif', fontSize: 10 }}>٠</span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal",sans-serif', fontSize: 10 }}>١٠٠</span>
          </div>
        </div>

        {/* Error */}
        {recordError && (
          <div className="rounded-2xl p-2.5 text-center text-xs"
            style={{ fontFamily: '"Tajawal",sans-serif', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {recordError}
          </div>
        )}

        {/* Share / Download button after generation */}
        {completedVid && (
          <button
            onClick={() => shareOrDownload(completedVid.blob, completedVid.filename)}
            className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-sm bg-primary/15 border border-primary/40 text-primary hover-elevate"
            style={{ fontFamily: '"Tajawal",sans-serif' }}
            data-testid="button-share-video">
            <Share2 size={16} />
            {typeof navigator.share === 'function' ? 'مشاركة الفيديو' : 'تنزيل الفيديو'}
          </button>
        )}
      </div>

      {/* ── Action Bar ── */}
      <div className="relative z-10 flex-shrink-0 px-4 py-3 flex gap-2 border-t border-border bg-card/80 backdrop-blur-md">

        <button onClick={togglePreview}
          disabled={audioLoading || loadingVerses || verseTexts.length === 0 || isRecording}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm flex-shrink-0 transition-all"
          style={{
            fontFamily: '"Tajawal",sans-serif',
            background: isPlaying ? 'hsl(var(--primary)/0.18)' : 'hsl(var(--muted))',
            border: `1px solid ${isPlaying ? 'hsl(var(--primary)/0.5)' : 'hsl(var(--border))'}`,
            color: isPlaying ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
            minWidth: 88,
            opacity: (loadingVerses || verseTexts.length === 0) ? 0.4 : 1,
          }}
          data-testid="button-preview">
          {audioLoading ? <Loader2 size={16} className="animate-spin" />
            : isPlaying ? <><Pause size={15} /> إيقاف</>
            : <><Play size={15} /> معاينة</>}
        </button>

        <button onClick={generateVideo}
          disabled={isRecording || loadingVerses || verseTexts.length === 0 || isPlaying || loadingAudio}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{
            fontFamily: '"Tajawal",sans-serif',
            background: completedVid
              ? 'hsl(var(--primary)/0.2)'
              : 'hsl(var(--primary)/0.15)',
            border: `1px solid hsl(var(--primary)/${completedVid ? '0.6' : '0.4'})`,
            color: 'hsl(var(--primary))',
            opacity: (loadingVerses || verseTexts.length === 0) ? 0.4 : 1,
          }}
          data-testid="button-generate-video">
          {isRecording
            ? <><Loader2 size={15} className="animate-spin" /> {recordPct > 0 ? `${recordPct}٪` : 'جارٍ الإنشاء...'}</>
            : completedVid
              ? <><Check size={15} /> تم الإنشاء</>
              : <><Film size={15} /> إنشاء فيديو MP4</>}
        </button>
      </div>
    </div>
  );
}
