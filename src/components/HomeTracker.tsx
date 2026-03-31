import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MORNING_AZKAR, EVENING_AZKAR, SURAH_NAMES } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'wouter';

const TASBIH_DAILY_GOAL = 500;

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
type WardType = 'hizb' | 'juz';

interface TrackerState {
  prayers: Record<PrayerKey, boolean>;
  quranWird: boolean;
}

const DEFAULT_STATE: TrackerState = {
  prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
  quranWird: false,
};

const JUZ_STARTS: { juz: number; surah: number; ayah: number }[] = [
  { juz: 1,  surah: 1,   ayah: 1  }, { juz: 2,  surah: 2,   ayah: 142 },
  { juz: 3,  surah: 2,   ayah: 253 }, { juz: 4,  surah: 3,   ayah: 93  },
  { juz: 5,  surah: 4,   ayah: 24  }, { juz: 6,  surah: 4,   ayah: 148 },
  { juz: 7,  surah: 5,   ayah: 82  }, { juz: 8,  surah: 6,   ayah: 111 },
  { juz: 9,  surah: 7,   ayah: 88  }, { juz: 10, surah: 8,   ayah: 41  },
  { juz: 11, surah: 9,   ayah: 93  }, { juz: 12, surah: 11,  ayah: 6   },
  { juz: 13, surah: 12,  ayah: 53  }, { juz: 14, surah: 15,  ayah: 1   },
  { juz: 15, surah: 17,  ayah: 1   }, { juz: 16, surah: 18,  ayah: 75  },
  { juz: 17, surah: 21,  ayah: 1   }, { juz: 18, surah: 23,  ayah: 1   },
  { juz: 19, surah: 25,  ayah: 21  }, { juz: 20, surah: 27,  ayah: 56  },
  { juz: 21, surah: 29,  ayah: 46  }, { juz: 22, surah: 33,  ayah: 31  },
  { juz: 23, surah: 36,  ayah: 28  }, { juz: 24, surah: 39,  ayah: 32  },
  { juz: 25, surah: 41,  ayah: 47  }, { juz: 26, surah: 46,  ayah: 1   },
  { juz: 27, surah: 51,  ayah: 31  }, { juz: 28, surah: 58,  ayah: 1   },
  { juz: 29, surah: 67,  ayah: 1   }, { juz: 30, surah: 78,  ayah: 1   },
];

const JUZ_MIDPOINTS: { juz: number; surah: number; ayah: number }[] = [
  { juz: 1,  surah: 2,  ayah: 75  }, { juz: 2,  surah: 2,  ayah: 203 },
  { juz: 3,  surah: 3,  ayah: 14  }, { juz: 4,  surah: 3,  ayah: 171 },
  { juz: 5,  surah: 4,  ayah: 88  }, { juz: 6,  surah: 5,  ayah: 4   },
  { juz: 7,  surah: 6,  ayah: 36  }, { juz: 8,  surah: 7,  ayah: 32  },
  { juz: 9,  surah: 7,  ayah: 172 }, { juz: 10, surah: 9,  ayah: 34  },
  { juz: 11, surah: 10, ayah: 27  }, { juz: 12, surah: 11, ayah: 85  },
  { juz: 13, surah: 13, ayah: 19  }, { juz: 14, surah: 16, ayah: 51  },
  { juz: 15, surah: 17, ayah: 99  }, { juz: 16, surah: 20, ayah: 1   },
  { juz: 17, surah: 22, ayah: 1   }, { juz: 18, surah: 24, ayah: 21  },
  { juz: 19, surah: 26, ayah: 84  }, { juz: 20, surah: 28, ayah: 51  },
  { juz: 21, surah: 31, ayah: 1   }, { juz: 22, surah: 35, ayah: 1   },
  { juz: 23, surah: 38, ayah: 1   }, { juz: 24, surah: 40, ayah: 41  },
  { juz: 25, surah: 43, ayah: 24  }, { juz: 26, surah: 49, ayah: 1   },
  { juz: 27, surah: 54, ayah: 1   }, { juz: 28, surah: 62, ayah: 1   },
  { juz: 29, surah: 72, ayah: 1   }, { juz: 30, surah: 93, ayah: 1   },
];

function pos(surah: number, ayah: number) { return surah * 400 + ayah; }

function findCurrentJuz(surah: number, ayah: number): number {
  let juz = 1;
  for (const b of JUZ_STARTS) {
    if (pos(surah, ayah) >= pos(b.surah, b.ayah)) juz = b.juz;
  }
  return juz;
}

function getWardTarget(
  bookmark: { surah: number; ayah: number },
  wardType: WardType,
): { surah: number; ayah: number; label: string } | null {
  const currentJuz = findCurrentJuz(bookmark.surah, bookmark.ayah);
  const mid = JUZ_MIDPOINTS.find(m => m.juz === currentJuz);
  const nextJuz = JUZ_STARTS.find(j => j.juz === currentJuz + 1);
  if (wardType === 'juz') {
    if (!nextJuz) return null;
    return { surah: nextJuz.surah, ayah: nextJuz.ayah, label: `نهاية الجزء ${currentJuz}` };
  } else {
    if (mid && pos(bookmark.surah, bookmark.ayah) < pos(mid.surah, mid.ayah)) {
      return { surah: mid.surah, ayah: mid.ayah, label: `منتصف الجزء ${currentJuz}` };
    }
    if (nextJuz) {
      return { surah: nextJuz.surah, ayah: nextJuz.ayah, label: `نهاية الجزء ${currentJuz}` };
    }
    return null;
  }
}

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── 3D Prayer icons ────────────────────────────────────────────── */
function FajrIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="fajrGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#ffe4a0'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#c5a059'} />
        </radialGradient>
      </defs>
      {/* Horizon line */}
      <line x1="2" y1="20" x2="26" y2="20" stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
      {/* Sun peeking (half circle) */}
      <circle cx="14" cy="20" r="5.5" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.9" />
      <circle cx="14" cy="20" r="5.5" fill="url(#fajrGrad)" />
      <path d="M 8.5 20 A 5.5 5.5 0 0 0 19.5 20" fill="white" fillOpacity="0.15" />
      <circle cx="12.5" cy="18.5" r="1.8" fill="white" fillOpacity="0.35" />
      {/* Dawn rays */}
      {[-40, -20, 0, 20, 40].map((a, i) => {
        const rad = (a - 90) * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 7.5 * Math.cos(rad)} y1={20 + 7.5 * Math.sin(rad)}
            x2={14 + 9.5 * Math.cos(rad)} y2={20 + 9.5 * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
        );
      })}
      {/* Stars */}
      <circle cx="6" cy="10" r="1" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.6" />
      <circle cx="5.5" cy="9.6" r="0.4" fill="white" fillOpacity="0.7" />
      <circle cx="22" cy="8" r="0.7" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.5" />
    </svg>
  );
}

function DhuhrIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="dhuhrGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#fff0b0'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#c5a059'} />
        </radialGradient>
      </defs>
      {/* Glow */}
      <circle cx="14" cy="14" r="8" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.08" />
      {/* Shadow */}
      <circle cx="14.5" cy="14.5" r="5.5" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.2" />
      {/* Sun */}
      <circle cx="14" cy="14" r="5.5" fill="url(#dhuhrGrad)" />
      <circle cx="12" cy="12" r="2.2" fill="white" fillOpacity="0.35" />
      <circle cx="12.5" cy="12.5" r="1" fill="white" fillOpacity="0.45" />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 6.8 * Math.cos(rad)} y1={14 + 6.8 * Math.sin(rad)}
            x2={14 + (i % 2 === 0 ? 8.8 : 8) * Math.cos(rad)} y2={14 + (i % 2 === 0 ? 8.8 : 8) * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth={i % 2 === 0 ? 1.8 : 1.2} strokeOpacity="0.75" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function AsrIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="asrGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#ffd580'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#b08030'} />
        </radialGradient>
      </defs>
      <circle cx="14" cy="14" r="5.5" fill="url(#asrGrad)" />
      <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.3" />
      {/* Afternoon slanted rays */}
      {[20, 65, 110, 155, 200, 245].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 6.5 * Math.cos(rad)} y1={14 + 6.5 * Math.sin(rad)}
            x2={14 + 8.5 * Math.cos(rad)} y2={14 + 8.5 * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
        );
      })}
      {/* Shadow on ground */}
      <ellipse cx="14" cy="24" rx="6" ry="1.5" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.15" />
      <line x1="14" y1="19.5" x2="20" y2="24" stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1" strokeOpacity="0.3" strokeLinecap="round" />
    </svg>
  );
}

function MaghribIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="maghribGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#ffb060'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#8b4a1a'} />
        </radialGradient>
      </defs>
      {/* Sky gradient band */}
      <rect x="0" y="14" width="28" height="6" rx="0" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.06" />
      {/* Horizon */}
      <line x1="2" y1="20" x2="26" y2="20" stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      {/* Setting sun — partly below horizon */}
      <clipPath id="aboveHorizon">
        <rect x="0" y="0" width="28" height="20" />
      </clipPath>
      <circle cx="14" cy="20" r="6" fill="url(#maghribGrad)" clipPath="url(#aboveHorizon)" />
      <path d="M 8 20 A 6 6 0 0 0 20 20" fill="white" fillOpacity="0.15" />
      {/* Warm glow */}
      <ellipse cx="14" cy="20" rx="10" ry="3" fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.12" />
      {/* Horizon rays */}
      {[-50, -25, 0, 25, 50].map((a, i) => {
        const rad = (a - 90) * Math.PI / 180;
        return (
          <line key={i}
            x1={14 + 7.5 * Math.cos(rad)} y1={20 + 7.5 * Math.sin(rad)}
            x2={14 + 10 * Math.cos(rad)} y2={20 + 10 * Math.sin(rad)}
            stroke={done ? '#22c55e' : '#c5a059'} strokeWidth="1.2" strokeOpacity="0.55" strokeLinecap="round"
            clipPath="url(#aboveHorizon)" />
        );
      })}
    </svg>
  );
}

function IshaIcon({ done }: { done: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <radialGradient id="ishaGrad" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor={done ? '#a7f3d0' : '#c8b0ff'} />
          <stop offset="100%" stopColor={done ? '#22c55e' : '#6b4fa0'} />
        </radialGradient>
      </defs>
      {/* Moon shadow */}
      <path d="M 20 14.5 A 9 9 0 1 1 11 5 7 7 0 0 0 20 14.5 Z"
        fill={done ? '#22c55e' : '#6b4fa0'} fillOpacity="0.2" transform="translate(0.4,0.4)" />
      {/* Moon */}
      <path d="M 20 14.5 A 9 9 0 1 1 11 5 7 7 0 0 0 20 14.5 Z"
        fill="url(#ishaGrad)" />
      {/* Highlight */}
      <path d="M 11 5 Q 7 7 5 11 Q 5 8 8 5 Z" fill="white" fillOpacity="0.25" />
      {/* Stars */}
      {[{ cx: 21, cy: 7, r: 1.1 }, { cx: 24, cy: 12, r: 0.75 }, { cx: 19, cy: 4.5, r: 0.75 }].map((s, i) => (
        <g key={i}>
          <circle cx={s.cx} cy={s.cy} r={s.r} fill={done ? '#22c55e' : '#c5a059'} fillOpacity="0.9" />
          <circle cx={s.cx - s.r * 0.35} cy={s.cy - s.r * 0.35} r={s.r * 0.45} fill="white" fillOpacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

type PrayerIconComp = ({ done }: { done: boolean }) => JSX.Element;
const PRAYER_ICONS: Record<PrayerKey, PrayerIconComp> = {
  fajr: FajrIcon,
  dhuhr: DhuhrIcon,
  asr: AsrIcon,
  maghrib: MaghribIcon,
  isha: IshaIcon,
};

/* ── Card icons ────────────────────────────────────────────── */
function MosqueIcon3D() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <g opacity="0.2" transform="translate(0.4, 0.4)">
        <path d="M5 10 Q5 4 12 4 Q19 4 19 10" fill="currentColor" />
        <rect x="5" y="10" width="14" height="10" rx="0.5" fill="currentColor" />
      </g>
      <path d="M5 10 Q5 4 12 4 Q19 4 19 10" fill="currentColor" fillOpacity="0.85" />
      <path d="M6.5 9 Q7 5.5 12 4.5" stroke="white" strokeWidth="0.9" strokeOpacity="0.4" fill="none" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10" rx="0.5" fill="currentColor" fillOpacity="0.7" />
      <path d="M10 20 L10 15 Q12 13 14 15 L14 20" fill="currentColor" fillOpacity="0.5" />
      <rect x="2" y="8" width="2.5" height="12" rx="0.5" fill="currentColor" fillOpacity="0.75" />
      <path d="M2 8 Q3.25 5.5 4.5 8" fill="currentColor" fillOpacity="0.9" />
      <circle cx="3.25" cy="5" r="0.6" fill="currentColor" />
      <rect x="19.5" y="8" width="2.5" height="12" rx="0.5" fill="currentColor" fillOpacity="0.65" />
      <path d="M19.5 8 Q20.75 5.5 22 8" fill="currentColor" fillOpacity="0.8" />
      <circle cx="9" cy="13" r="0.9" fill="white" fillOpacity="0.35" />
      <circle cx="15" cy="13" r="0.9" fill="white" fillOpacity="0.25" />
      <path d="M11.2 3.5 Q12 2.2 13 3.5" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function QuranBookIcon3D() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <g opacity="0.2" transform="translate(0.4,0.4)">
        <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill="currentColor" />
        <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill="currentColor" />
      </g>
      <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" fill="currentColor" fillOpacity="0.75" />
      <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" fill="currentColor" fillOpacity="0.55" />
      <line x1="12" y1="4" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.9" />
      <line x1="12" y1="4" x2="12" y2="17" stroke="white" strokeWidth="0.7" strokeOpacity="0.4" />
      {[9, 11, 13, 15].map(y => (
        <line key={y} x1="5.5" y1={y} x2="10.5" y2={y} strokeWidth="0.8" stroke="currentColor" strokeOpacity="0.55" />
      ))}
      {[9, 11, 13, 15].map(y => (
        <line key={y} x1="13.5" y1={y} x2="18.5" y2={y} strokeWidth="0.8" stroke="currentColor" strokeOpacity="0.4" />
      ))}
    </svg>
  );
}

function TasbihIcon3D() {
  const cx = 12, cy = 14, r = 6.5;
  const beads = Array.from({ length: 12 }, (_, i) => {
    const deg = 15 + i * 30;
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  });
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <circle cx={cx} cy={cy + 0.4} r={r} stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" fill="none" />
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="1" fill="none" />
      <path d={`M ${cx - r * 0.7} ${cy - r * 0.7} A ${r} ${r} 0 0 1 ${cx + r * 0.7} ${cy - r * 0.7}`}
        stroke="white" strokeWidth="0.7" strokeOpacity="0.35" fill="none" strokeLinecap="round" />
      {beads.map((b, i) => {
        const br = i === 5 ? 1.6 : 1.1;
        return (
          <g key={i}>
            <circle cx={b.x + 0.2} cy={b.y + 0.2} r={br} fill="currentColor" fillOpacity="0.2" />
            <circle cx={b.x} cy={b.y} r={br} fill="currentColor" />
            <circle cx={b.x - br * 0.35} cy={b.y - br * 0.35} r={br * 0.35} fill="white" fillOpacity="0.45" />
          </g>
        );
      })}
      <circle cx={12} cy={5.5} r={2.1} fill="currentColor" fillOpacity="0.25" />
      <circle cx={12} cy={5.5} r={1.8} fill="currentColor" />
      <circle cx={11.2} cy={4.7} r={0.7} fill="white" fillOpacity="0.5" />
      <line x1="12" y1="20.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="23" r="0.8" fill="currentColor" />
    </svg>
  );
}

function DuaIcon3D() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
      <g opacity="0.2" transform="translate(0.3,0.3)">
        <path d="M6 10V7a1 1 0 0 1 2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 11V9a1 1 0 0 1 2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <path d="M6 10V7a1 1 0 0 1 2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 11V9a1 1 0 0 1 2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 10V7a1 1 0 0 0-2 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 11V9a1 1 0 0 0-2 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 10V8a1 1 0 0 0-2 0v5.5c0 1.38 1.12 2.5 2.5 2.5H18a3 3 0 0 0 3-3v-2a1 1 0 0 0-2 0"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── Heatmap helpers ─────────────────────────────────────────── */
function getDayScore(dateKey: string): number {
  let score = 0;
  try {
    const raw = localStorage.getItem(`daily_tracker_${dateKey}`);
    if (raw) {
      const t = JSON.parse(raw);
      score += Object.values(t.prayers || {}).filter(Boolean).length;
      if (t.quranWird) score += 1;
    }
  } catch {}
  try {
    const raw = localStorage.getItem(`azkar_${dateKey}`);
    if (raw) {
      const p = JSON.parse(raw);
      const m = MORNING_AZKAR.every(z => (p[z.id] ?? 0) >= z.count);
      const e = EVENING_AZKAR.every(z => (p[z.id] ?? 0) >= z.count);
      if (m && e) score += 1;
    }
  } catch {}
  try {
    const daily = parseInt(localStorage.getItem(`tasbih_daily_${dateKey}`) ?? '0', 10);
    if (daily >= TASBIH_DAILY_GOAL) score += 1;
  } catch {}
  return score;
}

function cellColor(score: number, isToday: boolean): string {
  if (isToday && score === 0) return 'rgba(var(--primary-rgb, 197,160,89),0.14)';
  if (score === 0) return 'rgba(197,160,89,0.06)';
  if (score <= 2) return '#6b4a20';
  if (score <= 4) return '#a0702e';
  if (score <= 6) return '#c5922a';
  if (score <= 7) return '#c5b060';
  return '#c5a059';
}

const PRAYERS: { key: PrayerKey; label: string }[] = [
  { key: 'fajr',    label: 'الفجر'  },
  { key: 'dhuhr',   label: 'الظهر'  },
  { key: 'asr',     label: 'العصر'  },
  { key: 'maghrib', label: 'المغرب' },
  { key: 'isha',    label: 'العشاء' },
];

/* ── Main component ─────────────────────────────────────────── */
export function HomeTracker() {
  const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey);

  const [state, setState] = useLocalStorage<TrackerState>(
    `daily_tracker_${currentDateKey}`,
    DEFAULT_STATE,
  );
  const [wardType, setWardTypePref] = useLocalStorage<WardType>('quran_ward_type', 'hizb');
  const [bookmark] = useLocalStorage<{ surah: number; ayah: number } | null>('quran_bookmark', null);
  const [azkarProgress] = useLocalStorage<Record<string, number>>(`azkar_${currentDateKey}`, {});

  const morningDone = MORNING_AZKAR.every(z => (azkarProgress[z.id] ?? 0) >= z.count);
  const eveningDone = EVENING_AZKAR.every(z => (azkarProgress[z.id] ?? 0) >= z.count);
  const azkarDone = morningDone && eveningDone;

  const [dailyTasbihCount, setDailyTasbihCount] = useState(() =>
    parseInt(localStorage.getItem(`tasbih_daily_${currentDateKey}`) ?? '0', 10)
  );

  useEffect(() => {
    const refresh = () => {
      setDailyTasbihCount(parseInt(localStorage.getItem(`tasbih_daily_${currentDateKey}`) ?? '0', 10));
    };
    window.addEventListener('focus', refresh);
    const id = setInterval(refresh, 3000);
    return () => { window.removeEventListener('focus', refresh); clearInterval(id); };
  }, [currentDateKey]);

  const tasbih500Done = dailyTasbihCount >= TASBIH_DAILY_GOAL;
  const tasbihPct = Math.min(100, Math.round((dailyTasbihCount / TASBIH_DAILY_GOAL) * 100));
  const prayersDone = PRAYERS.filter(p => state.prayers[p.key]).length;
  const doneTasks = prayersDone + (azkarDone ? 1 : 0) + (state.quranWird ? 1 : 0) + (tasbih500Done ? 1 : 0);
  const progressPct = Math.round((doneTasks / 8) * 100);

  const togglePrayer = (key: PrayerKey) => {
    setState(prev => ({ ...prev, prayers: { ...prev.prayers, [key]: !prev.prayers[key] } }));
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const toggleQuranWird = () => {
    setState(prev => ({ ...prev, quranWird: !prev.quranWird }));
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  useEffect(() => {
    const id = setInterval(() => {
      const k = getTodayDateKey();
      if (k !== currentDateKey) setCurrentDateKey(k);
    }, 30000);
    return () => clearInterval(id);
  }, [currentDateKey]);

  const wardTarget = bookmark ? getWardTarget(bookmark, wardType) : null;

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const totalCells = 91 + (6 - dayOfWeek);
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - (totalCells - 1));

    const cells: { dateKey: string; score: number; isToday: boolean; date: Date }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isFuture = d > today;
      cells.push({ dateKey, score: isFuture ? -1 : getDayScore(dateKey), isToday: d.getTime() === today.getTime(), date: new Date(d) });
    }

    const numWeeks = Math.ceil(cells.length / 7);
    const weeksArr: typeof cells[] = [];
    for (let w = 0; w < numWeeks; w++) weeksArr.push(cells.slice(w * 7, w * 7 + 7));

    const months: { label: string; col: number }[] = [];
    weeksArr.forEach((week, col) => {
      const first = week[0];
      if (!first) return;
      if (col === 0 || first.date.getDate() <= 7) {
        const m = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(first.date);
        if (!months.length || months[months.length - 1].label !== m) months.push({ label: m, col });
      }
    });

    return { weeks: weeksArr, monthLabels: months };
  }, []);

  const progressColor = progressPct === 100 ? '#22c55e' : progressPct >= 60 ? '#c5a059' : '#a07a3a';

  return (
    <div className="space-y-4" dir="rtl">

      {/* ── Progress header ── */}
      <div className="rounded-3xl p-4 border border-primary/20"
        style={{ background: 'linear-gradient(135deg, rgba(197,160,89,0.08) 0%, rgba(197,160,89,0.03) 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(197,160,89,0.2), rgba(197,160,89,0.08))' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="currentColor" fillOpacity="0.85" stroke="currentColor" strokeWidth="0.5" />
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="white" fillOpacity="0.15" clipPath="url(#starTopHalf)" />
                <defs><clipPath id="starTopHalf"><rect x="0" y="0" width="24" height="12" /></clipPath></defs>
              </svg>
            </div>
            <h2 className="font-bold text-base text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              المتتبع اليومي
            </h2>
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: progressColor }}>
            {progressPct}%
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(197,160,89,0.12)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${progressColor}88, ${progressColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {doneTasks} / 8 مهام
          </span>
          <AnimatePresence>
            {progressPct === 100 && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-green-500 flex items-center gap-1"
                style={{ fontFamily: '"Tajawal", sans-serif' }}
              >
                <Check className="w-3 h-3" /> يوم مثالي!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Prayer rows (table style) ── */}
      <div className="bg-card rounded-3xl border border-primary/15 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(197,160,89,0.12)' }}>
              <MosqueIcon3D />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              الصلوات الخمس
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {PRAYERS.map((p, i) => (
              <div key={p.key} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ background: state.prayers[p.key] ? '#c5a059' : 'rgba(197,160,89,0.2)' }} />
            ))}
            <span className="text-xs text-muted-foreground mr-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {prayersDone}/5
            </span>
          </div>
        </div>

        {/* Prayer rows */}
        <div className="px-3 pb-3 space-y-1.5">
          {PRAYERS.map((prayer) => {
            const done = state.prayers[prayer.key];
            const PrayerIcon = PRAYER_ICONS[prayer.key];
            return (
              <motion.button
                key={prayer.key}
                onClick={() => togglePrayer(prayer.key)}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300"
                style={
                  done
                    ? { background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.35)' }
                    : { background: 'rgba(197,160,89,0.04)', border: '1px solid rgba(197,160,89,0.1)' }
                }
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background: done
                      ? 'linear-gradient(135deg, rgba(197,160,89,0.22), rgba(197,160,89,0.08))'
                      : 'rgba(197,160,89,0.07)',
                    boxShadow: done ? '0 2px 8px rgba(197,160,89,0.2)' : 'none',
                  }}>
                  <PrayerIcon done={done} />
                </div>

                {/* Label */}
                <span
                  className="flex-1 text-right font-bold text-sm"
                  style={{
                    fontFamily: '"Tajawal", sans-serif',
                    color: done ? '#c5a059' : 'var(--foreground)',
                  }}
                >
                  {prayer.label}
                </span>

                {/* Check */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                  style={
                    done
                      ? { background: 'linear-gradient(135deg, #c5a059, #9a7430)', boxShadow: '0 2px 8px rgba(197,160,89,0.4)' }
                      : { border: '2px solid rgba(197,160,89,0.3)', background: 'transparent' }
                  }
                >
                  {done && <Check className="w-4 h-4 text-white" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Task Cards ── */}
      <div className="space-y-3">

        {/* Azkar card */}
        <div className="rounded-2xl p-4 border transition-all duration-300"
          style={
            azkarDone
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--card)' }
          }>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: azkarDone ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                <DuaIcon3D />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>أذكار الصباح والمساء</p>
                <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: 'var(--muted-foreground)' }}>
                  {azkarDone ? 'مكتمل ✓' : morningDone ? 'الصباح ✓ · المساء لم يكتمل' : eveningDone ? 'المساء ✓ · الصباح لم يكتمل' : 'لم يبدأ بعد'}
                </p>
              </div>
            </div>
            {azkarDone ? (
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Link href="/azkar">
                <div className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                  ابدأ
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Quran wird card */}
        <div className="rounded-2xl border transition-all duration-300"
          style={
            state.quranWird
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--card)' }
          }>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: state.quranWird ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                  <QuranBookIcon3D />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>الورد القرآني</p>
                  {bookmark ? (
                    <p className="text-xs mt-0.5 text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      من: {SURAH_NAMES[bookmark.surah]} آية {bookmark.ayah}
                    </p>
                  ) : (
                    <p className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      ضع علامة حفظ في المصحف أولاً
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                onClick={bookmark ? toggleQuranWird : undefined}
                whileTap={bookmark ? { scale: 0.88 } : {}}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                style={
                  state.quranWird
                    ? { background: '#22c55e', borderColor: '#22c55e' }
                    : { background: 'transparent', borderColor: 'rgba(197,160,89,0.35)' }
                }
              >
                {state.quranWird && <Check className="w-4 h-4 text-white" />}
              </motion.button>
            </div>

            {bookmark && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(197,160,89,0.12)' }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>مقدار الورد:</span>
                  <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(197,160,89,0.3)' }}>
                    {(['hizb', 'juz'] as WardType[]).map(t => (
                      <button key={t} onClick={() => setWardTypePref(t)} className="px-3 py-1 text-xs font-bold transition-all"
                        style={{
                          fontFamily: '"Tajawal", sans-serif',
                          background: wardType === t ? 'linear-gradient(135deg, #c5a059, #9a7430)' : 'transparent',
                          color: wardType === t ? '#fff' : 'var(--muted-foreground)',
                        }}>
                        {t === 'hizb' ? 'حزب' : 'جزء'}
                      </button>
                    ))}
                  </div>
                </div>
                {wardTarget ? (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'rgba(197,160,89,0.08)', border: '1px solid rgba(197,160,89,0.18)' }}>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {wardTarget.label} — اقرأ حتى:
                    </span>
                    <span className="text-xs font-bold text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                      {SURAH_NAMES[wardTarget.surah]} آية {wardTarget.ayah}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(197,160,89,0.08)' }}>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>الجزء 30 — اقرأ حتى نهاية القرآن</span>
                  </div>
                )}
                {!state.quranWird && (
                  <button onClick={toggleQuranWird} className="w-full mt-2 py-2 rounded-xl text-xs font-bold text-center transition-all"
                    style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                    أكملت وردي ✓
                  </button>
                )}
              </div>
            )}

            {!bookmark && (
              <Link href="/quran">
                <div className="mt-3 py-2 rounded-xl text-xs font-bold text-center"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'rgba(197,160,89,0.1)', color: '#c5a059', border: '1px solid rgba(197,160,89,0.25)' }}>
                  اذهب للمصحف وضع علامة حفظ →
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* 500 Tasbih card */}
        <div className="rounded-2xl p-4 border transition-all duration-300"
          style={
            tasbih500Done
              ? { borderColor: 'rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.05)' }
              : { borderColor: 'rgba(197,160,89,0.18)', background: 'var(--card)' }
          }>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: tasbih500Done ? 'rgba(34,197,94,0.12)' : 'rgba(197,160,89,0.1)' }}>
                <TasbihIcon3D />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>٥٠٠ تسبيحة يومياً</p>
                <p className="text-xs mt-0.5 text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {tasbih500Done ? 'مكتمل ✓' : `${dailyTasbihCount.toLocaleString('ar-EG')} / ${TASBIH_DAILY_GOAL.toLocaleString('ar-EG')} تسبيحة`}
                </p>
              </div>
            </div>
            {tasbih500Done ? (
              <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-sm shadow-green-500/30">
                <Check className="w-5 h-5 text-white" />
              </div>
            ) : (
              <Link href="/tasbih">
                <div className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ fontFamily: '"Tajawal", sans-serif', background: 'linear-gradient(135deg, #c5a059, #9a7430)', color: '#fff' }}>
                  سبّح
                </div>
              </Link>
            )}
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(197,160,89,0.12)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: tasbih500Done ? 'linear-gradient(90deg, #22c55e99, #22c55e)' : 'linear-gradient(90deg, #c5a05999, #c5a059)' }}
              initial={{ width: 0 }}
              animate={{ width: `${tasbihPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div className="rounded-3xl overflow-hidden border border-primary/15" style={{ background: 'var(--card)' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>سجل الأيام</h3>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>آخر 13 أسبوع</span>
          </div>
          <div className="overflow-x-auto" style={{ direction: 'ltr' }}>
            <div style={{ display: 'inline-block' }}>
              <div style={{ display: 'flex', marginBottom: 4, paddingRight: 28 }}>
                {weeks.map((_, col) => {
                  const ml = monthLabels.find(m => m.col === col);
                  return (
                    <div key={col} style={{ width: 13, marginLeft: 2, flexShrink: 0 }}>
                      {ml && <span className="text-[8px] text-muted-foreground">{ml.label}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {weeks.map((week, col) => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {week.map((cell, row) => (
                      <div key={row} style={{
                        width: 13, height: 13, borderRadius: 3,
                        background: cell.score < 0 ? 'transparent' : cellColor(cell.score, cell.isToday),
                        border: cell.isToday ? '1.5px solid #c5a059' : '1px solid rgba(197,160,89,0.08)',
                        boxShadow: cell.score === 8 ? '0 0 5px rgba(197,160,89,0.7)' : 'none',
                        transition: 'background 0.2s',
                      }} title={cell.score >= 0 ? `${cell.dateKey}: ${cell.score}/8` : ''} />
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }}>
                  {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => (
                    <div key={d} style={{ height: 13, lineHeight: '13px' }} className="text-[9px] text-muted-foreground">{d}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(197,160,89,0.1)' }}>
            <div className="flex items-end justify-center gap-3" style={{ direction: 'ltr' }}>
              {[
                { score: 0,  label: 'لا شيء' },
                { score: 2,  label: '١-٢' },
                { score: 4,  label: '٣-٥' },
                { score: 6,  label: '٦-٧' },
                { score: 8,  label: 'مثالي' },
              ].map(({ score, label }) => (
                <div key={score} className="flex flex-col items-center gap-1">
                  <div style={{
                    width: 13, height: 13, borderRadius: 3,
                    background: cellColor(score, false),
                    border: '1px solid rgba(197,160,89,0.15)',
                    boxShadow: score === 8 ? '0 0 5px rgba(197,160,89,0.6)' : 'none',
                  }} />
                  <span className="text-[9px] text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
