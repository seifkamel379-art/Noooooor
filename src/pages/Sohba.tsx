import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Wind, Heart, Waves, BookOpen, ScrollText,
  Timer, BookMarked, Eye, Trophy, Users, Lock,
  Sparkles, Star, Globe, UserCheck, RefreshCw, Info, X, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { syncUserLeaderboard, fetchLeaderboard as fetchLeaderboardFromFirestore } from '@/lib/firestore';

/* ─── Types ───────────────────────────────────────────── */
interface Badge {
  id: string;
  name: string;
  pillar: 'remembrance' | 'quran' | 'reflection';
  pillarLabel: string;
  description: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  glowColor: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  tasbeehTotal: number;
  tasbihDailyStreak: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
}

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  governorate?: string | null;
  tasbeehCount: number;
  quranCompletions: number;
  azkarStreak: number;
  tadabburStreak: number;
  noorScore: number;
  earnedBadges: string[];
}

/* ─── Badges Definition ───────────────────────────────── */
const BADGES: Badge[] = [
  {
    id: 'athar_altib',
    name: 'أثر الطّيب',
    pillar: 'remembrance',
    pillarLabel: 'نظام الضياء',
    description: '١٠٠٠ تسبيحة',
    Icon: Wind,
    color: '#8B6B3D',
    glowColor: 'rgba(193,154,107,0.5)',
    check: (s) => s.tasbeehTotal >= 1000,
  },
  {
    id: 'noor_alqalb',
    name: 'نور القلب',
    pillar: 'remembrance',
    pillarLabel: 'نظام الضياء',
    description: '١٠٠٠٠ تسبيحة',
    Icon: Heart,
    color: '#C19A6B',
    glowColor: 'rgba(193,154,107,0.7)',
    check: (s) => s.tasbeehTotal >= 10000,
  },
  {
    id: 'nafs_mutmaina',
    name: 'نفسٌ مطمئنة',
    pillar: 'remembrance',
    pillarLabel: 'نظام الضياء',
    description: '٣٠ يوماً متواصلاً من الذكر',
    Icon: Waves,
    color: '#7a9e7e',
    glowColor: 'rgba(122,158,126,0.5)',
    check: (s) => s.tasbihDailyStreak >= 30,
  },
  {
    id: 'fatih_almusha',
    name: 'فاتحُ المصحف',
    pillar: 'quran',
    pillarLabel: 'نظام الدرّ والياقوت',
    description: 'إتمام أول خمسة أجزاء',
    Icon: BookOpen,
    color: '#8B6B3D',
    glowColor: 'rgba(193,154,107,0.5)',
    check: (s) => s.currentSurah >= 36 || s.quranCompletions >= 1,
  },
  {
    id: 'safeer_alwahy',
    name: 'سفير الوحي',
    pillar: 'quran',
    pillarLabel: 'نظام الدرّ والياقوت',
    description: 'ختمة كاملة للقرآن الكريم',
    Icon: ScrollText,
    color: '#C19A6B',
    glowColor: 'rgba(193,154,107,0.7)',
    check: (s) => s.quranCompletions >= 1,
  },
  {
    id: 'taj_alkhatm',
    name: 'تـاج الختم',
    pillar: 'quran',
    pillarLabel: 'نظام الدرّ والياقوت',
    description: 'ختمات متعددة للقرآن الكريم',
    Icon: Crown,
    color: '#D4AF37',
    glowColor: 'rgba(212,175,55,0.7)',
    check: (s) => s.quranCompletions >= 3,
  },
  {
    id: 'waqfa_taamul',
    name: 'وقفة تأمل',
    pillar: 'reflection',
    pillarLabel: 'نظام أرباب البصيرة',
    description: '٧ أيام متواصلة من الأذكار',
    Icon: Timer,
    color: '#8B6B3D',
    glowColor: 'rgba(193,154,107,0.5)',
    check: (s) => s.azkarStreak >= 7,
  },
  {
    id: 'jalees_alayat',
    name: 'جليسُ الآيات',
    pillar: 'reflection',
    pillarLabel: 'نظام أرباب البصيرة',
    description: '٤٠ يوماً متواصلة من الأذكار',
    Icon: BookMarked,
    color: '#C19A6B',
    glowColor: 'rgba(193,154,107,0.7)',
    check: (s) => s.azkarStreak >= 40,
  },
  {
    id: 'ain_alhikma',
    name: 'عين الحكمة',
    pillar: 'reflection',
    pillarLabel: 'نظام أرباب البصيرة',
    description: '١٠٠ يوم من الثبات والمداومة',
    Icon: Eye,
    color: '#7a6bb5',
    glowColor: 'rgba(122,107,181,0.6)',
    check: (s) => s.tadabburStreak >= 100,
  },
];

/* ─── Helpers ─────────────────────────────────────────── */
function calcAzkarStreak(): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `azkar_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const val = localStorage.getItem(key);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        const allDone = typeof parsed === 'object' && parsed !== null && Object.values(parsed).every(v => v === true);
        if (allDone || val === 'true') { streak++; continue; }
      } catch { /* ignore */ }
    }
    if (i > 0) break;
  }
  return streak;
}

function getUserId(profile: { name: string; governorateId: string }): string {
  return btoa(encodeURIComponent(`${profile.name}-${profile.governorateId}`)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

/* ─── Sub-components ──────────────────────────────────── */
function IslamicDivider() {
  return (
    <div className="flex items-center gap-3 my-5 opacity-40">
      <div className="flex-1 h-px bg-[#C19A6B]" />
      <svg width="18" height="18" viewBox="0 0 40 40" fill="#C19A6B">
        <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" />
      </svg>
      <div className="flex-1 h-px bg-[#C19A6B]" />
    </div>
  );
}

function BadgeCard({ badge, unlocked, completions }: { badge: Badge; unlocked: boolean; completions?: number }) {
  const Icon = badge.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-3xl border transition-all duration-500',
        unlocked
          ? 'border-[#C19A6B]/40 bg-gradient-to-b from-[#FDF8EE] to-[#F5EDD8] dark:from-[#2a1f0e] dark:to-[#1e1508]'
          : 'border-[#C19A6B]/10 bg-[#F5F5DC]/40 dark:bg-[#1a1208]/40'
      )}
      style={unlocked ? { boxShadow: `0 4px 20px ${badge.glowColor}` } : {}}
    >
      {unlocked && (
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-0"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(ellipse at center, ${badge.glowColor}, transparent 70%)` }}
        />
      )}

      <div
        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
        style={unlocked
          ? { background: `linear-gradient(135deg, ${badge.color}22, ${badge.color}44)`, border: `1.5px solid ${badge.color}66` }
          : { background: 'rgba(193,154,107,0.06)', border: '1.5px solid rgba(193,154,107,0.15)' }
        }
      >
        {unlocked
          ? <span style={{ color: badge.color, display: 'flex' }}><Icon size={24} /></span>
          : <Lock size={18} className="text-[#C19A6B]/30" />
        }

        {badge.id === 'taj_alkhatm' && unlocked && completions && completions > 0 && (
          <span
            className="absolute -top-1.5 -left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: badge.color, color: '#fff' }}
          >
            {completions}×
          </span>
        )}
      </div>

      <div className="text-center">
        <p
          className={cn('text-xs font-bold leading-snug', unlocked ? 'text-[#5D4037] dark:text-[#d4b483]' : 'text-[#C19A6B]/40')}
          style={{ fontFamily: '"Tajawal", sans-serif' }}
        >
          {badge.name}
        </p>
        <p
          className={cn('text-[10px] mt-0.5 leading-tight', unlocked ? 'text-[#8B6B3D]/70 dark:text-[#b8945a]/60' : 'text-[#C19A6B]/25')}
          style={{ fontFamily: '"Tajawal", sans-serif' }}
        >
          {badge.description}
        </p>
      </div>

      {unlocked && (
        <div className="absolute top-2 right-2">
          <Sparkles size={10} style={{ color: badge.color }} />
        </div>
      )}
    </motion.div>
  );
}

function PillarSection({ pillar, label, badges, stats, completions }: {
  pillar: string;
  label: string;
  badges: Badge[];
  stats: UserStats;
  completions: number;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Star size={13} className="text-[#C19A6B]" />
        <span
          className="text-sm font-bold text-[#5D4037] dark:text-[#d4b483]"
          style={{ fontFamily: '"Tajawal", sans-serif' }}
        >
          {label}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {badges.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={badge.check(stats)}
            completions={completions}
          />
        ))}
      </div>
    </div>
  );
}

function WelcomeModal({ onJoin, onSkip }: { onJoin: () => void; onSkip: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSkip} />
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FDF8EE 0%, #F0E6C8 100%)' }}
      >
        <div className="absolute inset-0 opacity-5">
          <img src="/images/islamic-pattern.png" className="w-full h-full object-cover" alt="" />
        </div>

        <div className="relative p-7 text-center">
          <div className="flex items-center justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C19A6B22, #C19A6B44)', border: '1.5px solid #C19A6B66' }}
            >
              <Users size={28} style={{ color: '#8B6B3D' }} />
            </div>
          </div>

          <IslamicDivider />

          <p
            className="text-[#5D4037] text-sm leading-relaxed mb-2 font-bold"
            style={{ fontFamily: '"Tajawal", sans-serif', fontSize: '0.95rem' }}
          >
            مرحباً بك في ركب الذاكرين..
          </p>
          <p
            className="text-[#8B6B3D] text-sm leading-loose mb-5"
            style={{ fontFamily: '"Tajawal", sans-serif', fontSize: '0.82rem' }}
          >
            هنا في <strong className="text-[#5D4037]">"الصحبة"</strong>، لا نسعى لمجرد الأرقام، بل لزيادة الضياء في القلوب.
            انضم الآن لتشارك إنجازاتك الإيمانية، وتتوج بـ <strong className="text-[#C19A6B]">"تاج الختم"</strong>، وتكون من أرباب البصيرة.
            <br />
            <br />
            هل أنت مستعد لترك <em>أثر الطيب</em>؟
          </p>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onJoin}
            className="w-full py-4 rounded-2xl font-bold text-white text-sm mb-3"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: 'linear-gradient(135deg, #8B6B3D, #C19A6B)',
              boxShadow: '0 6px 20px rgba(193,154,107,0.4)',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <UserCheck size={16} />
              انضم لركب الذاكرين
            </span>
          </motion.button>

          <button
            onClick={onSkip}
            className="w-full py-2 text-[#8B6B3D]/60 text-xs"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            متابعة بدون انضمام
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LeaderboardRow({ entry, rank, isMe }: { entry: LeaderboardEntry; rank: number; isMe: boolean }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-2xl border transition-all',
        isMe
          ? 'border-[#C19A6B]/50 bg-gradient-to-r from-[#FDF8EE] to-[#F5EDD8] dark:from-[#2a1f0e] dark:to-[#1e1508]'
          : 'border-[#C19A6B]/10 bg-[#F5F5DC]/30 dark:bg-[#1a1208]/30'
      )}
      style={isMe ? { boxShadow: '0 2px 12px rgba(193,154,107,0.25)' } : {}}
    >
      <span className="w-7 text-center text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
        {medals[rank] || <span className="text-[#8B6B3D]/60 text-xs">{rank}</span>}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className={cn('text-sm font-bold truncate', isMe ? 'text-[#5D4037] dark:text-[#d4b483]' : 'text-[#5D4037]/80 dark:text-[#d4b483]/70')}
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            {entry.displayName}
          </p>
          {entry.earnedBadges.includes('taj_alkhatm') && (
            <Crown size={12} className="text-[#D4AF37] shrink-0" />
          )}
        </div>
        {entry.governorate && (
          <p className="text-[10px] text-[#8B6B3D]/50 truncate" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {entry.governorate}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1">
          <Sparkles size={10} className="text-[#C19A6B]" />
          <span
            className="text-xs font-bold text-[#8B6B3D] dark:text-[#c9a96e]"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            {entry.noorScore.toLocaleString('ar-EG')}
          </span>
        </div>
        <div className="flex gap-2 text-[9px] text-[#8B6B3D]/50">
          <span>{entry.tasbeehCount.toLocaleString('ar-EG')} ✦</span>
          {entry.quranCompletions > 0 && <span>{entry.quranCompletions}× ختمة</span>}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Confirm Sync Dialog ─────────────────────────────── */
function ConfirmSyncDialog({
  onConfirm,
  onCancel,
  dark,
  tasbeehTotal,
  quranCompletions,
  azkarStreak,
  tadabburStreak,
  noorScore,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  dark: boolean;
  tasbeehTotal: number;
  quranCompletions: number;
  azkarStreak: number;
  tadabburStreak: number;
  noorScore: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: dark
            ? 'linear-gradient(160deg, #1e1508 0%, #2a1f0e 100%)'
            : 'linear-gradient(160deg, #FDF8EE 0%, #F0E6C8 100%)',
          border: '1px solid rgba(193,154,107,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #C19A6B22, #C19A6B44)', border: '1.5px solid #C19A6B55' }}
              >
                <RefreshCw size={18} style={{ color: '#C19A6B' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#5D4037] dark:text-[#d4b483]" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  تحديث الإحصائيات
                </p>
                <p className="text-[10px] text-[#8B6B3D]/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  هل أنت متأكد من التحديث؟
                </p>
              </div>
            </div>
            <button onClick={onCancel} className="text-[#8B6B3D]/40 hover:text-[#8B6B3D] transition-colors">
              <X size={18} />
            </button>
          </div>

          <div
            className="rounded-2xl p-4 mb-4 space-y-2.5"
            style={{
              background: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.1)',
              border: '1px solid rgba(193,154,107,0.2)',
            }}
          >
            <p className="text-[11px] text-[#8B6B3D]/70 mb-3" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              سيتم إرسال هذه البيانات للترتيب العالمي:
            </p>
            {[
              { label: 'عدد التسبيح', value: tasbeehTotal.toLocaleString('ar-EG'), icon: '🌿' },
              { label: 'ختمات القرآن', value: `${quranCompletions} ختمة`, icon: '📖' },
              { label: 'سلسلة الأذكار', value: `${azkarStreak} يوم`, icon: '🌙' },
              { label: 'سلسلة التدبر', value: `${tadabburStreak} يوم`, icon: '⭐' },
              { label: 'نقاط النور', value: noorScore.toLocaleString('ar-EG'), icon: '✨', highlight: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-[#8B6B3D]/70" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {item.icon} {item.label}
                </span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    item.highlight ? 'text-[#C19A6B]' : 'text-[#5D4037] dark:text-[#d4b483]'
                  )}
                  style={{ fontFamily: '"Tajawal", sans-serif' }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-[#8B6B3D] transition-colors"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: dark ? 'rgba(193,154,107,0.08)' : 'rgba(193,154,107,0.1)',
                border: '1px solid rgba(193,154,107,0.2)',
              }}
            >
              إلغاء
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: 'linear-gradient(135deg, #8B6B3D, #C19A6B)',
                boxShadow: '0 4px 15px rgba(193,154,107,0.4)',
              }}
            >
              <CheckCircle2 size={15} />
              تأكيد التحديث
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Scoring Info Modal ──────────────────────────────── */
function ScoringInfoModal({ onClose, dark }: { onClose: () => void; dark: boolean }) {
  const rules = [
    {
      icon: '🌿',
      title: 'التسبيح',
      formula: 'كل ١٠٠ تسبيحة = ٥٠ نقطة',
      detail: 'يُحتسب نصف نقطة لكل تسبيحة من مجموع جميع أنواع الذكر',
      color: '#8B6B3D',
    },
    {
      icon: '📖',
      title: 'ختمة القرآن',
      formula: 'كل ختمة = ١٠٠٠ نقطة',
      detail: 'عند إتمام تلاوة القرآن الكريم من الفاتحة للناس',
      color: '#C19A6B',
    },
    {
      icon: '🌙',
      title: 'سلسلة الأذكار',
      formula: 'كل يوم متواصل = ٥٠ نقطة',
      detail: 'يُحتسب كل يوم تُتِم فيه أذكار الصباح أو المساء',
      color: '#7a9e7e',
    },
    {
      icon: '⭐',
      title: 'التدبر اليومي',
      formula: 'كل يوم تلاوة = ٢٠ نقطة',
      detail: 'يُحتسب كل يوم تفتح فيه المصحف وتقرأ سورة',
      color: '#7a6bb5',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      dir="rtl"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: dark
            ? 'linear-gradient(160deg, #1e1508 0%, #2a1f0e 100%)'
            : 'linear-gradient(160deg, #FDF8EE 0%, #F0E6C8 100%)',
          border: '1px solid rgba(193,154,107,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles size={18} style={{ color: '#C19A6B' }} />
              <h3 className="text-base font-bold text-[#5D4037] dark:text-[#d4b483]" style={{ fontFamily: '"Amiri", serif' }}>
                كيف تُحتسب نقاط النور؟
              </h3>
            </div>
            <button onClick={onClose} className="text-[#8B6B3D]/40 hover:text-[#8B6B3D] transition-colors">
              <X size={18} />
            </button>
          </div>

          <p className="text-[11px] text-[#8B6B3D]/60 mb-4" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            نقاط النور تعكس مجموع عملك الإيماني من ذكر وتلاوة ومداومة
          </p>

          <IslamicDivider />

          <div className="space-y-3 mt-4">
            {rules.map(rule => (
              <div
                key={rule.title}
                className="flex items-start gap-3 p-3 rounded-2xl"
                style={{
                  background: dark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)',
                  border: '1px solid rgba(193,154,107,0.15)',
                }}
              >
                <span className="text-xl mt-0.5 shrink-0">{rule.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: rule.color }}>
                      {rule.title}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${rule.color}22`,
                        color: rule.color,
                        fontFamily: '"Tajawal", sans-serif',
                      }}
                    >
                      {rule.formula}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8B6B3D]/60 leading-relaxed" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    {rule.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-4 p-3 rounded-2xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(193,154,107,0.15), rgba(193,154,107,0.08))',
              border: '1px solid rgba(193,154,107,0.3)',
            }}
          >
            <p className="text-[10px] text-[#8B6B3D]/70" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              المعادلة الإجمالية
            </p>
            <p className="text-xs font-bold text-[#5D4037] dark:text-[#d4b483] mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              نقاطك = (تسبيح × ٠.٥) + (ختمات × ١٠٠٠) + (أذكار × ٥٠) + (تدبر × ٢٠)
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Page ───────────────────────────────────────── */
export function Sohba() {
  const [profile] = useLocalStorage<{ name: string; governorateId: string; governorateName?: string } | null>('user_profile', null);
  const [tasbeehTotals] = useLocalStorage<Record<string, number>>('tasbih_totals', {});
  const tasbeehTotal = Object.values(tasbeehTotals).reduce((a, b) => a + b, 0);
  const [quranCompletions] = useLocalStorage<number>('quran_completions', 0);
  const [currentSurah] = useLocalStorage<number>('quran_current_surah_idx', 1);
  const [tadabburStreak] = useLocalStorage<number>('tadabbur_streak', 0);
  const [tasbihDailyStreak] = useLocalStorage<number>('tasbih_daily_streak', 0);
  const [theme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const [welcomeSeen, setWelcomeSeen] = useLocalStorage<boolean>('sohba_welcome_seen', false);
  const [isPublic, setIsPublic] = useLocalStorage<boolean>('sohba_is_public', false);

  const [showWelcome, setShowWelcome] = useState(false);
  const [showConfirmSync, setShowConfirmSync] = useState(false);
  const [showScoringInfo, setShowScoringInfo] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLb, setLoadingLb] = useState(false);
  const [activeTab, setActiveTab] = useState<'badges' | 'leaderboard'>('badges');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');

  const azkarStreak = calcAzkarStreak();

  const stats: UserStats = {
    tasbeehTotal,
    tasbihDailyStreak,
    quranCompletions,
    currentSurah,
    azkarStreak,
    tadabburStreak,
  };

  const earnedBadges = BADGES.filter(b => b.check(stats)).map(b => b.id);
  const totalUnlocked = earnedBadges.length;

  const userId = profile ? getUserId(profile) : null;

  useEffect(() => {
    if (welcomeSeen) return undefined;
    const t = setTimeout(() => setShowWelcome(true), 400);
    return () => clearTimeout(t);
  }, [welcomeSeen]);

  const syncToLeaderboard = useCallback(async (pub: boolean) => {
    if (!profile || !userId) return;
    setSyncStatus('syncing');
    try {
      await syncUserLeaderboard({
        userId,
        displayName: profile.name,
        governorate: profile.governorateName || null,
        isPublic: pub,
        tasbeehCount: tasbeehTotal,
        quranCompletions,
        currentSurah,
        azkarStreak,
        tadabburStreak,
        earnedBadges,
      });
      setSyncStatus('done');
    } catch {
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 2500);
  }, [profile, userId, tasbeehTotal, quranCompletions, currentSurah, azkarStreak, tadabburStreak, earnedBadges]);

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    try {
      const list = await fetchLeaderboardFromFirestore();
      setLeaderboard(list);
    } catch {
      setLeaderboard([]);
    } finally {
      setLoadingLb(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
  }, [activeTab, fetchLeaderboard]);

  useEffect(() => {
    if (isPublic && userId) {
      syncToLeaderboard(true);
    }
  }, []);

  const handleJoin = () => {
    setIsPublic(true);
    setWelcomeSeen(true);
    setShowWelcome(false);
    syncToLeaderboard(true);
  };

  const handleSkip = () => {
    setWelcomeSeen(true);
    setShowWelcome(false);
  };

  const togglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next);
    await syncToLeaderboard(next);
    if (next && activeTab === 'leaderboard') fetchLeaderboard();
  };

  const noorScore =
    Math.floor(tasbeehTotal * 0.5) +
    quranCompletions * 1000 +
    azkarStreak * 50 +
    tadabburStreak * 20;

  const handleConfirmSync = async () => {
    setShowConfirmSync(false);
    await syncToLeaderboard(isPublic);
    if (activeTab === 'leaderboard') fetchLeaderboard();
  };

  const pillars = [
    { key: 'remembrance' as const, label: 'نظام الضياء — الذكر والتسبيح' },
    { key: 'quran' as const, label: 'نظام الدرّ والياقوت — القرآن الكريم' },
    { key: 'reflection' as const, label: 'نظام أرباب البصيرة — الأذكار والتدبر' },
  ];

  const myRank = leaderboard.findIndex(e => e.userId === userId) + 1;

  return (
    <div
      className="min-h-screen pb-36"
      style={{ background: dark
        ? 'linear-gradient(180deg, #0f0c07 0%, #1a1208 100%)'
        : 'linear-gradient(180deg, #FDFBF0 0%, #F5EDD8 100%)'
      }}
      dir="rtl"
    >
      <AnimatePresence>
        {showWelcome && <WelcomeModal onJoin={handleJoin} onSkip={handleSkip} />}
        {showConfirmSync && (
          <ConfirmSyncDialog
            onConfirm={handleConfirmSync}
            onCancel={() => setShowConfirmSync(false)}
            dark={dark}
            tasbeehTotal={tasbeehTotal}
            quranCompletions={quranCompletions}
            azkarStreak={azkarStreak}
            tadabburStreak={tadabburStreak}
            noorScore={noorScore}
          />
        )}
        {showScoringInfo && (
          <ScoringInfoModal onClose={() => setShowScoringInfo(false)} dark={dark} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 pt-safe"
        style={{
          background: dark
            ? 'linear-gradient(180deg, #0f0c07 85%, rgba(15,12,7,0) 100%)'
            : 'linear-gradient(180deg, #FDFBF0 85%, rgba(253,251,240,0) 100%)',
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
        }}
      >
        <div className="flex items-center justify-between py-3">
          <div>
            <h1
              className="text-xl font-bold text-[#5D4037] dark:text-[#d4b483]"
              style={{ fontFamily: '"Amiri", serif' }}
            >
              الصحبة
            </h1>
            <p
              className="text-[11px] text-[#8B6B3D]/70"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
            >
              ركب الذاكرين • {totalUnlocked}/{BADGES.length} شارات
            </p>
          </div>

          <button
            onClick={togglePublic}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border',
              isPublic
                ? 'border-[#C19A6B]/50 text-[#5D4037]'
                : 'border-[#C19A6B]/20 text-[#8B6B3D]/60'
            )}
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: isPublic
                ? 'linear-gradient(135deg, #C19A6B22, #C19A6B33)'
                : 'rgba(193,154,107,0.06)',
            }}
          >
            <Globe size={13} />
            {isPublic ? 'في الصحبة' : 'انضم'}
          </button>
        </div>

        {/* Score bar */}
        <div
          className="mb-3 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(193,154,107,0.12), rgba(193,154,107,0.08))',
            border: '1px solid rgba(193,154,107,0.25)',
          }}
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#8B6B3D]/60" style={{ fontFamily: '"Tajawal", sans-serif' }}>نقاط النور</span>
                <button
                  onClick={() => setShowScoringInfo(true)}
                  className="text-[#C19A6B]/50 hover:text-[#C19A6B] transition-colors"
                >
                  <Info size={12} />
                </button>
              </div>
              <span
                className="text-lg font-bold text-[#5D4037] dark:text-[#d4b483]"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
              >
                {noorScore.toLocaleString('ar-EG')}
              </span>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-[9px] text-[#8B6B3D]/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>التسبيح</p>
                <p className="text-xs font-bold text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>{tasbeehTotal.toLocaleString('ar-EG')}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8B6B3D]/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>ختمات</p>
                <p className="text-xs font-bold text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>{quranCompletions}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#8B6B3D]/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>أذكار</p>
                <p className="text-xs font-bold text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>{azkarStreak} يوم</p>
              </div>
            </div>
          </div>

          {/* Refresh button row */}
          <div
            className="flex items-center justify-end px-4 py-2 gap-1.5"
            style={{ borderTop: '1px solid rgba(193,154,107,0.15)' }}
          >
            <span className="text-[10px] text-[#8B6B3D]/40 flex-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {syncStatus === 'done' ? '✓ تم التحديث' : syncStatus === 'syncing' ? 'جارٍ المزامنة...' : 'اضغط لمزامنة إحصائياتك'}
            </span>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowConfirmSync(true)}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: 'linear-gradient(135deg, #8B6B3D, #C19A6B)',
                color: '#fff',
                opacity: syncStatus === 'syncing' ? 0.6 : 1,
                boxShadow: '0 2px 8px rgba(193,154,107,0.3)',
              }}
            >
              <RefreshCw size={11} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              تحديث
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {[
            { key: 'badges' as const, label: 'شاراتي', Icon: Trophy },
            { key: 'leaderboard' as const, label: 'الترتيب العالمي', Icon: Users },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold transition-all border',
                activeTab === tab.key
                  ? 'border-[#C19A6B]/50 text-[#5D4037] dark:text-[#d4b483]'
                  : 'border-transparent text-[#8B6B3D]/50'
              )}
              style={{
                fontFamily: '"Tajawal", sans-serif',
                background: activeTab === tab.key
                  ? 'linear-gradient(135deg, rgba(193,154,107,0.2), rgba(193,154,107,0.1))'
                  : 'transparent',
              }}
            >
              <tab.Icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'badges' ? (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              {pillars.map(p => (
                <PillarSection
                  key={p.key}
                  pillar={p.key}
                  label={p.label}
                  badges={BADGES.filter(b => b.pillar === p.key)}
                  stats={stats}
                  completions={quranCompletions}
                />
              ))}

              {totalUnlocked === 0 && (
                <div className="text-center py-6 opacity-50">
                  <p className="text-sm text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    ابدأ رحلتك الإيمانية وافتح أولى شاراتك
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {!isPublic && (
                <div
                  className="mb-4 p-4 rounded-2xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(193,154,107,0.1), rgba(193,154,107,0.06))',
                    border: '1px dashed rgba(193,154,107,0.3)',
                  }}
                >
                  <p
                    className="text-sm text-[#8B6B3D] mb-3"
                    style={{ fontFamily: '"Tajawal", sans-serif' }}
                  >
                    انضم للصحبة لتظهر في الترتيب العالمي ويراك إخوانك الذاكرون
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={togglePublic}
                    className="px-6 py-2.5 rounded-2xl text-white text-sm font-bold"
                    style={{
                      fontFamily: '"Tajawal", sans-serif',
                      background: 'linear-gradient(135deg, #8B6B3D, #C19A6B)',
                    }}
                  >
                    انضم لركب الذاكرين
                  </motion.button>
                </div>
              )}

              {isPublic && myRank > 0 && (
                <div
                  className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(193,154,107,0.15), rgba(193,154,107,0.08))',
                    border: '1px solid rgba(193,154,107,0.3)',
                  }}
                >
                  <Trophy size={18} className="text-[#C19A6B]" />
                  <div>
                    <p className="text-xs text-[#8B6B3D]/70" style={{ fontFamily: '"Tajawal", sans-serif' }}>ترتيبك العالمي</p>
                    <p className="text-lg font-bold text-[#5D4037] dark:text-[#d4b483]" style={{ fontFamily: '"Tajawal", sans-serif' }}>#{myRank}</p>
                  </div>
                  <div className="mr-auto flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setShowConfirmSync(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                      style={{
                        fontFamily: '"Tajawal", sans-serif',
                        background: 'linear-gradient(135deg, #8B6B3D, #C19A6B)',
                        color: '#fff',
                        boxShadow: '0 2px 6px rgba(193,154,107,0.3)',
                      }}
                    >
                      <RefreshCw size={11} />
                      تحديث
                    </motion.button>
                    <button
                      onClick={fetchLeaderboard}
                      className="text-[10px] text-[#8B6B3D]/50"
                      style={{ fontFamily: '"Tajawal", sans-serif' }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>
              )}

              {loadingLb ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 rounded-2xl bg-[#C19A6B]/10 animate-pulse" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <Users size={32} className="text-[#C19A6B] mx-auto mb-3" />
                  <p className="text-sm text-[#8B6B3D]" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                    كن أول من ينضم للصحبة
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {leaderboard.map((entry, i) => (
                    <LeaderboardRow
                      key={entry.userId}
                      entry={entry}
                      rank={i + 1}
                      isMe={entry.userId === userId}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
