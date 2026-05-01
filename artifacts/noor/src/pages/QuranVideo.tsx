import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Download, Upload, Image as ImageIcon, Video, Check, RefreshCw, ChevronDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Surah names ──────────────────────────────────────── */
const SURAHS = [
  { n: 1, ar: 'الفاتحة', en: 'Al-Fatihah', ayahs: 7 },
  { n: 2, ar: 'البقرة', en: 'Al-Baqarah', ayahs: 286 },
  { n: 3, ar: 'آل عمران', en: "Ali 'Imran", ayahs: 200 },
  { n: 4, ar: 'النساء', en: "An-Nisa'", ayahs: 176 },
  { n: 5, ar: 'المائدة', en: 'Al-Ma\'idah', ayahs: 120 },
  { n: 6, ar: 'الأنعام', en: "Al-An'am", ayahs: 165 },
  { n: 7, ar: 'الأعراف', en: "Al-A'raf", ayahs: 206 },
  { n: 8, ar: 'الأنفال', en: 'Al-Anfal', ayahs: 75 },
  { n: 9, ar: 'التوبة', en: 'At-Tawbah', ayahs: 129 },
  { n: 10, ar: 'يونس', en: 'Yunus', ayahs: 109 },
  { n: 11, ar: 'هود', en: 'Hud', ayahs: 123 },
  { n: 12, ar: 'يوسف', en: 'Yusuf', ayahs: 111 },
  { n: 13, ar: 'الرعد', en: "Ar-Ra'd", ayahs: 43 },
  { n: 14, ar: 'إبراهيم', en: 'Ibrahim', ayahs: 52 },
  { n: 15, ar: 'الحجر', en: 'Al-Hijr', ayahs: 99 },
  { n: 16, ar: 'النحل', en: 'An-Nahl', ayahs: 128 },
  { n: 17, ar: 'الإسراء', en: "Al-Isra'", ayahs: 111 },
  { n: 18, ar: 'الكهف', en: 'Al-Kahf', ayahs: 110 },
  { n: 19, ar: 'مريم', en: 'Maryam', ayahs: 98 },
  { n: 20, ar: 'طه', en: 'Ta-Ha', ayahs: 135 },
  { n: 21, ar: 'الأنبياء', en: "Al-Anbya'", ayahs: 112 },
  { n: 22, ar: 'الحج', en: 'Al-Hajj', ayahs: 78 },
  { n: 23, ar: 'المؤمنون', en: "Al-Mu'minun", ayahs: 118 },
  { n: 24, ar: 'النور', en: 'An-Nur', ayahs: 64 },
  { n: 25, ar: 'الفرقان', en: 'Al-Furqan', ayahs: 77 },
  { n: 26, ar: 'الشعراء', en: "Ash-Shu'ara'", ayahs: 227 },
  { n: 27, ar: 'النمل', en: 'An-Naml', ayahs: 93 },
  { n: 28, ar: 'القصص', en: 'Al-Qasas', ayahs: 88 },
  { n: 29, ar: 'العنكبوت', en: "Al-'Ankabut", ayahs: 69 },
  { n: 30, ar: 'الروم', en: 'Ar-Rum', ayahs: 60 },
  { n: 31, ar: 'لقمان', en: 'Luqman', ayahs: 34 },
  { n: 32, ar: 'السجدة', en: 'As-Sajdah', ayahs: 30 },
  { n: 33, ar: 'الأحزاب', en: 'Al-Ahzab', ayahs: 73 },
  { n: 34, ar: 'سبأ', en: "Saba'", ayahs: 54 },
  { n: 35, ar: 'فاطر', en: 'Fatir', ayahs: 45 },
  { n: 36, ar: 'يس', en: 'Ya-Sin', ayahs: 83 },
  { n: 37, ar: 'الصافات', en: 'As-Saffat', ayahs: 182 },
  { n: 38, ar: 'ص', en: 'Sad', ayahs: 88 },
  { n: 39, ar: 'الزمر', en: 'Az-Zumar', ayahs: 75 },
  { n: 40, ar: 'غافر', en: 'Ghafir', ayahs: 85 },
  { n: 41, ar: 'فصلت', en: 'Fussilat', ayahs: 54 },
  { n: 42, ar: 'الشورى', en: 'Ash-Shura', ayahs: 53 },
  { n: 43, ar: 'الزخرف', en: 'Az-Zukhruf', ayahs: 89 },
  { n: 44, ar: 'الدخان', en: 'Ad-Dukhan', ayahs: 59 },
  { n: 45, ar: 'الجاثية', en: 'Al-Jathiyah', ayahs: 37 },
  { n: 46, ar: 'الأحقاف', en: 'Al-Ahqaf', ayahs: 35 },
  { n: 47, ar: 'محمد', en: 'Muhammad', ayahs: 38 },
  { n: 48, ar: 'الفتح', en: 'Al-Fath', ayahs: 29 },
  { n: 49, ar: 'الحجرات', en: 'Al-Hujurat', ayahs: 18 },
  { n: 50, ar: 'ق', en: 'Qaf', ayahs: 45 },
  { n: 51, ar: 'الذاريات', en: 'Adh-Dhariyat', ayahs: 60 },
  { n: 52, ar: 'الطور', en: 'At-Tur', ayahs: 49 },
  { n: 53, ar: 'النجم', en: 'An-Najm', ayahs: 62 },
  { n: 54, ar: 'القمر', en: 'Al-Qamar', ayahs: 55 },
  { n: 55, ar: 'الرحمن', en: 'Ar-Rahman', ayahs: 78 },
  { n: 56, ar: 'الواقعة', en: "Al-Waqi'ah", ayahs: 96 },
  { n: 57, ar: 'الحديد', en: 'Al-Hadid', ayahs: 29 },
  { n: 58, ar: 'المجادلة', en: 'Al-Mujadila', ayahs: 22 },
  { n: 59, ar: 'الحشر', en: 'Al-Hashr', ayahs: 24 },
  { n: 60, ar: 'الممتحنة', en: 'Al-Mumtahanah', ayahs: 13 },
  { n: 61, ar: 'الصف', en: 'As-Saf', ayahs: 14 },
  { n: 62, ar: 'الجمعة', en: "Al-Jumu'ah", ayahs: 11 },
  { n: 63, ar: 'المنافقون', en: 'Al-Munafiqun', ayahs: 11 },
  { n: 64, ar: 'التغابن', en: 'At-Taghabun', ayahs: 18 },
  { n: 65, ar: 'الطلاق', en: 'At-Talaq', ayahs: 12 },
  { n: 66, ar: 'التحريم', en: 'At-Tahrim', ayahs: 12 },
  { n: 67, ar: 'الملك', en: 'Al-Mulk', ayahs: 30 },
  { n: 68, ar: 'القلم', en: 'Al-Qalam', ayahs: 52 },
  { n: 69, ar: 'الحاقة', en: "Al-Haqqah", ayahs: 52 },
  { n: 70, ar: 'المعارج', en: "Al-Ma'arij", ayahs: 44 },
  { n: 71, ar: 'نوح', en: 'Nuh', ayahs: 28 },
  { n: 72, ar: 'الجن', en: 'Al-Jinn', ayahs: 28 },
  { n: 73, ar: 'المزمل', en: 'Al-Muzzammil', ayahs: 20 },
  { n: 74, ar: 'المدثر', en: 'Al-Muddaththir', ayahs: 56 },
  { n: 75, ar: 'القيامة', en: 'Al-Qiyamah', ayahs: 40 },
  { n: 76, ar: 'الإنسان', en: 'Al-Insan', ayahs: 31 },
  { n: 77, ar: 'المرسلات', en: 'Al-Mursalat', ayahs: 50 },
  { n: 78, ar: 'النبأ', en: "An-Naba'", ayahs: 40 },
  { n: 79, ar: 'النازعات', en: "An-Nazi'at", ayahs: 46 },
  { n: 80, ar: 'عبس', en: "'Abasa", ayahs: 42 },
  { n: 81, ar: 'التكوير', en: 'At-Takwir', ayahs: 29 },
  { n: 82, ar: 'الانفطار', en: 'Al-Infitar', ayahs: 19 },
  { n: 83, ar: 'المطففين', en: 'Al-Mutaffifin', ayahs: 36 },
  { n: 84, ar: 'الانشقاق', en: 'Al-Inshiqaq', ayahs: 25 },
  { n: 85, ar: 'البروج', en: 'Al-Buruj', ayahs: 22 },
  { n: 86, ar: 'الطارق', en: 'At-Tariq', ayahs: 17 },
  { n: 87, ar: 'الأعلى', en: "Al-A'la", ayahs: 19 },
  { n: 88, ar: 'الغاشية', en: 'Al-Ghashiyah', ayahs: 26 },
  { n: 89, ar: 'الفجر', en: 'Al-Fajr', ayahs: 30 },
  { n: 90, ar: 'البلد', en: 'Al-Balad', ayahs: 20 },
  { n: 91, ar: 'الشمس', en: 'Ash-Shams', ayahs: 15 },
  { n: 92, ar: 'الليل', en: 'Al-Layl', ayahs: 21 },
  { n: 93, ar: 'الضحى', en: 'Ad-Duha', ayahs: 11 },
  { n: 94, ar: 'الشرح', en: 'Ash-Sharh', ayahs: 8 },
  { n: 95, ar: 'التين', en: 'At-Tin', ayahs: 8 },
  { n: 96, ar: 'العلق', en: "Al-'Alaq", ayahs: 19 },
  { n: 97, ar: 'القدر', en: 'Al-Qadr', ayahs: 5 },
  { n: 98, ar: 'البينة', en: 'Al-Bayyinah', ayahs: 8 },
  { n: 99, ar: 'الزلزلة', en: 'Az-Zalzalah', ayahs: 8 },
  { n: 100, ar: 'العاديات', en: "Al-'Adiyat", ayahs: 11 },
  { n: 101, ar: 'القارعة', en: "Al-Qari'ah", ayahs: 11 },
  { n: 102, ar: 'التكاثر', en: 'At-Takathur', ayahs: 8 },
  { n: 103, ar: 'العصر', en: "Al-'Asr", ayahs: 3 },
  { n: 104, ar: 'الهمزة', en: 'Al-Humazah', ayahs: 9 },
  { n: 105, ar: 'الفيل', en: 'Al-Fil', ayahs: 5 },
  { n: 106, ar: 'قريش', en: 'Quraysh', ayahs: 4 },
  { n: 107, ar: 'الماعون', en: "Al-Ma'un", ayahs: 7 },
  { n: 108, ar: 'الكوثر', en: 'Al-Kawthar', ayahs: 3 },
  { n: 109, ar: 'الكافرون', en: 'Al-Kafirun', ayahs: 6 },
  { n: 110, ar: 'النصر', en: 'An-Nasr', ayahs: 3 },
  { n: 111, ar: 'المسد', en: 'Al-Masad', ayahs: 5 },
  { n: 112, ar: 'الإخلاص', en: 'Al-Ikhlas', ayahs: 4 },
  { n: 113, ar: 'الفلق', en: 'Al-Falaq', ayahs: 5 },
  { n: 114, ar: 'الناس', en: 'An-Nas', ayahs: 6 },
];

/* ── Background configs ───────────────────────────────── */
type BgType = 'gradient' | 'image' | 'video';
interface BgConfig {
  id: number;
  label: string;
  type: BgType;
  src?: string;
  gradient: string;
  gradientCanvas: string[];
  overlay: string;
  thumb: string;
}

const BACKGROUNDS: BgConfig[] = [
  {
    id: 1, label: 'سماء النجوم', type: 'gradient',
    gradient: 'radial-gradient(ellipse at 20% 30%, #1a0533 0%, #0a0118 40%, #050010 100%)',
    gradientCanvas: ['#050010', '#1a0533', '#0a0118'],
    overlay: 'rgba(0,0,0,0.35)',
    thumb: 'linear-gradient(145deg,#1a0533,#050010)',
  },
  {
    id: 2, label: 'الفجر الذهبي', type: 'gradient',
    gradient: 'linear-gradient(160deg, #0d1b2a 0%, #1b3a5c 40%, #8B6340 75%, #C19A6B 100%)',
    gradientCanvas: ['#0d1b2a', '#1b3a5c', '#8B6340'],
    overlay: 'rgba(0,0,0,0.25)',
    thumb: 'linear-gradient(160deg,#0d1b2a,#8B6340,#C19A6B)',
  },
  {
    id: 3, label: 'خضرة الجنة', type: 'gradient',
    gradient: 'linear-gradient(160deg, #0b1c12 0%, #1b4332 50%, #2d6a4f 100%)',
    gradientCanvas: ['#0b1c12', '#1b4332', '#2d6a4f'],
    overlay: 'rgba(0,0,0,0.3)',
    thumb: 'linear-gradient(160deg,#0b1c12,#2d6a4f)',
  },
  {
    id: 4, label: 'البحر العميق', type: 'gradient',
    gradient: 'linear-gradient(160deg, #020c1b 0%, #0f2d4d 50%, #1b4d7a 100%)',
    gradientCanvas: ['#020c1b', '#0f2d4d', '#1b4d7a'],
    overlay: 'rgba(0,0,0,0.28)',
    thumb: 'linear-gradient(160deg,#020c1b,#1b4d7a)',
  },
  {
    id: 5, label: 'الذهب الملكي', type: 'gradient',
    gradient: 'linear-gradient(145deg, #1a0e00 0%, #3d2008 40%, #8B6340 80%, #C8A96E 100%)',
    gradientCanvas: ['#1a0e00', '#3d2008', '#8B6340'],
    overlay: 'rgba(0,0,0,0.2)',
    thumb: 'linear-gradient(145deg,#1a0e00,#C8A96E)',
  },
  {
    id: 6, label: 'الليل البنفسجي', type: 'gradient',
    gradient: 'linear-gradient(160deg, #0d0621 0%, #2a1060 50%, #4a1fa3 100%)',
    gradientCanvas: ['#0d0621', '#2a1060', '#4a1fa3'],
    overlay: 'rgba(0,0,0,0.35)',
    thumb: 'linear-gradient(160deg,#0d0621,#4a1fa3)',
  },
  {
    id: 7, label: 'الصحراء الهادئة', type: 'gradient',
    gradient: 'linear-gradient(160deg, #2c1810 0%, #5c3a1e 40%, #8B6340 75%, #C19A6B 100%)',
    gradientCanvas: ['#2c1810', '#5c3a1e', '#8B6340'],
    overlay: 'rgba(0,0,0,0.22)',
    thumb: 'linear-gradient(160deg,#2c1810,#C19A6B)',
  },
  {
    id: 8, label: 'الفضاء الكوني', type: 'gradient',
    gradient: 'radial-gradient(ellipse at center, #0a1628 0%, #020510 60%, #000208 100%)',
    gradientCanvas: ['#000208', '#0a1628', '#020510'],
    overlay: 'rgba(0,0,0,0.25)',
    thumb: 'radial-gradient(#0a1628,#000208)',
  },
  {
    id: 9, label: 'شفق المغرب', type: 'gradient',
    gradient: 'linear-gradient(180deg, #0a0010 0%, #3d0a2a 30%, #8B2252 60%, #C19A6B 100%)',
    gradientCanvas: ['#0a0010', '#3d0a2a', '#8B2252'],
    overlay: 'rgba(0,0,0,0.3)',
    thumb: 'linear-gradient(180deg,#0a0010,#8B2252,#C19A6B)',
  },
  {
    id: 10, label: 'النور الأبيض', type: 'gradient',
    gradient: 'linear-gradient(160deg, #f5f0e8 0%, #e8d5b0 50%, #d4aa7d 100%)',
    gradientCanvas: ['#f5f0e8', '#e8d5b0', '#d4aa7d'],
    overlay: 'rgba(0,0,0,0.08)',
    thumb: 'linear-gradient(160deg,#f5f0e8,#d4aa7d)',
  },
  {
    id: 11, label: 'المسجد الأخضر', type: 'gradient',
    gradient: 'linear-gradient(145deg, #04200d 0%, #0b3d1e 40%, #145228 75%, #1b6b35 100%)',
    gradientCanvas: ['#04200d', '#0b3d1e', '#145228'],
    overlay: 'rgba(0,0,0,0.28)',
    thumb: 'linear-gradient(145deg,#04200d,#1b6b35)',
  },
  {
    id: 12, label: 'المطر الفضي', type: 'gradient',
    gradient: 'linear-gradient(160deg, #0a1520 0%, #1a2f45 40%, #2d4a6b 75%, #3d6085 100%)',
    gradientCanvas: ['#0a1520', '#1a2f45', '#2d4a6b'],
    overlay: 'rgba(0,0,0,0.3)',
    thumb: 'linear-gradient(160deg,#0a1520,#3d6085)',
  },
  {
    id: 13, label: 'التراب الطيب', type: 'gradient',
    gradient: 'linear-gradient(145deg, #1e1208 0%, #3d2810 40%, #6b4a20 75%, #8B6340 100%)',
    gradientCanvas: ['#1e1208', '#3d2810', '#6b4a20'],
    overlay: 'rgba(0,0,0,0.22)',
    thumb: 'linear-gradient(145deg,#1e1208,#8B6340)',
  },
  {
    id: 14, label: 'الليل النجومي', type: 'gradient',
    gradient: 'radial-gradient(ellipse at top, #1a2040 0%, #0c1030 40%, #050818 100%)',
    gradientCanvas: ['#050818', '#0c1030', '#1a2040'],
    overlay: 'rgba(0,0,0,0.3)',
    thumb: 'radial-gradient(ellipse at top,#1a2040,#050818)',
  },
  {
    id: 15, label: 'الفجر الوردي', type: 'gradient',
    gradient: 'linear-gradient(160deg, #0f0515 0%, #2a0a30 30%, #6b2060 60%, #C19A6B 100%)',
    gradientCanvas: ['#0f0515', '#2a0a30', '#6b2060'],
    overlay: 'rgba(0,0,0,0.25)',
    thumb: 'linear-gradient(160deg,#0f0515,#6b2060,#C19A6B)',
  },
];

/* ── Star particle helpers ────────────────────────────── */
function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.7 + 0.3,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 2,
  }));
}

const STARS = generateStars(80);

/* ── Noor watermark SVG path ──────────────────────────── */
function NoorWatermark({ light = false }: { light?: boolean }) {
  const textColor = light ? '#5c3e1e' : '#C19A6B';
  return (
    <div className="flex items-center gap-1.5">
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="18" fill={light ? '#C19A6B' : '#C19A6B'} opacity="0.95"/>
        <text x="50" y="38" textAnchor="middle" fontFamily="Amiri, serif" fontSize="28" fill="white" fontWeight="bold">نور</text>
        <circle cx="50" cy="62" r="10" fill="none" stroke="white" strokeWidth="3"/>
        <path d="M42 62 Q50 52 58 62" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M46 72 Q50 66 54 72" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
      <span style={{ color: textColor, fontFamily: 'Tajawal, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>
        Noor app
      </span>
    </div>
  );
}

/* ── Animated background ──────────────────────────────── */
function AnimatedBg({ bg, uploadedMedia }: { bg: BgConfig; uploadedMedia: { url: string; type: 'video' | 'image' } | null }) {
  const isStarry = bg.id === 1 || bg.id === 8 || bg.id === 14;

  if (uploadedMedia) {
    if (uploadedMedia.type === 'video') {
      return (
        <video
          src={uploadedMedia.url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay loop muted playsInline
        />
      );
    }
    return (
      <img
        src={uploadedMedia.url}
        className="absolute inset-0 w-full h-full object-cover"
        alt="custom background"
      />
    );
  }

  return (
    <>
      <div className="absolute inset-0 transition-all duration-700" style={{ background: bg.gradient }} />
      {isStarry && (
        <div className="absolute inset-0 overflow-hidden">
          {STARS.map(s => (
            <div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
                animation: `starTwinkle ${s.duration}s ${s.delay}s infinite alternate ease-in-out`,
              }}
            />
          ))}
        </div>
      )}
      {bg.id === 5 || bg.id === 7 || bg.id === 13 ? (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(193,154,107,0.3) 40px, rgba(193,154,107,0.3) 41px)`,
          }} />
        </div>
      ) : null}
      {bg.id === 10 ? (
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C19A6B' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      ) : null}
    </>
  );
}

/* ── Inline CSS for animations ────────────────────────── */
const ANIM_STYLE = `
  @keyframes starTwinkle { from { opacity: 0.2; transform: scale(0.8); } to { opacity: 1; transform: scale(1.2); } }
  @keyframes shimmerSlide { from { background-position: -200% center; } to { background-position: 200% center; } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes goldPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(193,154,107,0.4); } 50% { box-shadow: 0 0 0 8px rgba(193,154,107,0); } }
`;

/* ── Canvas download ──────────────────────────────────── */
async function downloadAsImage(
  verses: { t: string; a: number }[],
  surahName: string,
  bg: BgConfig,
  uploadedMedia: { url: string; type: string } | null,
  videoRef: HTMLVideoElement | null,
) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  await document.fonts.ready;

  if (uploadedMedia?.type === 'video' && videoRef) {
    ctx.drawImage(videoRef, 0, 0, W, H);
  } else if (uploadedMedia?.type === 'image') {
    await new Promise<void>(res => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { ctx.drawImage(img, 0, 0, W, H); res(); };
      img.onerror = () => res();
      img.src = uploadedMedia.url;
    });
  } else {
    const [c1, c2, c3] = bg.gradientCanvas;
    const grd = ctx.createLinearGradient(0, 0, W * 0.5, H);
    grd.addColorStop(0, c1);
    grd.addColorStop(0.5, c2);
    grd.addColorStop(1, c3);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    const isStarry = bg.id === 1 || bg.id === 8 || bg.id === 14;
    if (isStarry) {
      ctx.fillStyle = 'white';
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * W, y = Math.random() * H;
        const r = Math.random() * 2 + 0.5;
        ctx.globalAlpha = Math.random() * 0.7 + 0.2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.fillStyle = bg.id === 10 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.38)';
  ctx.fillRect(0, 0, W, H);

  const isLight = bg.id === 10;
  const textColor = isLight ? '#2c1a08' : '#FFFFFF';
  const accentColor = '#C19A6B';
  const pad = 80;

  ctx.textAlign = 'center';
  ctx.direction = 'rtl';

  ctx.font = `bold 36px "Tajawal", "Arial", sans-serif`;
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.9;
  ctx.fillText(`سورة ${surahName}`, W / 2, 140);
  ctx.globalAlpha = 1;

  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.4;
  ctx.fillRect(W / 2 - 120, 160, 240, 1.5);
  ctx.globalAlpha = 1;

  const arabicText = verses.map(v => v.t).join('  ');
  const fontSize = arabicText.length < 80 ? 62 : arabicText.length < 160 ? 50 : 42;
  ctx.font = `${fontSize}px "Scheherazade New", "Amiri", "Arial", serif`;
  ctx.fillStyle = textColor;

  const maxW = W - pad * 2;
  const words = arabicText.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur); cur = word;
    } else cur = test;
  }
  if (cur) lines.push(cur);

  const lineH = fontSize * 1.55;
  const totalH = lines.length * lineH;
  let y = (H - totalH) / 2 + fontSize * 0.4;

  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += lineH;
  }

  ctx.font = `bold 30px "Tajawal", "Arial", sans-serif`;
  ctx.fillStyle = accentColor;
  ctx.globalAlpha = 0.8;
  const refs = verses.map((v, i) => i === 0 || i === verses.length - 1 ? `(${v.a})` : null).filter(Boolean).join('...');
  ctx.fillText(refs, W / 2, H - 260);
  ctx.globalAlpha = 1;

  const logoX = W - 220, logoY = H - 130;
  const logoW = 56, logoH = 56;
  const logoRadius = 12;
  ctx.fillStyle = '#C19A6B';
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, logoW, logoH, logoRadius);
  ctx.fill();
  ctx.font = `bold 22px "Amiri", serif`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.direction = 'rtl';
  ctx.fillText('نور', logoX + logoW / 2, logoY + logoH * 0.5);
  ctx.font = `bold 28px "Tajawal", "Arial", sans-serif`;
  ctx.fillStyle = '#C19A6B';
  ctx.textAlign = 'left';
  ctx.fillText('Noor app', logoX + logoW + 14, logoY + logoH * 0.62);

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `noor-quran-${surahName}-${Date.now()}.png`;
  a.click();
}

/* ── Native Select ────────────────────────────────────── */
function NativeSelect({
  value, onChange, children, dark, label,
}: {
  value: number;
  onChange: (v: number) => void;
  children: React.ReactNode;
  dark: boolean;
  label: string;
}) {
  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-primary mb-1.5 mr-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full appearance-none text-sm font-medium rounded-xl px-3 py-2.5 pr-8 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
          style={{
            background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
            color: dark ? '#f5f0e8' : '#2c1a08',
          }}
          dir="rtl"
        >
          {children}
        </select>
        <ChevronDown size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export function QuranVideo() {
  const [, setLocation] = useLocation();
  const [dark] = useUserSetting<boolean>('dark', false);

  const [selectedSurah, setSelectedSurah] = useState(1);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(7);
  const [bgIndex, setBgIndex] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: 'video' | 'image' } | null>(null);
  const [verses, setVerses] = useState<{ t: string; a: number }[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [loadingVerses, setLoadingVerses] = useState(true);
  const [allData, setAllData] = useState<{ s: number; a: number; t: string }[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const bg = BACKGROUNDS[bgIndex];
  const surah = SURAHS[selectedSurah - 1];
  const isLight = bg.id === 10 && !uploadedMedia;

  useEffect(() => {
    setLoadingVerses(true);
    fetch('/data/quran-search.json')
      .then(r => r.json())
      .then((data: { s: number; a: number; t: string }[]) => {
        setAllData(data);
        setLoadingVerses(false);
      })
      .catch(() => setLoadingVerses(false));
  }, []);

  useEffect(() => {
    if (!allData.length) return;
    const filtered = allData
      .filter(v => v.s === selectedSurah && v.a >= fromAyah && v.a <= toAyah)
      .map(v => ({ t: v.t, a: v.a }));
    setVerses(filtered);
  }, [allData, selectedSurah, fromAyah, toAyah]);

  const handleSurahChange = useCallback((n: number) => {
    setSelectedSurah(n);
    setFromAyah(1);
    setToAyah(Math.min(7, SURAHS[n - 1].ayahs));
  }, []);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setUploadedMedia({ url, type });
    setBgIndex(0);
  }, []);

  const handleClearUpload = useCallback(() => {
    if (uploadedMedia?.url) URL.revokeObjectURL(uploadedMedia.url);
    setUploadedMedia(null);
    if (uploadRef.current) uploadRef.current.value = '';
  }, [uploadedMedia]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await downloadAsImage(verses, surah.ar, bg, uploadedMedia, videoRef.current);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } finally {
      setDownloading(false);
    }
  }, [verses, surah, bg, uploadedMedia]);

  const textColor = isLight ? '#2c1a08' : '#FFFFFF';
  const accentColor = '#C19A6B';

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: dark ? 'hsl(20 18% 8%)' : 'hsl(51 71% 97%)' }}
      dir="rtl"
    >
      <style>{ANIM_STYLE}</style>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 sticky top-0 z-30"
        style={{ background: dark ? 'rgba(22,18,15,0.92)' : 'rgba(253,251,240,0.92)', backdropFilter: 'blur(12px)' }}>
        <button
          onClick={() => setLocation('/more')}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-primary/20 bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <ChevronLeft size={20} className="text-primary" style={{ transform: 'scaleX(-1)' }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base" style={{ color: dark ? '#f5f0e8' : '#2c1a08' }}>إنشاء فيديو قرآني</h1>
          <p className="text-xs text-primary opacity-80">اختر الآيات والخلفية وحمّل الصورة</p>
        </div>
        <div className="opacity-70">
          <NoorWatermark light={!dark} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-5">

        {/* ── Preview frame ── */}
        <div className="flex justify-center pt-2">
          <div
            ref={previewRef}
            className="relative overflow-hidden rounded-3xl shadow-2xl"
            style={{
              width: '100%',
              maxWidth: 340,
              aspectRatio: '9/16',
              border: `2px solid rgba(193,154,107,0.3)`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(193,154,107,0.15)',
            }}
          >
            <AnimatedBg bg={bg} uploadedMedia={uploadedMedia} />

            {uploadedMedia?.type === 'video' && (
              <video
                ref={videoRef}
                src={uploadedMedia.url}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay loop muted playsInline
                style={{ display: 'none' }}
              />
            )}

            <div className="absolute inset-0" style={{ background: bg.overlay }} />

            <div className="absolute inset-0 flex flex-col items-center justify-between p-5">
              <div className="text-center w-full" style={{ animation: 'fadeInUp 0.6s ease' }}>
                <div className="inline-flex items-center gap-2 mb-1">
                  <div className="h-px w-8 rounded" style={{ background: accentColor, opacity: 0.6 }} />
                  <span className="text-xs font-semibold" style={{ color: accentColor, fontFamily: 'Tajawal, sans-serif' }}>
                    سورة {surah.ar}
                  </span>
                  <div className="h-px w-8 rounded" style={{ background: accentColor, opacity: 0.6 }} />
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center w-full px-2">
                {loadingVerses ? (
                  <div className="flex items-center gap-2" style={{ color: accentColor }}>
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm font-medium" style={{ fontFamily: 'Tajawal' }}>جارٍ التحميل…</span>
                  </div>
                ) : verses.length === 0 ? (
                  <p className="text-center text-sm opacity-60" style={{ color: textColor, fontFamily: 'Tajawal' }}>
                    لم تُوجد آيات
                  </p>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${selectedSurah}-${fromAyah}-${toAyah}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                      className="text-center leading-relaxed w-full"
                      style={{
                        color: textColor,
                        fontFamily: '"Scheherazade New", "Amiri", serif',
                        fontSize: verses.length <= 2 ? 20 : verses.length <= 5 ? 16 : 13,
                        lineHeight: 1.9,
                        textShadow: isLight ? 'none' : '0 1px 8px rgba(0,0,0,0.6)',
                        direction: 'rtl',
                      }}
                    >
                      {verses.map((v, i) => (
                        <span key={i}>
                          {v.t}
                          <span style={{ color: accentColor, fontSize: '0.75em' }}> ﴿{v.a}﴾ </span>
                        </span>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>

              <div className="w-full flex items-end justify-between">
                <span
                  className="text-xs opacity-60"
                  style={{ color: isLight ? '#5c3e1e' : '#C19A6B', fontFamily: 'Tajawal', fontSize: 10 }}
                >
                  {surah.en} ({selectedSurah}:{fromAyah}{fromAyah !== toAyah ? `–${toAyah}` : ''})
                </span>
                <NoorWatermark light={isLight} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Ayah selector ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(193,154,107,0.08)',
            borderColor: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)',
          }}
        >
          <h3 className="text-sm font-bold mb-3" style={{ color: dark ? '#f5f0e8' : '#2c1a08' }}>اختيار الآيات</h3>
          <div className="grid grid-cols-3 gap-2.5">
            <NativeSelect value={selectedSurah} onChange={handleSurahChange} dark={dark} label="السورة">
              {SURAHS.map(s => (
                <option key={s.n} value={s.n}>{s.n}. {s.ar}</option>
              ))}
            </NativeSelect>
            <NativeSelect value={fromAyah} onChange={v => { setFromAyah(v); if (v > toAyah) setToAyah(v); }} dark={dark} label="من آية">
              {Array.from({ length: surah.ayahs }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </NativeSelect>
            <NativeSelect
              value={toAyah}
              onChange={v => setToAyah(v)}
              dark={dark}
              label="إلى آية"
            >
              {Array.from({ length: surah.ayahs }, (_, i) => i + 1)
                .filter(n => n >= fromAyah && n <= fromAyah + 9)
                .map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
            </NativeSelect>
          </div>
          <p className="text-xs mt-2 opacity-50" style={{ color: dark ? '#f5f0e8' : '#2c1a08' }}>
            الحد الأقصى 10 آيات • عدد الآيات المحددة: {Math.min(toAyah - fromAyah + 1, 10)}
          </p>
        </div>

        {/* ── Background grid ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(193,154,107,0.08)',
            borderColor: dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: dark ? '#f5f0e8' : '#2c1a08' }}>الخلفيات</h3>
            <span className="text-xs text-primary opacity-70">{BACKGROUNDS.length} خلفية متحركة</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {BACKGROUNDS.map((b, i) => (
              <button
                key={b.id}
                onClick={() => { setBgIndex(i); setUploadedMedia(prev => { if (prev?.url) URL.revokeObjectURL(prev.url); return null; }); }}
                className="relative rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  aspectRatio: '9/16',
                  background: b.thumb,
                  outline: bgIndex === i && !uploadedMedia ? `2.5px solid #C19A6B` : '2.5px solid transparent',
                  transform: bgIndex === i && !uploadedMedia ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: bgIndex === i && !uploadedMedia ? '0 4px 16px rgba(193,154,107,0.4)' : 'none',
                }}
                title={b.label}
              >
                {bgIndex === i && !uploadedMedia && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check size={9} color="white" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-0.5">
                  <p className="text-center leading-none" style={{ fontSize: 6, color: 'rgba(255,255,255,0.8)', fontFamily: 'Tajawal' }}>
                    {b.label}
                  </p>
                </div>
              </button>
            ))}

            {/* Upload slot */}
            <button
              onClick={() => uploadRef.current?.click()}
              className="relative rounded-xl overflow-hidden flex flex-col items-center justify-center gap-1 transition-all duration-200 border"
              style={{
                aspectRatio: '9/16',
                background: uploadedMedia
                  ? uploadedMedia.type === 'image' ? `url(${uploadedMedia.url}) center/cover` : 'rgba(193,154,107,0.2)'
                  : dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: uploadedMedia ? '#C19A6B' : dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                outline: uploadedMedia ? '2.5px solid #C19A6B' : '2.5px solid transparent',
                transform: uploadedMedia ? 'scale(1.06)' : 'scale(1)',
              }}
            >
              {uploadedMedia ? (
                <>
                  <div className="absolute inset-0 bg-black/30 rounded-xl" />
                  <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-primary">
                    <Check size={9} color="white" />
                  </div>
                  <p style={{ fontSize: 6, color: 'white', fontFamily: 'Tajawal', position: 'relative' }}>
                    {uploadedMedia.type === 'video' ? 'فيديو' : 'صورة'}
                  </p>
                </>
              ) : (
                <>
                  <Upload size={10} className="text-primary" />
                  <p style={{ fontSize: 6, color: dark ? '#f5f0e8' : '#2c1a08', fontFamily: 'Tajawal', opacity: 0.7 }}>رفع</p>
                </>
              )}
            </button>
          </div>
          <input
            ref={uploadRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleUpload}
          />
          {uploadedMedia && (
            <button
              onClick={handleClearUpload}
              className="mt-2 text-xs text-primary underline opacity-70 hover:opacity-100 transition-opacity"
              style={{ fontFamily: 'Tajawal' }}
            >
              إزالة الوسائط المرفوعة
            </button>
          )}

          <p className="text-xs mt-3 opacity-50 leading-relaxed" style={{ color: dark ? '#f5f0e8' : '#2c1a08', fontFamily: 'Tajawal' }}>
            يمكنك رفع صورة أو فيديو من جهازك كخلفية مخصصة
          </p>
        </div>

        {/* ── Download ── */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleDownload}
          disabled={downloading || verses.length === 0}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all duration-300 disabled:opacity-50"
          style={{
            background: downloaded
              ? 'linear-gradient(135deg,#1b7a3a,#2d6a4f)'
              : 'linear-gradient(135deg,#C19A6B,#8B6340)',
            color: 'white',
            boxShadow: downloaded
              ? '0 8px 30px rgba(43,180,100,0.3)'
              : '0 8px 30px rgba(193,154,107,0.35)',
            animation: !downloading && !downloaded ? 'goldPulse 2.5s infinite' : 'none',
          }}
        >
          {downloading ? (
            <><RefreshCw size={18} className="animate-spin" /> <span style={{ fontFamily: 'Tajawal' }}>جارٍ الإنشاء…</span></>
          ) : downloaded ? (
            <><Check size={18} /> <span style={{ fontFamily: 'Tajawal' }}>تم التنزيل ✓</span></>
          ) : (
            <><Download size={18} /> <span style={{ fontFamily: 'Tajawal' }}>تنزيل الصورة</span></>
          )}
        </motion.button>

        {/* ── Info card ── */}
        <div
          className="rounded-2xl p-4 border text-sm leading-relaxed"
          style={{
            background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
            borderColor: 'rgba(193,154,107,0.2)',
            color: dark ? 'rgba(245,240,232,0.7)' : 'rgba(44,26,8,0.65)',
            fontFamily: 'Tajawal',
          }}
        >
          <div className="flex items-start gap-2">
            <ImageIcon size={15} className="text-primary mt-0.5 flex-shrink-0" />
            <p>يعمل هذا القسم بالكامل داخل جهازك، بدون خوادم أو اتصال إنترنت للآيات. الصورة المنزّلة تحتوي على شعار Noor app كعلامة مائية.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
