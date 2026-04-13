import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Play, Pause, Download, Palette, Check, Film, Loader2, Type,
} from 'lucide-react';
import { Link } from 'wouter';

/* ── Constants ──────────────────────────────────────────────────────── */
const WORDS_PER_PAGE = 6;
const QURAN_CDN_BASE = 'https://verses.quran.com/';

/* ── Arabic font options ────────────────────────────────────────────── */
const FONT_OPTIONS = [
  { id: 'amiri',         name: 'أميري',        cssFamily: 'Amiri, serif' },
  { id: 'scheherazade',  name: 'شهرزاد',       cssFamily: '"Scheherazade New", serif' },
  { id: 'lateef',        name: 'لطيف',         cssFamily: 'Lateef, serif' },
  { id: 'noto',          name: 'نوتو نسخ',     cssFamily: '"Noto Naskh Arabic", serif' },
  { id: 'reem',          name: 'ريم كوفي',     cssFamily: '"Reem Kufi", serif' },
] as const;
type FontId = typeof FONT_OPTIONS[number]['id'];

/* ── Canvas font family map ─────────────────────────────────────────── */
const CANVAS_FONT: Record<FontId, string> = {
  amiri:        'Amiri, "Traditional Arabic", serif',
  scheherazade: '"Scheherazade New", "Traditional Arabic", serif',
  lateef:       'Lateef, "Traditional Arabic", serif',
  noto:         '"Noto Naskh Arabic", "Traditional Arabic", serif',
  reem:         '"Reem Kufi", "Traditional Arabic", serif',
};

/* ── Preset font colors ─────────────────────────────────────────────── */
const PRESET_COLORS = [
  '#FFFFFF', '#FFF8E7', '#FFD700', '#C8991A',
  '#86efac', '#93c5fd', '#fca5a5', '#e9d5ff',
];

/* ── Helpers ────────────────────────────────────────────────────────── */
function resolveAudioUrl(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return QURAN_CDN_BASE + raw.replace(/^\/+/, '');
}
function proxied(url: string) {
  return `/api/audio-proxy?url=${encodeURIComponent(resolveAudioUrl(url))}`;
}
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
}
async function loadFontForCanvas(family: string): Promise<void> {
  try {
    await document.fonts.ready;
    const loaded = [...document.fonts].some(f =>
      family.toLowerCase().includes(f.family.toLowerCase().replace(/"/g, '')) && f.status === 'loaded'
    );
    if (!loaded) await document.fonts.ready;
  } catch { /* ok */ }
}

/* ── RTL text wrap ──────────────────────────────────────────────────── */
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

/* ── Types ──────────────────────────────────────────────────────────── */
type Surah        = { id: number; name_arabic: string; verses_count: number };
type Recitation   = { id: number; name: string };
type VerseAudio   = Record<string, string>;
type WordTiming   = Record<string, number[][]>;
type CompletedVid = { blob: Blob; filename: string };
type WordEntry    = { word: string; startMs: number; endMs: number; globalIdx: number };

/* ════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════ */
export function QuranStatus() {

  const [surahs, setSurahs]               = useState<Surah[]>([]);
  const [recitations, setRecitations]     = useState<Recitation[]>([]);
  const [selectedSurah, setSurah]         = useState(1);
  const [fromAyah, setFromAyah]           = useState(1);
  const [toAyah, setToAyah]               = useState(1);
  const [selectedRec, setSelectedRec]     = useState<number>(7);
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
  const [fontScale, setFontScale]         = useState(1.0); /* 0.6 – 2.0 */

  /* Preview state */
  const [isPlaying, setIsPlaying]         = useState(false);
  const [audioLoading, setAudioLoad]      = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null); /* global word index (0-based) */
  const stoppedRef                        = useRef(false);
  const previewAudiosRef                  = useRef<HTMLAudioElement[]>([]);
  const previewTicksRef                   = useRef<ReturnType<typeof setInterval>[]>([]);

  /* Recording */
  const [isRecording, setIsRecording]     = useState(false);
  const [recordPct, setRecordPct]         = useState(0);
  const [recordError, setRecordError]     = useState('');
  const [completedVid, setCompletedVid]   = useState<CompletedVid | null>(null);

  /* Preview panel ref for scale calculation */
  const previewContainerRef               = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale]   = useState(0.25);

  /* ── Scale calculation ── */
  useEffect(() => {
    const update = () => {
      if (previewContainerRef.current) {
        const w = previewContainerRef.current.getBoundingClientRect().width;
        if (w > 0) setPreviewScale(w / 1080);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (previewContainerRef.current) ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Fetch surahs ── */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/chapters?language=ar')
      .then(r => r.json()).then(d => setSurahs(d.chapters ?? [])).catch(() => {});
  }, []);

  /* ── Fetch recitations ── */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/resources/recitations?language=ar')
      .then(r => r.json())
      .then(d => {
        const list: Recitation[] = (d.recitations ?? []).map((r: { id: number; translated_name?: { name?: string }; reciter_name?: string }) => ({
          id: r.id,
          name: r.translated_name?.name ?? r.reciter_name ?? `قارئ ${r.id}`,
        }));
        setRecitations(list);
        if (list.length && !list.find(r => r.id === 7)) setSelectedRec(list[0].id);
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

  /* ── Fetch word timing ── */
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
          if (f.verse_key && Array.isArray(f.segments))
            map[f.verse_key] = (f.segments as number[][]).map((s: number[]) => [s[0], s[1]]);
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
  }

  /* ── Preview play (word-by-word, synced to audio.currentTime) ── */
  const togglePreview = useCallback(async () => {
    if (isPlaying) { stopPreview(); return; }
    if (verseTexts.length === 0) return;

    stoppedRef.current = false;
    setIsPlaying(true);
    setAudioLoad(true);
    setCurrentWordIdx(0);

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
          setCurrentWordIdx(capturedOffset + vWords.length - 1);
          clearTimeout(kill); setTimeout(settle, 1500); return;
        }

        const audio = new Audio(proxied(rawUrl));
        audio.preload = 'auto';
        previewAudiosRef.current.push(audio);

        audio.onloadedmetadata = () => {
          if (stoppedRef.current) { clearTimeout(kill); settle(); return; }
          setAudioLoad(false);
          const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 5;

          audio.play().then(() => {
            const tick = setInterval(() => {
              if (stoppedRef.current) { clearInterval(tick); settle(); return; }
              const elapsedMs = audio.currentTime * 1000; /* accurate to playback position */

              let newIdx = capturedOffset;
              if (hasTiming) {
                /* Use actual timestamps: show word when audio reaches it */
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
              if (audio.ended || elapsedMs >= dur * 1000) clearInterval(tick);
            }, 25);

            previewTicksRef.current.push(tick);
            audio.onended = () => {
              clearInterval(tick); clearTimeout(kill);
              setCurrentWordIdx(capturedOffset + vWords.length - 1);
              setTimeout(settle, 100);
            };
            audio.onerror = () => { clearInterval(tick); clearTimeout(kill); settle(); };
          }).catch(() => { clearTimeout(kill); settle(); });
        };

        audio.onerror = () => {
          setAudioLoad(false);
          setCurrentWordIdx(capturedOffset + vWords.length - 1);
          clearTimeout(kill); setTimeout(settle, 1500);
        };
        audio.load();
      });

      wordOffset += vWords.length;
    }

    if (!stoppedRef.current) stopPreview();
  }, [isPlaying, verseTexts, fromAyah, selectedSurah, audioMap, wordTimingMap]);

  /* ── Video generation ── */
  const generateVideo = useCallback(async () => {
    if (verseTexts.length === 0) return;
    setIsRecording(true); setRecordPct(2); setRecordError(''); setCompletedVid(null);

    try {
      const fontFamily = CANVAS_FONT[selectedFont];
      await loadFontForCanvas(fontFamily);

      /* Decode audio */
      const audioCtx = new AudioContext();
      const buffers: AudioBuffer[] = [];

      for (let vi = 0; vi < verseTexts.length; vi++) {
        setRecordPct(5 + Math.round((vi / verseTexts.length) * 30));
        const ayah = fromAyah + vi;
        const vKey = `${selectedSurah}:${ayah}`;
        const rawUrl = audioMap[vKey];
        if (!rawUrl) { buffers.push(audioCtx.createBuffer(1, Math.round(44100 * 2), 44100)); continue; }
        try {
          const resp = await fetch(proxied(rawUrl));
          if (!resp.ok) throw new Error('audio fetch failed');
          buffers.push(await audioCtx.decodeAudioData(await resp.arrayBuffer()));
        } catch {
          buffers.push(audioCtx.createBuffer(1, Math.round(44100 * 2), 44100));
        }
      }

      setRecordPct(38);
      const totalDuration = buffers.reduce((s, b) => s + b.duration, 0);

      /* Build word timeline */
      const timeline: WordEntry[] = [];
      let tOffset = 0, globalIdx = 0;
      for (let vi = 0; vi < verseTexts.length; vi++) {
        const words  = verseTexts[vi].split(' ').filter(Boolean);
        const dur    = buffers[vi].duration;
        const vKey   = `${selectedSurah}:${fromAyah + vi}`;
        const timing = wordTimingMap[vKey];
        const hasTiming = Array.isArray(timing) && timing.length >= words.length;
        words.forEach((w, wi) => {
          const startMs = hasTiming ? tOffset + (timing[wi][0] ?? 0) : tOffset + (dur * 1000 / words.length) * wi;
          const endMs   = hasTiming ? tOffset + (timing[wi][1] ?? startMs + 500) : startMs + (dur * 1000 / words.length);
          timeline.push({ word: w, startMs, endMs, globalIdx: globalIdx++ });
        });
        tOffset += dur * 1000;
      }

      /* Canvas */
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      /* Load assets */
      let bgImg: HTMLImageElement | null = null;
      if (bgObjectUrl && bgType === 'image') {
        const img = new Image(); img.src = bgObjectUrl;
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
        bgImg = img;
      }

      let basmalImg: HTMLImageElement | null = null;
      try {
        const bl = new Image(); bl.crossOrigin = 'anonymous'; bl.src = `${window.location.origin}/basmala.jpg`;
        await new Promise<void>(r => { bl.onload = () => r(); bl.onerror = () => r(); });
        if (bl.complete && bl.naturalWidth > 0) basmalImg = bl;
      } catch { /* ok */ }

      let logoImg: HTMLImageElement | null = null;
      try {
        const l = new Image(); l.crossOrigin = 'anonymous'; l.src = `${window.location.origin}/logo.png`;
        await new Promise<void>(r => { l.onload = () => r(); l.onerror = () => r(); });
        if (l.complete && l.naturalWidth > 0) logoImg = l;
      } catch { /* ok */ }

      const surahName = currentSurah?.name_arabic ?? '';
      const FADE_MS   = 120;

      const drawFrame = (elapsedMs: number) => {
        /* Background */
        if (bgImg) {
          const sc = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
          ctx.drawImage(bgImg, (W - bgImg.naturalWidth * sc) / 2, (H - bgImg.naturalHeight * sc) / 2,
            bgImg.naturalWidth * sc, bgImg.naturalHeight * sc);
        } else if (bgObjectUrl && bgType === 'video' && videoRef.current) {
          const v = videoRef.current;
          const sc = Math.max(W / v.videoWidth, H / v.videoHeight);
          ctx.drawImage(v, (W - v.videoWidth * sc) / 2, (H - v.videoHeight * sc) / 2, v.videoWidth * sc, v.videoHeight * sc);
        } else {
          const g = ctx.createLinearGradient(0, 0, W, H);
          g.addColorStop(0, '#0d1b0a'); g.addColorStop(1, '#060e04');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        /* Dark overlay */
        const ov = ctx.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, 'rgba(0,0,0,0.30)'); ov.addColorStop(0.5, 'rgba(0,0,0,0.55)'); ov.addColorStop(1, 'rgba(0,0,0,0.80)');
        ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);

        /* Basmala image */
        if (basmalImg) {
          const bw  = 880;
          const bh  = Math.round(bw * (basmalImg.naturalHeight / basmalImg.naturalWidth));
          const bx  = (W - bw) / 2;
          const by  = 140;
          ctx.globalAlpha = 0.95;
          ctx.drawImage(basmalImg, bx, by, bw, bh);
          ctx.globalAlpha = 1;
          /* Gold line under basmala — generous gap */
          ctx.strokeStyle = 'rgba(200,153,26,0.6)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(160, by + bh + 110); ctx.lineTo(920, by + bh + 110); ctx.stroke();
        } else {
          /* Text fallback */
          ctx.font = `60px ${fontFamily}`; ctx.fillStyle = 'rgba(200,153,26,0.90)';
          ctx.textAlign = 'center'; ctx.direction = 'rtl';
          ctx.fillText('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', W / 2, 260);
          ctx.strokeStyle = 'rgba(200,153,26,0.50)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(160, 290); ctx.lineTo(920, 290); ctx.stroke();
        }

        /* ── 6-word page ── */
        let currentWordIdxCanvas = 0;
        for (let i = 0; i < timeline.length; i++) {
          if (timeline[i].startMs <= elapsedMs) currentWordIdxCanvas = i;
        }
        const pageStart = Math.floor(currentWordIdxCanvas / WORDS_PER_PAGE) * WORDS_PER_PAGE;
        const pageTL    = timeline.slice(pageStart, pageStart + WORDS_PER_PAGE);
        const pageText  = pageTL.map(t => t.word).join(' ');

        const charCount = pageText.length;
        const fontSize  = Math.max(50, Math.min(180, Math.round(9000 / Math.sqrt(charCount + 1) * fontScale)));
        const lineH     = Math.round(fontSize * 1.9);

        ctx.font      = `bold ${fontSize}px ${fontFamily}`;
        ctx.direction = 'rtl'; ctx.textAlign = 'center';
        const lines   = wrapRTL(ctx, pageText, W * 0.84);
        const textH   = lines.length * lineH;
        let ty        = H / 2 - textH / 2 + 80;

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
              const since = elapsedMs - entry.startMs;
              const opacity = entry.startMs > elapsedMs ? 0 : Math.min(1, since / FADE_MS);
              ctx.globalAlpha = opacity;
              ctx.fillStyle   = fontColor;
              ctx.fillText(word, x - wm / 2, ty);
            }
            x -= wm; wi++;
          }
          ty += lineH;
        }
        ctx.restore();

        /* Surah reference */
        ctx.globalAlpha = 1;
        ctx.font = `46px ${fontFamily}`; ctx.fillStyle = 'rgba(200,153,26,0.85)';
        ctx.direction = 'rtl'; ctx.textAlign = 'center';
        const refY = Math.max(H / 2 + textH / 2 + 80 + 60, H - 360);
        ctx.fillText(`﴿ ${surahName} — ${ayahRange} ﴾`, W / 2, refY);

        /* Logo + watermark */
        if (logoImg) { ctx.globalAlpha = 0.88; ctx.drawImage(logoImg, 60, H - 210, 104, 104); ctx.globalAlpha = 1; }
        ctx.direction = 'ltr'; ctx.textAlign = 'left';
        ctx.font = `bold 50px 'Segoe UI', sans-serif`; ctx.fillStyle = '#C8991A';
        ctx.fillText('Noor App', 182, H - 148);
        ctx.font = `32px 'Tajawal', sans-serif`; ctx.fillStyle = 'rgba(200,153,26,0.70)';
        ctx.fillText('تطبيق نور الإسلامي', 182, H - 104);
      };

      setRecordPct(40);

      /* MediaRecorder */
      const dest     = audioCtx.createMediaStreamDestination();
      const vStream  = canvas.captureStream(30);
      const combined = new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const mimeTypes = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'];
      const mimeType  = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) ?? '';
      const recorder  = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      /* Schedule audio */
      let schedTime = audioCtx.currentTime + 0.05;
      for (const buf of buffers) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf; src.connect(dest); src.connect(audioCtx.destination);
        src.start(schedTime); schedTime += buf.duration;
      }
      const recStart = audioCtx.currentTime + 0.05;

      /* Animation loop */
      await new Promise<void>(resolve => {
        let raf: number;
        const loop = () => {
          const elapsed = (audioCtx.currentTime - recStart) * 1000;
          setRecordPct(40 + Math.round(Math.min(elapsed / (totalDuration * 1000), 1) * 55));
          drawFrame(Math.max(0, elapsed));
          if (elapsed < totalDuration * 1000 + 600) raf = requestAnimationFrame(loop);
          else { cancelAnimationFrame(raf); resolve(); }
        };
        raf = requestAnimationFrame(loop);
        setTimeout(() => { cancelAnimationFrame(raf); resolve(); }, (totalDuration + 8) * 1000);
      });

      recorder.stop();
      await new Promise<void>(r => { recorder.onstop = () => r(); setTimeout(r, 3000); });
      await audioCtx.close();
      setRecordPct(99);

      const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      setCompletedVid({ blob, filename: `noor-${selectedSurah}-${fromAyah}${fromAyah !== toAyah ? `-${toAyah}` : ''}.${ext}` });
      setRecordPct(100);

    } catch (err: unknown) {
      setRecordError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الفيديو');
    } finally {
      setIsRecording(false);
    }
  }, [verseTexts, fromAyah, toAyah, selectedSurah, currentSurah, audioMap, wordTimingMap,
      bgObjectUrl, bgType, fontColor, selectedFont, fontScale, ayahRange]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => { if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl); stopPreview(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived preview values ── */
  const fontFamily = FONT_OPTIONS.find(f => f.id === selectedFont)!.cssFamily;
  const textForSize = allWords.join(' ');

  /* Active page for preview (null = static, showing first page) */
  const activePage = currentWordIdx !== null
    ? Math.floor(currentWordIdx / WORDS_PER_PAGE)
    : 0;
  const pageStart  = activePage * WORDS_PER_PAGE;
  const pageWords  = allWords.slice(pageStart, pageStart + WORDS_PER_PAGE);

  /* Font size for preview panel (in 1080px space) — includes user scale */
  const pageText    = pageWords.join(' ');
  const charCount   = pageText.length || 1;
  const canvasFontSize = Math.max(50, Math.min(180, Math.round(9000 / Math.sqrt(charCount + 1) * fontScale)));

  /* ════════════════════════════════════ Render ── */
  return (
    <div
      className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #0d1b0a 0%, #060e04 100%)' }}
    >
      {/* Header */}
      <div className="relative z-10 px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b"
        style={{ background: 'rgba(0,0,0,0.55)', borderColor: 'rgba(200,153,26,0.2)', backdropFilter: 'blur(12px)' }}>
        <Link href="/more">
          <button className="p-2 rounded-full" style={{ background: 'rgba(200,153,26,0.15)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#C8991A' }} />
          </button>
        </Link>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C8991A, #8B6340)' }}>
            <Film size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>إنشاء فيديو</h1>
            <p className="text-xs leading-tight"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>
              فيديو قرآني مع صوت القارئ كلمةً بكلمة
            </p>
          </div>
        </div>
      </div>

      {/* ── Preview Panel — pixel-perfect scaled canvas replica ── */}
      <div className="relative z-10 flex-shrink-0 mx-4 mt-3">
        <div
          ref={previewContainerRef}
          className="w-full rounded-3xl overflow-hidden relative"
          style={{ aspectRatio: '9/16', maxHeight: '40vh', border: '1.5px solid rgba(200,153,26,0.35)' }}
        >
          {/* Outer clip wrapper */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Inner element rendered at full 1080×1920 then scaled down */}
            <div style={{
              width: 1080, height: 1920,
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              position: 'absolute', top: 0, left: 0,
            }}>
              {/* Background */}
              {bgObjectUrl && bgType === 'image' && (
                <img src={bgObjectUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              {bgObjectUrl && bgType === 'video' && (
                <video ref={videoRef} src={bgObjectUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  autoPlay loop muted playsInline />
              )}
              {!bgObjectUrl && (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0e1f0b 0%, #142e10 40%, #060e04 100%)' }} />
              )}
              {/* Dark overlay */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.78) 100%)' }} />

              {/* Basmala image */}
              <div style={{ position: 'absolute', top: 140, left: 100, right: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/basmala.jpg" alt="بسم الله الرحمن الرحيم"
                  style={{ width: '100%', height: 'auto', objectFit: 'contain', opacity: 0.95 }} />
                <div style={{ width: 760, height: 3, background: 'rgba(200,153,26,0.55)', marginTop: 110 }} />
              </div>

              {/* Loading spinner */}
              {loadingVerses && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 style={{ width: 60, height: 60, color: '#C8991A', animation: 'spin 1s linear infinite' }} />
                </div>
              )}

              {/* 6-word page — each word fades in individually */}
              {!loadingVerses && pageWords.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%', left: 60, right: 60,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '0 28px',
                  direction: 'rtl',
                  textAlign: 'center',
                  lineHeight: 1.9,
                }}>
                  {pageWords.map((word, i) => {
                    const globalI = pageStart + i;
                    const isVisible = currentWordIdx === null
                      ? true
                      : globalI <= (currentWordIdx ?? -1);
                    return (
                      <span key={`${pageStart}-${i}`}
                        style={{
                          fontFamily,
                          fontSize: canvasFontSize,
                          color: fontColor,
                          textShadow: '0 3px 18px rgba(0,0,0,0.98)',
                          opacity: isVisible ? 1 : 0,
                          transition: isVisible ? 'opacity 0.12s ease-out' : 'none',
                          willChange: 'opacity',
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {word}
                      </span>
                    );
                  })}
                </div>
              )}

              {!loadingVerses && allWords.length === 0 && (
                <div style={{
                  position: 'absolute', top: '50%', left: 0, right: 0,
                  transform: 'translateY(-50%)', textAlign: 'center',
                  fontFamily: '"Tajawal",sans-serif', fontSize: 52, color: 'rgba(200,153,26,0.5)',
                }}>
                  اختر سورة وآية
                </div>
              )}

              {/* Surah tag */}
              {verseTexts.length > 0 && !loadingVerses && (
                <div style={{
                  position: 'absolute', bottom: 200, left: 0, right: 0,
                  display: 'flex', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: '"Tajawal",sans-serif', fontSize: 44, direction: 'rtl',
                    background: 'rgba(0,0,0,0.55)', color: 'rgba(200,153,26,0.92)',
                    border: '2px solid rgba(200,153,26,0.3)', backdropFilter: 'blur(4px)',
                    padding: '12px 40px', borderRadius: 999,
                  }}>
                    ﴿ {currentSurah?.name_arabic} — {ayahRange} ﴾
                  </span>
                </div>
              )}

              {/* Watermark */}
              <div style={{ position: 'absolute', bottom: 80, left: 60, direction: 'ltr', display: 'flex', alignItems: 'center', gap: 20 }}>
                <img src="/logo.png" alt="Noor" style={{ width: 90, height: 90, borderRadius: '50%', opacity: 0.9 }} />
                <div>
                  <div style={{ fontFamily: "'Segoe UI',sans-serif", fontSize: 46, fontWeight: 700, color: '#C8991A', textShadow: '0 1px 8px rgba(0,0,0,1)' }}>Noor App</div>
                  <div style={{ fontFamily: '"Tajawal",sans-serif', fontSize: 32, color: 'rgba(200,153,26,0.70)' }}>تطبيق نور الإسلامي</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-2.5 pb-2 space-y-2">

        {/* Upload */}
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl p-2.5 flex items-center gap-3 text-right"
          style={{ background: bgFile ? 'rgba(74,222,128,0.07)' : 'rgba(200,153,26,0.07)', border: `1px solid ${bgFile ? 'rgba(74,222,128,0.3)' : 'rgba(200,153,26,0.25)'}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bgFile ? 'rgba(74,222,128,0.15)' : 'rgba(200,153,26,0.15)' }}>
            <Upload size={17} style={{ color: bgFile ? '#4ade80' : '#C8991A' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ fontFamily: '"Tajawal",sans-serif', color: bgFile ? '#4ade80' : '#E8C060' }}>
              {bgFile ? bgFile.name : 'رفع صورة أو فيديو خلفية'}
            </p>
            <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: '#6B7A60' }}>
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
                className="w-full bg-transparent font-bold text-xs outline-none truncate"
                style={{ fontFamily: '"Tajawal",sans-serif', color: '#E8C060', direction: 'rtl' }}>
                {surahs.map(s => <option key={s.id} value={s.id} style={{ background: '#0d1b0a', color: '#E8C060' }}>{s.id}. {s.name_arabic}</option>)}
              </select>
            )},
            { label: 'من آية', content: (
              <select value={fromAyah} onChange={e => setFromAyah(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm outline-none"
                style={{ fontFamily: '"Tajawal",sans-serif', color: '#E8C060', direction: 'rtl' }}>
                {Array.from({ length: maxAyah }, (_, i) => i + 1).map(n => <option key={n} value={n} style={{ background: '#0d1b0a', color: '#E8C060' }}>{n}</option>)}
              </select>
            )},
            { label: 'إلى آية', content: (
              <select value={toAyah} onChange={e => setToAyah(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm outline-none"
                style={{ fontFamily: '"Tajawal",sans-serif', color: '#E8C060', direction: 'rtl' }}>
                {Array.from({ length: maxAyah - fromAyah + 1 }, (_, i) => fromAyah + i).map(n => <option key={n} value={n} style={{ background: '#0d1b0a', color: '#E8C060' }}>{n}</option>)}
              </select>
            )},
          ].map(({ label, content }) => (
            <div key={label} className="rounded-2xl p-2.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal",sans-serif', color: '#6B7A60' }}>{label}</p>
              {content}
            </div>
          ))}
        </div>

        {/* Reciter */}
        <div className="rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: '#6B7A60' }}>القارئ</p>
            {loadingAudio && <Loader2 size={12} className="animate-spin" style={{ color: '#C8991A' }} />}
          </div>
          <select value={selectedRec} onChange={e => setSelectedRec(Number(e.target.value))}
            className="w-full bg-transparent font-bold text-sm outline-none"
            style={{ fontFamily: '"Tajawal",sans-serif', color: '#E8C060', direction: 'rtl' }}
            disabled={recitations.length === 0}>
            {recitations.length === 0
              ? <option>جارٍ التحميل...</option>
              : recitations.map(r => <option key={r.id} value={r.id} style={{ background: '#0d1b0a', color: '#E8C060' }}>{r.name}</option>)
            }
          </select>
        </div>

        {/* Font picker */}
        <div className="rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: '#6B7A60' }}>نوع الخط</p>
            <Type size={13} style={{ color: '#C8991A' }} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FONT_OPTIONS.map(f => (
              <button key={f.id} onClick={() => setFont(f.id as FontId)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  fontFamily: f.cssFamily,
                  background: selectedFont === f.id ? 'rgba(200,153,26,0.22)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${selectedFont === f.id ? 'rgba(200,153,26,0.7)' : 'rgba(255,255,255,0.1)'}`,
                  color: selectedFont === f.id ? '#E8C060' : '#9CA3AF',
                  fontSize: 13,
                }}
                data-testid={`button-font-${f.id}`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Color */}
        <div className="rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-xs mb-1.5" style={{ fontFamily: '"Tajawal",sans-serif', color: '#6B7A60' }}>لون الخط</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setFontColor(c)} style={{
                width: 27, height: 27, borderRadius: '50%', background: c, flexShrink: 0,
                border: fontColor === c ? '3px solid #C8991A' : '2px solid rgba(255,255,255,0.18)',
                transform: fontColor === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s',
              }} />
            ))}
            <label style={{
              width: 27, height: 27, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
              <Palette style={{ width: 13, height: 13, color: '#9CA3AF', position: 'relative', zIndex: 1 }} />
              <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            </label>
          </div>
        </div>

        {/* Font Size Slider */}
        <div className="rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ fontFamily: '"Tajawal",sans-serif', color: '#6B7A60' }}>حجم الخط</p>
            <span className="text-xs font-bold" style={{ color: '#C8991A', fontFamily: '"Tajawal",sans-serif' }}>
              {Math.round(fontScale * 100)}٪
            </span>
          </div>
          <input
            type="range" min={0.6} max={2.0} step={0.05}
            value={fontScale}
            onChange={e => setFontScale(parseFloat(e.target.value))}
            data-testid="slider-font-scale"
            style={{
              width: '100%', accentColor: '#C8991A', cursor: 'pointer',
              height: 4, borderRadius: 2, outline: 'none', appearance: 'none',
              background: `linear-gradient(to right, #C8991A ${((fontScale - 0.6) / 1.4) * 100}%, rgba(255,255,255,0.15) ${((fontScale - 0.6) / 1.4) * 100}%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: '#4B5563', fontFamily: '"Tajawal",sans-serif' }}>A</span>
            <span className="text-sm font-bold" style={{ color: '#4B5563', fontFamily: '"Tajawal",sans-serif' }}>A</span>
          </div>
        </div>

        {/* Error */}
        {recordError && (
          <div className="rounded-2xl p-2.5 text-center text-xs"
            style={{ fontFamily: '"Tajawal",sans-serif', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {recordError}
          </div>
        )}

        {/* Download button after generation */}
        {completedVid && (
          <button onClick={() => triggerDownload(completedVid.blob, completedVid.filename)}
            className="w-full rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-sm"
            style={{
              fontFamily: '"Tajawal",sans-serif',
              background: 'linear-gradient(135deg,rgba(74,222,128,0.18),rgba(34,197,94,0.10))',
              border: '1.5px solid rgba(74,222,128,0.55)', color: '#4ade80',
            }}
            data-testid="button-download-video">
            <Download size={16} /> اضغط هنا لتنزيل الفيديو
          </button>
        )}
      </div>

      {/* Action Bar */}
      <div className="relative z-10 flex-shrink-0 px-4 py-3 flex gap-2 border-t"
        style={{ borderColor: 'rgba(200,153,26,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>

        <button onClick={togglePreview}
          disabled={audioLoading || loadingVerses || verseTexts.length === 0 || isRecording}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm flex-shrink-0 transition-all"
          style={{
            fontFamily: '"Tajawal",sans-serif',
            background: isPlaying ? 'rgba(74,222,128,0.12)' : 'rgba(200,153,26,0.12)',
            border: `1px solid ${isPlaying ? 'rgba(74,222,128,0.4)' : 'rgba(200,153,26,0.35)'}`,
            color: isPlaying ? '#4ade80' : '#C8991A', minWidth: 90,
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
              ? 'linear-gradient(135deg,rgba(74,222,128,0.18),rgba(34,197,94,0.10))'
              : 'linear-gradient(135deg,rgba(200,153,26,0.25),rgba(139,94,60,0.15))',
            border: `1px solid ${completedVid ? 'rgba(74,222,128,0.45)' : 'rgba(200,153,26,0.5)'}`,
            color: completedVid ? '#4ade80' : '#E8C060',
            opacity: (loadingVerses || verseTexts.length === 0) ? 0.4 : 1,
          }}
          data-testid="button-generate-video">
          {isRecording
            ? <><Loader2 size={15} className="animate-spin" /> {recordPct > 0 ? `${recordPct}%` : 'جارٍ الإنشاء...'}</>
            : completedVid ? <><Check size={15} /> تم الإنشاء</>
            : <><Film size={15} /> إنشاء فيديو</>}
        </button>
      </div>
    </div>
  );
}
