/* ────────────────────────────────────────────────────────────
   NoorIcons – custom SVG icon components for the Noor app.
   All icons use currentColor so they inherit Tailwind color classes.
──────────────────────────────────────────────────────────── */

interface P { className?: string; size?: number }

/* ── Prayer beads / Misbaha ───────────────────────────────── */
export function TasbihIcon({ className = '', size = 24 }: P) {
  const cx = 12, cy = 14, r = 6.5;
  const beads = Array.from({ length: 12 }, (_, i) => {
    const deg = 15 + i * 30;
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* ring string */}
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth="0.8" fill="none" />
      {/* beads on ring */}
      {beads.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={i === 5 ? 1.6 : 1.1} fill="currentColor" />
      ))}
      {/* imam bead */}
      <circle cx={12} cy={5.5} r={1.8} fill="currentColor" />
      {/* short string between imam bead and ring */}
      <line x1="12" y1="7.3" x2="12" y2="7.7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      {/* tail */}
      <line x1="12" y1="20.5" x2="12" y2="22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <circle cx="12" cy="23" r="0.7" fill="currentColor" />
    </svg>
  );
}

/* ── Morning / Sun ────────────────────────────────────────── */
export function MorningIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2"   x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2"  y1="12"  x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="6.69" y2="6.69" />
      <line x1="17.31" y1="17.31" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="17.31" y2="6.69" />
      <line x1="6.69"  y1="17.31" x2="4.93" y2="19.07" />
    </svg>
  );
}

/* ── Evening / Crescent moon + star ──────────────────────── */
export function EveningIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      {/* small star */}
      <circle cx="19" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="17" cy="3.5" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="21" cy="8"   r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Sleep ────────────────────────────────────────────────── */
export function SleepIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
      {/* Z Z Z */}
      <text x="14" y="11" fontSize="4.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">z</text>
      <text x="16" y="8.5" fontSize="3.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">z</text>
      <text x="17.5" y="6.5" fontSize="2.5" fontWeight="bold" fill="currentColor" stroke="none" fontFamily="sans-serif">z</text>
    </svg>
  );
}

/* ── Raised hands (dua / after prayer) ───────────────────── */
export function DuaHandsIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Left hand */}
      <path d="M6 10V7a1 1 0 0 1 2 0v3" />
      <path d="M4 11V9a1 1 0 0 1 2 0v2" />
      <path d="M8 10V8a1 1 0 0 1 2 0v5.5c0 1.38-1.12 2.5-2.5 2.5H6A3 3 0 0 1 3 13v-2a1 1 0 0 1 2 0" />
      {/* Right hand */}
      <path d="M18 10V7a1 1 0 0 0-2 0v3" />
      <path d="M20 11V9a1 1 0 0 0-2 0v2" />
      <path d="M16 10V8a1 1 0 0 0-2 0v5.5c0 1.38 1.12 2.5 2.5 2.5H18a3 3 0 0 0 3-3v-2a1 1 0 0 0-2 0" />
      {/* Dividing gap / center */}
      <line x1="12" y1="6" x2="12" y2="16" strokeWidth="0" />
    </svg>
  );
}

/* ── Mosque / Minaret ─────────────────────────────────────── */
export function MosqueIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Main dome */}
      <path d="M5 10 Q5 4 12 4 Q19 4 19 10" />
      {/* Main body */}
      <rect x="5" y="10" width="14" height="10" rx="0.5" />
      {/* Door arch */}
      <path d="M10 20 L10 15 Q12 13 14 15 L14 20" />
      {/* Left minaret */}
      <rect x="2" y="8" width="2.5" height="12" rx="0.5" />
      <path d="M2 8 Q3.25 5.5 4.5 8" />
      <circle cx="3.25" cy="5" r="0.5" fill="currentColor" stroke="none" />
      {/* Right minaret */}
      <rect x="19.5" y="8" width="2.5" height="12" rx="0.5" />
      <path d="M19.5 8 Q20.75 5.5 22 8" />
      <circle cx="20.75" cy="5" r="0.5" fill="currentColor" stroke="none" />
      {/* Windows */}
      <circle cx="9"  cy="13" r="0.8" />
      <circle cx="15" cy="13" r="0.8" />
    </svg>
  );
}

/* ── Open Quran Book ──────────────────────────────────────── */
export function QuranBookIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Left page */}
      <path d="M12 4 C10 4 4 5 3 7 L3 20 C4 18 10 17 12 17" />
      {/* Right page */}
      <path d="M12 4 C14 4 20 5 21 7 L21 20 C20 18 14 17 12 17" />
      {/* Spine */}
      <line x1="12" y1="4" x2="12" y2="17" />
      {/* Left page lines */}
      <line x1="6"  y1="9"  x2="10.5" y2="9"  strokeWidth="0.8" />
      <line x1="6"  y1="11" x2="10.5" y2="11" strokeWidth="0.8" />
      <line x1="6"  y1="13" x2="10.5" y2="13" strokeWidth="0.8" />
      <line x1="6"  y1="15" x2="10.5" y2="15" strokeWidth="0.8" />
      {/* Right page lines */}
      <line x1="13.5" y1="9"  x2="18" y2="9"  strokeWidth="0.8" />
      <line x1="13.5" y1="11" x2="18" y2="11" strokeWidth="0.8" />
      <line x1="13.5" y1="13" x2="18" y2="13" strokeWidth="0.8" />
      <line x1="13.5" y1="15" x2="18" y2="15" strokeWidth="0.8" />
    </svg>
  );
}

/* ── Microphone / Reciters ────────────────────────────────── */
export function MicIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="9"  y1="22" x2="15" y2="22" />
    </svg>
  );
}

/* ── Smart reader / Book + lightning ─────────────────────── */
export function SmartReaderIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Book */}
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      {/* Lightning bolt */}
      <path d="M13 6l-3 5h4l-3 5" fill="none" strokeWidth="1.8" />
    </svg>
  );
}

/* ── Islamic 8-pointed star (Asma Al-Husna) ──────────────── */
export function IslamicStarIcon({ className = '', size = 24 }: P) {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const outerAngle = (i * 45 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 45 + 22.5) - 90) * (Math.PI / 180);
    pts.push(`${12 + 9 * Math.cos(outerAngle)},${12 + 9 * Math.sin(outerAngle)}`);
    pts.push(`${12 + 4.5 * Math.cos(innerAngle)},${12 + 4.5 * Math.sin(innerAngle)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <polygon points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

/* ── Bell / Adhan notification ───────────────────────────── */
export function BellIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/* ── Moon (dark mode) ─────────────────────────────────────── */
export function MoonIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/* ── Scroll / Tafsir ─────────────────────────────────────── */
export function ScrollIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8"  y1="13" x2="16" y2="13" />
      <line x1="8"  y1="17" x2="16" y2="17" />
      <line x1="8"  y1="9"  x2="10" y2="9"  />
      {/* Arabic flourish */}
      <path d="M8 9 Q8.5 8 9.5 9" strokeWidth="1" />
    </svg>
  );
}

/* ── Headphones / Listening ───────────────────────────────── */
export function HeadphonesIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <path d="M3  19a2 2 0 0 0 2  2h1a2 2 0 0 0 2 -2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

/* ── Radio / Broadcast ────────────────────────────────────── */
export function RadioIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Antenna */}
      <line x1="12" y1="2" x2="7" y2="7" />
      <line x1="12" y1="2" x2="17" y2="7" />
      {/* Radio body */}
      <rect x="3" y="7" width="18" height="13" rx="2" />
      {/* Speaker grille */}
      <circle cx="9" cy="13.5" r="2.5" />
      <line x1="8" y1="10.5" x2="10" y2="10.5" strokeWidth="0.8" />
      <line x1="7.5" y1="11.5" x2="10.5" y2="11.5" strokeWidth="0.8" />
      {/* Knobs */}
      <circle cx="16" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="15" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Map Pin with Mosque ──────────────────────────────────── */
export function MosqueMapIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Pin shape */}
      <path d="M12 22s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z" />
      {/* Mosque dome inside */}
      <path d="M9 13.5 Q9 10 12 10 Q15 10 15 13.5" strokeWidth="1.2" />
      {/* Mosque body */}
      <rect x="9" y="13.5" width="6" height="3.5" rx="0.3" strokeWidth="1.2" />
      {/* Crescent */}
      <path d="M11.5 9 Q12 7.5 13 9" strokeWidth="1" />
    </svg>
  );
}

/* ── House / Home ─────────────────────────────────────────── */
export function HomeEnterIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12L12 4l9 8" />
      <path d="M9 20V14h6v6" />
      <rect x="3" y="12" width="18" height="9" rx="0.5" />
      <line x1="3" y1="12" x2="3" y2="21" />
      <line x1="21" y1="12" x2="21" y2="21" />
    </svg>
  );
}

/* ── Food/Bowl ────────────────────────────────────────────── */
export function FoodIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 14 Q3 20 12 20 Q21 20 21 14 Z" />
      <path d="M3 14 Q3 8 12 8 Q21 8 21 14" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <path d="M9 5 Q12 3 15 5" />
    </svg>
  );
}

/* ── Travel / Compass ─────────────────────────────────────── */
export function TravelIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,7 14.5,12 12,10.5 9.5,12" fill="currentColor" stroke="none" />
      <polygon points="12,17 9.5,12 12,13.5 14.5,12" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="3" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </svg>
  );
}

/* ── Rain / Weather ───────────────────────────────────────── */
export function RainIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
      <line x1="8"  y1="19" x2="8"  y2="21" />
      <line x1="12" y1="17" x2="12" y2="19" />
      <line x1="16" y1="19" x2="16" y2="21" />
    </svg>
  );
}

/* ── Shield / Protection from distress ───────────────────── */
export function ShieldHeartIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9.5 11.5 Q9.5 9.5 11 9.5 Q12 9.5 12 10.5 Q12 9.5 13 9.5 Q14.5 9.5 14.5 11.5 Q14.5 13 12 14.5 Q9.5 13 9.5 11.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Prophet star ─────────────────────────────────────────── */
export function ProphetIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 16.5 L5.5 21 L8 13.5 L2 9 L9.5 9 Z" />
    </svg>
  );
}

/* ── Supplication hands with light rays ───────────────────── */
export function SupplicationIcon({ className = '', size = 24 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Light rays from top */}
      <line x1="12" y1="1"   x2="12" y2="3" />
      <line x1="7.5" y1="2.5" x2="8.5" y2="4" />
      <line x1="16.5" y1="2.5" x2="15.5" y2="4" />
      {/* Palm lines (hands) */}
      <path d="M6 11V8a1.5 1.5 0 0 1 3 0v3" />
      <path d="M4.5 12.5V10a1.5 1.5 0 0 1 3 0v2.5" />
      <path d="M9 11V9a1.5 1.5 0 0 1 3 0v5c0 1.7-1.3 3-3 3H7.5A3.5 3.5 0 0 1 4 13.5v-1" />
      <path d="M18 11V8a1.5 1.5 0 0 0-3 0v3" />
      <path d="M19.5 12.5V10a1.5 1.5 0 0 0-3 0v2.5" />
      <path d="M15 11V9a1.5 1.5 0 0 0-3 0v5c0 1.7 1.3 3 3 3h1.5A3.5 3.5 0 0 0 20 13.5v-1" />
    </svg>
  );
}
