import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Upload, Play, Pause, Video, Palette, Check, Film,
} from 'lucide-react';
import { Link } from 'wouter';

/* ── Reciters ──────────────────────────────────────────────────────── */
const RECITERS = [
  { id: 'Alafasy_128kbps',                name: 'مشاري العفاسي' },
  { id: 'Abdul_Basit_Murattal_192kbps',   name: 'عبد الباسط عبد الصمد' },
  { id: 'Husary_128kbps',                 name: 'محمود خليل الحصري' },
  { id: 'Ghamadi_40kbps',                 name: 'سعد الغامدي' },
  { id: 'Minshawi_Murattal_128kbps',      name: 'محمد صديق المنشاوي' },
  { id: 'Mohammad_al_Tablawi_128kbps',    name: 'محمد الطبلاوي' },
  { id: 'Maher_AlMuaiqly_128kbps',        name: 'ماهر المعيقلي' },
  { id: 'Yasser_Ad-Dossari_128kbps',      name: 'ياسر الدوسري' },
  { id: 'Nasser_Alqatami_128kbps',        name: 'ناصر القطامي' },
  { id: 'Hani_Rifai_192kbps',             name: 'هاني الرفاعي' },
  { id: 'Saood_ash-Shuraym_128kbps',      name: 'سعود الشريم' },
  { id: 'Ahmed_ibn_Ali_al-Ajmy_128kbps',  name: 'أحمد بن علي العجمي' },
  { id: 'Abdullah_Basfar_192kbps',        name: 'عبد الله بصفر' },
  { id: 'Muhammad_Jibreel_128kbps',       name: 'محمد جبريل' },
  { id: 'Ibrahim_walk_128kbps',           name: 'إبراهيم الأخضر' },
  { id: 'AbdulSamad_128kbps',             name: 'عبد الباسط (مجود)' },
  { id: 'Khaalid_Abdullaah_al-Qahtaanee_192kbps', name: 'خالد القحطاني' },
  { id: 'Ayman_Soweid_192kbps',           name: 'أيمن سويد' },
];

/* ── Preset font colors ────────────────────────────────────────────── */
const PRESET_COLORS = [
  '#FFFFFF', '#FFF8E7', '#FFD700', '#C8991A',
  '#86efac', '#93c5fd', '#fca5a5', '#e9d5ff',
];

/* ── Build proxied audio URL ────────────────────────────────────────── */
function audioUrlFor(reciter: string, surah: number, ayah: number): string {
  const direct = `https://everyayah.com/data/${reciter}/${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return `/api/audio-proxy?url=${encodeURIComponent(direct)}`;
}

/* ── Load font into canvas ──────────────────────────────────────────── */
async function loadFontForCanvas(name: string, url: string): Promise<void> {
  try {
    if ([...document.fonts].some(f => f.family === name && f.status === 'loaded')) return;
    const f = new FontFace(name, `url(${url})`);
    const loaded = await f.load();
    document.fonts.add(loaded);
  } catch { /* fall back to system serif */ }
}

/* ── RTL text wrap ──────────────────────────────────────────────────── */
function wrapTextRTL(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else { current = test; }
  }
  if (current) lines.push(current);
  return lines;
}

type Surah = { id: number; name_arabic: string; verses_count: number };
type VerseItem = { ayah: number; text: string };

/* ════════════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════════════ */
export function QuranStatus() {
  /* ── Background ── */
  const [bgFile, setBgFile]         = useState<File | null>(null);
  const [bgObjectUrl, setBgObjUrl]  = useState<string | null>(null);
  const [bgType, setBgType]         = useState<'image' | 'video'>('image');
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const videoRef                    = useRef<HTMLVideoElement>(null);

  /* ── Quran selection ── */
  const [surahs, setSurahs]         = useState<Surah[]>([]);
  const [selectedSurah, setSurah]   = useState(1);
  const [fromAyah, setFromAyah]     = useState(1);
  const [toAyah, setToAyah]         = useState(1);
  const [verses, setVerses]         = useState<VerseItem[]>([]);
  const [loadingVerses, setLoadingV] = useState(false);

  /* ── Audio / Preview ── */
  const [selectedReciter, setReciter] = useState('Alafasy_128kbps');
  const [isPlaying, setIsPlaying]     = useState(false);
  const [audioLoading, setAudioLoad]  = useState(false);
  const [visibleWordCount, setVisWC]  = useState<number | null>(null);
  const previewStopRef                = useRef<(() => void) | null>(null);

  /* ── Appearance ── */
  const [fontColor, setFontColor] = useState('#FFFFFF');

  /* ── Video recording ── */
  const [isRecording, setIsRecording]   = useState(false);
  const [recordingPct, setRecordingPct] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [recordError, setRecordError]   = useState('');

  /* ──────────────────────────── Fetch surah list ── */
  useEffect(() => {
    fetch('https://api.quran.com/api/v4/chapters?language=ar')
      .then(r => r.json())
      .then(d => setSurahs(d.chapters ?? []))
      .catch(() => {});
  }, []);

  const maxAyah = surahs.find(s => s.id === selectedSurah)?.verses_count ?? 286;

  /* ── Clamp range on surah change ── */
  useEffect(() => {
    setFromAyah(1);
    setToAyah(1);
  }, [selectedSurah]);

  /* ── Ensure toAyah >= fromAyah ── */
  useEffect(() => {
    if (toAyah < fromAyah) setToAyah(fromAyah);
  }, [fromAyah, toAyah]);

  /* ──────────────────────────── Fetch verses ── */
  useEffect(() => {
    if (fromAyah > toAyah) return;
    setLoadingV(true);
    setVerses([]);
    const ctrl = new AbortController();
    const ayahs = Array.from({ length: toAyah - fromAyah + 1 }, (_, i) => fromAyah + i);
    Promise.all(
      ayahs.map(a =>
        fetch(
          `https://api.quran.com/api/v4/verses/by_key/${selectedSurah}:${a}?fields=text_uthmani`,
          { signal: ctrl.signal },
        )
          .then(r => r.json())
          .then(d => ({ ayah: a, text: (d.verse?.text_uthmani ?? '') as string }))
          .catch(() => ({ ayah: a, text: '' })),
      ),
    )
      .then(results => {
        setVerses(results.filter(v => v.text));
        setLoadingV(false);
      })
      .catch(e => { if (e.name !== 'AbortError') setLoadingV(false); });
    return () => ctrl.abort();
  }, [selectedSurah, fromAyah, toAyah]);

  /* ── Reset preview on selection change ── */
  useEffect(() => {
    previewStopRef.current?.();
    previewStopRef.current = null;
    setIsPlaying(false);
    setVisWC(null);
  }, [selectedSurah, fromAyah, toAyah, selectedReciter]);

  /* ──────────────────────────── Background upload ── */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    const url = URL.createObjectURL(file);
    setBgFile(file);
    setBgObjUrl(url);
    setBgType(file.type.startsWith('video') ? 'video' : 'image');
  }, [bgObjectUrl]);

  /* ──────────────────────────── Preview play ── */
  const togglePreviewPlay = useCallback(async () => {
    if (isPlaying) {
      previewStopRef.current?.();
      return;
    }
    if (verses.length === 0) return;

    setAudioLoad(true);
    setIsPlaying(true);
    setVisWC(0);

    const allWords = verses.map(v => v.text).join(' ').split(' ').filter(Boolean);
    let stopped = false;

    const stop = () => {
      stopped = true;
      setIsPlaying(false);
      setVisWC(null);
      setAudioLoad(false);
    };
    previewStopRef.current = stop;

    let wordOffset = 0;
    for (const v of verses) {
      if (stopped) break;
      const url = audioUrlFor(selectedReciter, selectedSurah, v.ayah);
      const vWords = v.text.split(' ').filter(Boolean);
      const capturedOffset = wordOffset;

      await new Promise<void>(outerResolve => {
        let done = false;
        const killTimer = setTimeout(() => { if (!done) { done = true; outerResolve(); } }, 60_000);
        const resolve = () => { if (!done) { done = true; clearTimeout(killTimer); outerResolve(); } };

        const audio = new Audio(url);
        audio.oncanplaythrough = () => {
          if (stopped) { resolve(); return; }
          setAudioLoad(false);
          const dur = audio.duration || 5;
          const msPerWord = (dur * 1000) / vWords.length;
          let idx = 0;
          const tick = setInterval(() => {
            if (stopped) { clearInterval(tick); resolve(); return; }
            idx = Math.min(idx + 1, vWords.length);
            setVisWC(capturedOffset + idx);
            if (idx >= vWords.length) { clearInterval(tick); }
          }, msPerWord);
          audio.play().catch(() => { clearInterval(tick); resolve(); });
          audio.onended = () => { clearInterval(tick); resolve(); };
          audio.onerror = () => { clearInterval(tick); resolve(); };
        };
        audio.onerror = () => { setAudioLoad(false); resolve(); };
        audio.load();
      });

      wordOffset += vWords.length;
    }
    if (!stopped) stop();
  }, [isPlaying, verses, selectedReciter, selectedSurah]);

  /* ──────────────────────────── Video generation ── */
  const generateVideo = useCallback(async () => {
    if (verses.length === 0) return;
    setIsRecording(true);
    setRecordingPct(0);
    setRecordError('');

    try {
      /* ── Load font ── */
      await loadFontForCanvas(
        '_AmiriQS',
        'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74NL.woff2',
      );
      await document.fonts.ready;
      const amiri = '_AmiriQS, Amiri, "Traditional Arabic", serif';

      /* ── Fetch & decode all audio ── */
      const audioCtx = new AudioContext();
      const buffers: AudioBuffer[] = [];
      for (let i = 0; i < verses.length; i++) {
        setRecordingPct(Math.round((i / verses.length) * 20));
        const url = audioUrlFor(selectedReciter, selectedSurah, verses[i].ayah);
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Audio fetch failed: ${resp.status}`);
        const ab = await resp.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(ab);
        buffers.push(decoded);
      }

      const totalDuration = buffers.reduce((s, b) => s + b.duration, 0);
      setRecordingPct(25);

      /* ── Build word timeline ── */
      type WordEntry = { word: string; startMs: number; endMs: number };
      const timeline: WordEntry[] = [];
      let timeOffset = 0;
      for (let vi = 0; vi < verses.length; vi++) {
        const buf = buffers[vi];
        const words = verses[vi].text.split(' ').filter(Boolean);
        const msPerWord = (buf.duration * 1000) / words.length;
        words.forEach((word, wi) => {
          timeline.push({
            word,
            startMs: timeOffset + wi * msPerWord,
            endMs: timeOffset + (wi + 1) * msPerWord,
          });
        });
        timeOffset += buf.duration * 1000;
      }

      /* ── Setup canvas ── */
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx2d = canvas.getContext('2d')!;

      /* Load background image once if image type */
      let bgImg: HTMLImageElement | null = null;
      if (bgObjectUrl && bgType === 'image') {
        bgImg = new Image();
        bgImg.src = bgObjectUrl;
        await new Promise<void>((res, rej) => {
          bgImg!.onload = () => res();
          bgImg!.onerror = rej;
        });
      }

      /* Load logo */
      let logoImg: HTMLImageElement | null = null;
      try {
        const l = new Image();
        l.crossOrigin = 'anonymous';
        l.src = `${window.location.origin}/logo.png`;
        await new Promise<void>(res => { l.onload = () => res(); l.onerror = () => res(); });
        if (l.complete && l.naturalWidth > 0) logoImg = l;
      } catch { /* optional */ }

      const surahName = surahs.find(s => s.id === selectedSurah)?.name_arabic ?? '';
      const ayahRange = fromAyah === toAyah ? `آية ${fromAyah}` : `الآيات ${fromAyah}–${toAyah}`;

      const drawFrame = (visibleWords: number) => {
        /* Background */
        if (bgImg) {
          const scale = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight);
          const dx = (W - bgImg.naturalWidth * scale) / 2;
          const dy = (H - bgImg.naturalHeight * scale) / 2;
          ctx2d.drawImage(bgImg, dx, dy, bgImg.naturalWidth * scale, bgImg.naturalHeight * scale);
        } else if (bgObjectUrl && bgType === 'video' && videoRef.current) {
          const v = videoRef.current;
          const scale = Math.max(W / v.videoWidth, H / v.videoHeight);
          const dx = (W - v.videoWidth * scale) / 2;
          const dy = (H - v.videoHeight * scale) / 2;
          ctx2d.drawImage(v, dx, dy, v.videoWidth * scale, v.videoHeight * scale);
        } else {
          const grad = ctx2d.createLinearGradient(0, 0, W, H);
          grad.addColorStop(0, '#0d1b0a');
          grad.addColorStop(1, '#060e04');
          ctx2d.fillStyle = grad;
          ctx2d.fillRect(0, 0, W, H);
          ctx2d.fillStyle = 'rgba(200,153,26,0.05)';
          for (let xi = 0; xi < W; xi += 80)
            for (let yi = 0; yi < H; yi += 80) {
              ctx2d.beginPath(); ctx2d.arc(xi, yi, 3, 0, Math.PI * 2); ctx2d.fill();
            }
        }

        /* Dark overlay */
        const ov = ctx2d.createLinearGradient(0, 0, 0, H);
        ov.addColorStop(0, 'rgba(0,0,0,0.30)');
        ov.addColorStop(0.45, 'rgba(0,0,0,0.55)');
        ov.addColorStop(1, 'rgba(0,0,0,0.78)');
        ctx2d.fillStyle = ov;
        ctx2d.fillRect(0, 0, W, H);

        /* Top line */
        ctx2d.strokeStyle = 'rgba(200,153,26,0.65)';
        ctx2d.lineWidth = 4;
        ctx2d.beginPath(); ctx2d.moveTo(140, 290); ctx2d.lineTo(940, 290); ctx2d.stroke();

        /* Basmala */
        ctx2d.font = `60px ${amiri}`;
        ctx2d.fillStyle = 'rgba(200,153,26,0.90)';
        ctx2d.textAlign = 'center';
        ctx2d.direction = 'rtl';
        ctx2d.fillText('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', W / 2, 260);

        /* Verse text — visible words only */
        const visibleText = timeline.slice(0, visibleWords).map(t => t.word).join(' ');
        const allText = timeline.map(t => t.word).join(' ');
        const charCount = allText.length;
        const fontSize = Math.max(50, Math.min(84, Math.round(5000 / Math.sqrt(charCount + 1))));
        const lineHeight = Math.round(fontSize * 1.8);

        ctx2d.font = `bold ${fontSize}px ${amiri}`;
        ctx2d.fillStyle = fontColor;
        ctx2d.direction = 'rtl';
        ctx2d.textAlign = 'center';

        const lines = wrapTextRTL(ctx2d, visibleText || ' ', W * 0.82);
        const textH = lines.length * lineHeight;
        let ty = H / 2 - textH / 2 + 80;
        for (const line of lines) { ctx2d.fillText(line, W / 2, ty); ty += lineHeight; }

        /* Surah reference */
        ctx2d.font = `46px ${amiri}`;
        ctx2d.fillStyle = 'rgba(200,153,26,0.85)';
        ctx2d.direction = 'rtl';
        ctx2d.textAlign = 'center';
        ctx2d.fillText(`﴿ ${surahName} — ${ayahRange} ﴾`, W / 2, ty + 60);

        /* Logo watermark */
        if (logoImg) {
          ctx2d.globalAlpha = 0.88;
          ctx2d.drawImage(logoImg, 60, H - 210, 104, 104);
          ctx2d.globalAlpha = 1;
        }
        /* Noor App text — golden */
        ctx2d.direction = 'ltr';
        ctx2d.textAlign = 'left';
        ctx2d.font = `bold 54px 'Segoe UI', sans-serif`;
        ctx2d.fillStyle = '#C8991A';
        ctx2d.fillText('Noor App', 182, H - 145);
        ctx2d.font = `36px 'Tajawal', sans-serif`;
        ctx2d.fillStyle = 'rgba(200,153,26,0.70)';
        ctx2d.fillText('تطبيق نور الإسلامي', 182, H - 100);
      };

      /* ── Setup audio for recording ── */
      const dest = audioCtx.createMediaStreamDestination();

      /* ── Setup MediaRecorder ── */
      const videoStream = canvas.captureStream(30);
      const combined = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.start(100);
      setRecordingPct(30);

      /* ── Schedule audio buffers ── */
      let scheduleTime = audioCtx.currentTime + 0.1;
      for (const buf of buffers) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(dest);
        src.connect(audioCtx.destination);
        src.start(scheduleTime);
        scheduleTime += buf.duration;
      }

      /* ── Animate canvas ── */
      const startTime = audioCtx.currentTime + 0.1;
      const totalMs = totalDuration * 1000;

      await new Promise<void>(resolve => {
        let animFrame: number;
        const loop = () => {
          const elapsed = (audioCtx.currentTime - startTime) * 1000;
          const pct = Math.min(elapsed / totalMs, 1);
          setRecordingPct(30 + Math.round(pct * 60));

          const visCount = timeline.filter(t => t.startMs <= elapsed).length;
          drawFrame(visCount);

          if (elapsed < totalMs + 800) {
            animFrame = requestAnimationFrame(loop);
          } else {
            resolve();
          }
        };
        animFrame = requestAnimationFrame(loop);
        setTimeout(() => { cancelAnimationFrame(animFrame); resolve(); }, totalMs + 2000);
      });

      recorder.stop();
      await new Promise<void>(r => { recorder.onstop = () => r(); });
      await audioCtx.close();
      setRecordingPct(95);

      /* ── Export ── */
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `noor-ayah.${ext}`, { type: blob.type });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'آية قرآنية – Noor App', text: verses.map(v => v.text).join(' ') });
        setShareSuccess(true);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
        setShareSuccess(true);
      }
      setTimeout(() => setShareSuccess(false), 4000);

    } catch (err: unknown) {
      console.error('[QuranStatus] video error:', err);
      setRecordError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الفيديو');
    } finally {
      setIsRecording(false);
      setRecordingPct(0);
    }
  }, [verses, selectedReciter, selectedSurah, fromAyah, toAyah, surahs, bgObjectUrl, bgType, fontColor]);

  /* ──────────────────────────── Cleanup ── */
  useEffect(() => {
    return () => {
      if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
      previewStopRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ──────────────────────────── Derived ── */
  const currentSurah = surahs.find(s => s.id === selectedSurah);
  const allWords     = verses.map(v => v.text).join(' ').split(' ').filter(Boolean);
  const displayWords = visibleWordCount !== null ? allWords.slice(0, visibleWordCount) : allWords;
  const displayText  = displayWords.join(' ');
  const ayahRange    = fromAyah === toAyah ? `آية ${fromAyah}` : `الآيات ${fromAyah}–${toAyah}`;

  const ayahFontSize = (displayText || allWords.join(' ')).length > 130 ? '11px'
    : (displayText || allWords.join(' ')).length > 80 ? '13px'
    : (displayText || allWords.join(' ')).length > 50 ? '15px'
    : '17px';

  /* ════════════════════════════════════════ Render ── */
  return (
    <div
      className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #0d1b0a 0%, #060e04 100%)' }}
    >
      {/* ── Header ── */}
      <div
        className="relative z-10 px-4 py-3.5 flex items-center gap-3 flex-shrink-0 border-b"
        style={{ background: 'rgba(0,0,0,0.55)', borderColor: 'rgba(200,153,26,0.2)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/more">
          <button className="p-2 rounded-full" style={{ background: 'rgba(200,153,26,0.15)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#C8991A' }} />
          </button>
        </Link>
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C8991A, #8B6340)' }}
          >
            <Film className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
              إنشاء فيديو
            </h1>
            <p className="text-xs leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>
              فيديو قرآني مع صوت القارئ كلمةً بكلمة
            </p>
          </div>
        </div>
      </div>

      {/* ── Preview Panel ── */}
      <div className="relative z-10 flex-shrink-0 mx-4 mt-3">
        <div
          className="w-full rounded-3xl overflow-hidden relative flex items-center justify-center"
          style={{ aspectRatio: '9/16', maxHeight: '40vh', border: '1.5px solid rgba(200,153,26,0.35)' }}
        >
          {/* Background layer */}
          {bgObjectUrl && bgType === 'image' && (
            <img src={bgObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {bgObjectUrl && bgType === 'video' && (
            <video ref={videoRef} src={bgObjectUrl} className="absolute inset-0 w-full h-full object-cover"
              autoPlay loop muted playsInline />
          )}
          {!bgObjectUrl && (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0e1f0b 0%, #142e10 40%, #060e04 100%)' }} />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.52) 50%, rgba(0,0,0,0.75) 100%)' }} />

          {/* Basmala — with margin below */}
          <div className="absolute top-3 inset-x-0 flex flex-col items-center pointer-events-none gap-1.5">
            <span style={{
              fontFamily: '"Amiri", "Traditional Arabic", serif',
              fontSize: '9px',
              color: 'rgba(200,153,26,0.88)',
              direction: 'rtl',
            }}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
            <div style={{ width: 40, height: 1, background: 'rgba(200,153,26,0.3)' }} />
          </div>

          {/* Verse text */}
          <div className="relative z-10 px-4 text-center mt-6">
            {loadingVerses ? (
              <div className="w-7 h-7 rounded-full border-2 animate-spin mx-auto"
                style={{ borderColor: 'rgba(200,153,26,0.25)', borderTopColor: '#C8991A' }} />
            ) : (
              <p style={{
                fontFamily: '"Amiri", "Traditional Arabic", serif',
                fontSize: ayahFontSize,
                color: fontColor,
                direction: 'rtl',
                textShadow: '0 2px 14px rgba(0,0,0,0.95)',
                lineHeight: 2.1,
              }}>
                {displayText || (verses.length === 0 ? 'اختر سورة وآية لعرضها هنا' : '')}
              </p>
            )}
          </div>

          {/* Surah reference */}
          {verses.length > 0 && !loadingVerses && (
            <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full text-center" style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: '8px',
                background: 'rgba(0,0,0,0.55)',
                color: 'rgba(200,153,26,0.92)',
                border: '1px solid rgba(200,153,26,0.3)',
                backdropFilter: 'blur(4px)',
              }}>
                ﴿ {currentSurah?.name_arabic ?? ''} — {ayahRange} ﴾
              </span>
            </div>
          )}

          {/* Watermark */}
          <div className="absolute bottom-1.5 left-2.5 flex items-center gap-1.5 pointer-events-none" style={{ direction: 'ltr' }}>
            <img src="/logo.png" alt="Noor" style={{ width: 20, height: 20, borderRadius: '50%', opacity: 0.9 }} />
            <span style={{
              fontFamily: "'Segoe UI', sans-serif",
              fontSize: '8px',
              fontWeight: 700,
              color: '#C8991A',
              textShadow: '0 1px 6px rgba(0,0,0,1)',
              letterSpacing: '0.04em',
            }}>Noor App</span>
          </div>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-2.5 pb-2 space-y-2">

        {/* Upload Background */}
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl p-3 flex items-center gap-3 text-right"
          style={{
            background: bgFile ? 'rgba(74,222,128,0.07)' : 'rgba(200,153,26,0.07)',
            border: `1px solid ${bgFile ? 'rgba(74,222,128,0.3)' : 'rgba(200,153,26,0.25)'}`,
          }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: bgFile ? 'rgba(74,222,128,0.15)' : 'rgba(200,153,26,0.15)' }}>
            <Upload className="w-4.5 h-4.5" style={{ color: bgFile ? '#4ade80' : '#C8991A' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate" style={{ fontFamily: '"Tajawal", sans-serif', color: bgFile ? '#4ade80' : '#E8C060' }}>
              {bgFile ? bgFile.name : 'رفع صورة أو فيديو خلفية'}
            </p>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>
              {bgFile ? (bgType === 'video' ? 'فيديو خلفية' : 'صورة خلفية') : 'اختر من جهازك (صورة أو فيديو)'}
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        </button>

        {/* Surah, From Ayah, To Ayah */}
        <div className="grid grid-cols-3 gap-2">
          {/* Surah */}
          <div className="col-span-1 rounded-2xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>السورة</p>
            <select value={selectedSurah} onChange={e => setSurah(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-xs outline-none truncate"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}>
              {surahs.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#0d1b0a', color: '#E8C060' }}>
                  {s.id}. {s.name_arabic}
                </option>
              ))}
            </select>
          </div>

          {/* From Ayah */}
          <div className="rounded-2xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>من آية</p>
            <select value={fromAyah} onChange={e => setFromAyah(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-sm outline-none"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}>
              {Array.from({ length: maxAyah }, (_, i) => i + 1).map(n => (
                <option key={n} value={n} style={{ background: '#0d1b0a', color: '#E8C060' }}>{n}</option>
              ))}
            </select>
          </div>

          {/* To Ayah */}
          <div className="rounded-2xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>إلى آية</p>
            <select value={toAyah} onChange={e => setToAyah(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-sm outline-none"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}>
              {Array.from({ length: maxAyah - fromAyah + 1 }, (_, i) => fromAyah + i).map(n => (
                <option key={n} value={n} style={{ background: '#0d1b0a', color: '#E8C060' }}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reciter */}
        <div className="rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-xs mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>القارئ</p>
          <select value={selectedReciter} onChange={e => setReciter(e.target.value)}
            className="w-full bg-transparent font-bold text-sm outline-none"
            style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060', direction: 'rtl' }}>
            {RECITERS.map(r => (
              <option key={r.id} value={r.id} style={{ background: '#0d1b0a', color: '#E8C060' }}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Font Color */}
        <div className="rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-xs mb-1.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B7A60' }}>لون الخط</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setFontColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, flexShrink: 0,
                border: fontColor === c ? '3px solid #C8991A' : '2px solid rgba(255,255,255,0.18)',
                transform: fontColor === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.18s',
              }} />
            ))}
            <label style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}>
              <Palette style={{ width: 14, height: 14, color: '#9CA3AF', position: 'relative', zIndex: 1 }} />
              <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            </label>
          </div>
        </div>

        {/* Error */}
        {recordError && (
          <div className="rounded-2xl p-2.5 text-center text-xs" style={{
            fontFamily: '"Tajawal", sans-serif',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
          }}>
            {recordError}
          </div>
        )}
      </div>

      {/* ── Action Bar ── */}
      <div className="relative z-10 flex-shrink-0 px-4 py-3 flex gap-2 border-t"
        style={{ borderColor: 'rgba(200,153,26,0.15)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>

        {/* Preview Play/Stop */}
        <button
          onClick={togglePreviewPlay}
          disabled={audioLoading || loadingVerses || verses.length === 0 || isRecording}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-sm flex-shrink-0 transition-all"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: isPlaying ? 'rgba(74,222,128,0.12)' : 'rgba(200,153,26,0.12)',
            border: `1px solid ${isPlaying ? 'rgba(74,222,128,0.4)' : 'rgba(200,153,26,0.35)'}`,
            color: isPlaying ? '#4ade80' : '#C8991A',
            minWidth: 90,
          }}
        >
          {audioLoading ? (
            <div className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(200,153,26,0.25)', borderTopColor: '#C8991A' }} />
          ) : isPlaying ? (
            <><Pause className="w-4 h-4" /> إيقاف</>
          ) : (
            <><Play className="w-4 h-4" /> معاينة</>
          )}
        </button>

        {/* Create Video */}
        <button
          onClick={generateVideo}
          disabled={isRecording || loadingVerses || verses.length === 0 || isPlaying}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all"
          style={{
            fontFamily: '"Tajawal", sans-serif',
            background: shareSuccess
              ? 'linear-gradient(135deg, rgba(74,222,128,0.22), rgba(34,197,94,0.12))'
              : isRecording
              ? 'linear-gradient(135deg, rgba(200,153,26,0.2), rgba(139,94,60,0.12))'
              : 'linear-gradient(135deg, rgba(200,153,26,0.25), rgba(139,94,60,0.15))',
            border: `1px solid ${shareSuccess ? 'rgba(74,222,128,0.5)' : 'rgba(200,153,26,0.5)'}`,
            color: shareSuccess ? '#4ade80' : '#E8C060',
            opacity: (loadingVerses || verses.length === 0) ? 0.4 : 1,
          }}
        >
          {isRecording ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(200,153,26,0.3)', borderTopColor: '#C8991A' }} />
              {recordingPct > 0 ? `${recordingPct}%` : 'جار الإنشاء...'}
            </>
          ) : shareSuccess ? (
            <><Check className="w-4 h-4" /> تم التصدير!</>
          ) : (
            <><Video className="w-4 h-4" /> إنشاء فيديو</>
          )}
        </button>
      </div>
    </div>
  );
}
