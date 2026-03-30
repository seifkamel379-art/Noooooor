import { useCompass } from '@/hooks/use-compass';
import { useGeolocation, calculateQibla } from '@/hooks/use-geolocation';
import { ArrowLeft, MapPin, RotateCcw } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useRef } from 'react';

/* ── Islamic Geometric Background ───────────────────────────── */
function IslamicBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.06, zIndex: 0 }}>
      <defs>
        <pattern id="islamicTile" x="0" y="0" width="90" height="90" patternUnits="userSpaceOnUse">
          <path d="M45 6 L50 22 L66 18 L61 34 L77 39 L61 44 L66 60 L50 56 L45 72 L40 56 L24 60 L29 44 L13 39 L29 34 L24 18 L40 22 Z"
            fill="none" stroke="#C8991A" strokeWidth="0.8"/>
          <circle cx="45" cy="45" r="10" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <rect x="38" y="38" width="14" height="14" transform="rotate(45 45 45)" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="45" cy="45" r="2.5" fill="#C8991A" opacity="0.4"/>
          <line x1="45" y1="0" x2="45" y2="90" stroke="#C8991A" strokeWidth="0.3" opacity="0.3"/>
          <line x1="0" y1="45" x2="90" y2="45" stroke="#C8991A" strokeWidth="0.3" opacity="0.3"/>
          <circle cx="0" cy="0" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="90" cy="0" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="0" cy="90" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
          <circle cx="90" cy="90" r="5" fill="none" stroke="#C8991A" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamicTile)"/>
    </svg>
  );
}

/* ── 3D Isometric Kaaba ─────────────────────────────────────── */
function KaabaIcon3D({ size = 80, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="kTopFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8C060"/>
          <stop offset="50%" stopColor="#B8860B"/>
          <stop offset="100%" stopColor="#7a5800"/>
        </linearGradient>
        <linearGradient id="kLeftFace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#222222"/>
          <stop offset="100%" stopColor="#333333"/>
        </linearGradient>
        <linearGradient id="kRightFace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d0d0d"/>
          <stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <linearGradient id="kBandL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D4A820"/>
          <stop offset="100%" stopColor="#9A6B00"/>
        </linearGradient>
        <linearGradient id="kBandR" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B6010"/>
          <stop offset="100%" stopColor="#5a3d00"/>
        </linearGradient>
        <linearGradient id="kDoor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C060"/>
          <stop offset="100%" stopColor="#9A7020"/>
        </linearGradient>
        {glow && (
          <filter id="kaGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
        <filter id="kaShadow">
          <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.7)"/>
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="50" cy="93" rx="28" ry="4.5" fill="rgba(0,0,0,0.4)"/>

      {/* Left face (front-left) */}
      <polygon points="20,32 50,18 50,88 20,80" fill="url(#kLeftFace)" filter="url(#kaShadow)"/>

      {/* Right face (front-right) */}
      <polygon points="50,18 80,32 80,80 50,88" fill="url(#kRightFace)"/>

      {/* Top face (roof) */}
      <polygon points="20,32 50,18 80,32 50,46" fill="url(#kTopFace)"/>

      {/* Top face highlight */}
      <polygon points="20,32 50,18 55,21 25,35" fill="#E8D070" opacity="0.25"/>

      {/* Gold band left face */}
      <polygon points="20,43 50,29 50,40 20,54" fill="url(#kBandL)" opacity="0.95"/>

      {/* Gold band right face */}
      <polygon points="50,29 80,43 80,54 50,40" fill="url(#kBandR)" opacity="0.95"/>

      {/* Band top highlight */}
      <line x1="20" y1="43" x2="50" y2="29" stroke="#F0D060" strokeWidth="0.7" opacity="0.8"/>
      <line x1="50" y1="29" x2="80" y2="43" stroke="#C8A030" strokeWidth="0.7" opacity="0.5"/>

      {/* Calligraphy lines on band - left */}
      {[33, 36.5, 40].map((y, i) => (
        <line key={i} x1={22 + i * 0.5} y1={y} x2={48 - i * 0.3} y2={y - 4.5}
          stroke="#E8C060" strokeWidth="0.4" opacity="0.5"/>
      ))}

      {/* Calligraphy lines on band - right */}
      {[33, 36.5, 40].map((y, i) => (
        <line key={i} x1={52 + i * 0.3} y1={y - 4.5} x2={78 - i * 0.5} y2={y}
          stroke="#9A6000" strokeWidth="0.4" opacity="0.4"/>
      ))}

      {/* Door - left face */}
      <polygon points="30,60 40,55 40,82 30,82" fill="url(#kDoor)" opacity="0.9"/>
      <polygon points="32,62 38,58 38,80 32,80" fill="#0d0d0d" opacity="0.6"/>
      <line x1="35" y1="69" x2="35" y2="79" stroke="#E8C060" strokeWidth="0.5" opacity="0.5"/>
      <line x1="32" y1="72" x2="38" y2="69" stroke="#E8C060" strokeWidth="0.4" opacity="0.4"/>

      {/* Door handle */}
      <circle cx="37" cy="70" r="1.2" fill="#E8C060" opacity="0.7"/>

      {/* Edge highlights */}
      <line x1="20" y1="32" x2="50" y2="18" stroke="#E8C060" strokeWidth="0.8" opacity="0.7"/>
      <line x1="50" y1="18" x2="80" y2="32" stroke="#C8A030" strokeWidth="0.7" opacity="0.5"/>
      <line x1="50" y1="18" x2="50" y2="88" stroke="#C8991A" strokeWidth="0.5" opacity="0.3"/>
      <line x1="20" y1="32" x2="20" y2="80" stroke="#555" strokeWidth="0.4" opacity="0.4"/>
      <line x1="80" y1="32" x2="80" y2="80" stroke="#222" strokeWidth="0.4" opacity="0.4"/>

      {/* Glow when aligned */}
      {glow && (
        <polygon points="20,32 50,18 80,32 80,80 50,88 20,80"
          fill="none" stroke="#4ade80" strokeWidth="1.5" opacity="0.8"
          filter="url(#kaGlow)"/>
      )}
    </svg>
  );
}

/* ── Premium Compass Face ───────────────────────────────────── */
function PremiumCompassFace({ isAligned }: { isAligned: boolean }) {
  const cx = 150, cy = 150;
  const outerR = 144;
  const outerDecorR = 132;
  const tickOuterR = 128;
  const labelR = 114;

  const ticks = Array.from({ length: 72 }, (_, i) => {
    const angle = i * 5;
    const isMajor = angle % 30 === 0;
    const isMed   = angle % 10 === 0 && !isMajor;
    const innerR  = isMajor ? 116 : isMed ? 120 : 124;
    const rad = (angle * Math.PI) / 180;
    return {
      x1: cx + tickOuterR * Math.sin(rad), y1: cy - tickOuterR * Math.cos(rad),
      x2: cx + innerR     * Math.sin(rad), y2: cy - innerR     * Math.cos(rad),
      isMajor, isMed,
    };
  });

  const degLabels = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  /* 8-point star helper */
  const starPts = (rcx: number, rcy: number, r1: number, r2: number, n: number, offsetDeg = 0) => {
    return Array.from({ length: n * 2 }, (_, i) => {
      const r   = i % 2 === 0 ? r1 : r2;
      const ang = (i * Math.PI) / n + (offsetDeg * Math.PI) / 180 - Math.PI / 2;
      return `${rcx + r * Math.cos(ang)},${rcy + r * Math.sin(ang)}`;
    }).join(' ');
  };

  return (
    <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="cBgGrad" cx="50%" cy="42%" r="65%">
          <stop offset="0%"   stopColor="#1d2e1a"/>
          <stop offset="55%"  stopColor="#111c0f"/>
          <stop offset="100%" stopColor="#080e07"/>
        </radialGradient>
        <radialGradient id="cRoseGrad" cx="50%" cy="50%" r="55%">
          <stop offset="0%"   stopColor="#243020"/>
          <stop offset="100%" stopColor="#111a0e"/>
        </radialGradient>
        <linearGradient id="cNorth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#16a34a"/>
        </linearGradient>
        <filter id="cGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="cAlignGlow">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Main background */}
      <circle cx={cx} cy={cy} r={outerR} fill="url(#cBgGrad)"/>

      {/* Outer border ring */}
      <circle cx={cx} cy={cy} r={outerR}       fill="none" stroke="#C8991A" strokeWidth="2" opacity="0.9"/>
      <circle cx={cx} cy={cy} r={outerR - 1.5} fill="none" stroke="#E8C060" strokeWidth="0.5" opacity="0.4"/>

      {/* Outer decorative band */}
      <circle cx={cx} cy={cy} r={outerDecorR} fill="none" stroke="#8B6010" strokeWidth="14" opacity="0.25"/>

      {/* Inner border of decorative band */}
      <circle cx={cx} cy={cy} r={outerDecorR - 7} fill="none" stroke="#C8991A" strokeWidth="1" opacity="0.6"/>

      {/* Ornamental diamonds on outer ring */}
      {Array.from({ length: 24 }, (_, i) => {
        const ang = (i * 15 * Math.PI) / 180;
        const r   = outerDecorR;
        const x   = cx + r * Math.sin(ang);
        const y   = cy - r * Math.cos(ang);
        const s   = i % 2 === 0 ? 4.5 : 3;
        return (
          <rect key={i}
            x={x - s / 2} y={y - s / 2} width={s} height={s}
            transform={`rotate(${i * 15 + 45}, ${x}, ${y})`}
            fill={i % 6 === 0 ? '#E8C060' : '#C8991A'}
            opacity={i % 6 === 0 ? 0.9 : 0.6}
          />
        );
      })}

      {/* Small circles between diamonds */}
      {Array.from({ length: 24 }, (_, i) => {
        const ang = ((i * 15 + 7.5) * Math.PI) / 180;
        const r   = outerDecorR;
        const x   = cx + r * Math.sin(ang);
        const y   = cy - r * Math.cos(ang);
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#C8991A" opacity="0.5"/>;
      })}

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.isMajor ? '#C8991A' : t.isMed ? '#9A7828' : '#5a4010'}
          strokeWidth={t.isMajor ? 2.2 : t.isMed ? 1.2 : 0.7}
          opacity={t.isMajor ? 1 : t.isMed ? 0.75 : 0.4}
        />
      ))}

      {/* Degree numbers every 30° */}
      {degLabels.map(deg => {
        const rad = (deg * Math.PI) / 180;
        const x = cx + labelR * Math.sin(rad);
        const y = cy - labelR * Math.cos(rad);
        const isNorth = deg === 0;
        return (
          <text key={deg} x={x} y={y}
            textAnchor="middle" dominantBaseline="middle"
            fill={isNorth ? (isAligned ? '#4ade80' : '#E8C060') : '#C8991A'}
            fontSize={isNorth ? 9.5 : 8.5}
            fontWeight={isNorth ? 'bold' : 'normal'}
            fontFamily="Tajawal,monospace"
            opacity={isNorth ? 1 : 0.9}
            transform={`rotate(${deg}, ${x}, ${y})`}
          >
            {deg}
          </text>
        );
      })}

      {/* Inner compass area background */}
      <circle cx={cx} cy={cy} r={100} fill="url(#cRoseGrad)"/>
      <circle cx={cx} cy={cy} r={100} fill="none" stroke="#C8991A" strokeWidth="1.2" opacity="0.55"/>
      <circle cx={cx} cy={cy} r={98} fill="none" stroke="#E8C060" strokeWidth="0.4" opacity="0.2"/>

      {/* 16-point compass rose — main 4 cardinal points */}
      <polygon points={starPts(cx, cy, 90, 22, 4)}
        fill="#2d4a2a" stroke="#C8991A" strokeWidth="1" opacity="0.95"/>

      {/* 16-point compass rose — 4 inter-cardinal points (45° rotated) */}
      <polygon points={starPts(cx, cy, 65, 18, 4, 45)}
        fill="#243a20" stroke="#8B6010" strokeWidth="0.8" opacity="0.85"/>

      {/* 16-point compass rose — 8 smaller points */}
      <polygon points={starPts(cx, cy, 48, 14, 8, 22.5)}
        fill="#1d2e1a" stroke="#6B4A10" strokeWidth="0.6" opacity="0.7"/>

      {/* Cardinal direction labels on rose */}
      <text x={cx} y={cy - 72} textAnchor="middle" dominantBaseline="middle"
        fill={isAligned ? '#4ade80' : '#E8C060'}
        fontSize="11" fontWeight="bold" fontFamily="Tajawal,sans-serif"
        style={{ transition: 'fill 0.5s' }}>ش</text>
      <text x={cx + 72} y={cy} textAnchor="middle" dominantBaseline="middle"
        fill="#C8991A" fontSize="9" fontFamily="Tajawal,sans-serif" opacity="0.9">ق</text>
      <text x={cx} y={cy + 72} textAnchor="middle" dominantBaseline="middle"
        fill="#C8991A" fontSize="9" fontFamily="Tajawal,sans-serif" opacity="0.9">ج</text>
      <text x={cx - 72} y={cy} textAnchor="middle" dominantBaseline="middle"
        fill="#C8991A" fontSize="9" fontFamily="Tajawal,sans-serif" opacity="0.9">غ</text>

      {/* Inner decorative rings */}
      <circle cx={cx} cy={cy} r={28} fill="#141e12" stroke="#C8991A" strokeWidth="0.8" opacity="0.8"/>
      <circle cx={cx} cy={cy} r={22} fill="#0e160c" stroke="#8B6010" strokeWidth="0.6" opacity="0.7"/>

      {/* Small star in center ring */}
      <polygon points={starPts(cx, cy, 18, 9, 8)} fill="#1d2e1a" stroke="#C8991A" strokeWidth="0.5" opacity="0.6"/>

      {/* Alignment glow */}
      {isAligned && (
        <>
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#4ade80"
            strokeWidth="3" opacity="0.35" filter="url(#cAlignGlow)"/>
          <circle cx={cx} cy={cy} r={100} fill="none" stroke="#4ade80"
            strokeWidth="1.5" opacity="0.2" filter="url(#cGlow)"/>
        </>
      )}
    </svg>
  );
}

/* ── Glowing Qibla Arrow ────────────────────────────────────── */
function QiblaArrow({ isAligned, isSearching }: { isAligned: boolean; isSearching: boolean }) {
  return (
    <svg width="54" height="210" viewBox="0 0 54 210" style={{
      overflow: 'visible',
      filter: isAligned
        ? 'drop-shadow(0 0 10px rgba(74,222,128,1)) drop-shadow(0 0 22px rgba(74,222,128,0.6))'
        : 'drop-shadow(0 0 7px rgba(74,222,128,0.7)) drop-shadow(0 0 14px rgba(74,222,128,0.3))',
      transition: 'filter 0.5s',
    }}>
      <defs>
        <linearGradient id="arShaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.15"/>
        </linearGradient>
        <filter id="arGlowF">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Shaft */}
      <rect x="22" y="50" width="10" height="125" rx="5" fill="url(#arShaft)"/>

      {/* Tail fins */}
      <polygon points="27,175 17,155 27,162 37,155" fill="rgba(74,222,128,0.5)"/>
      <polygon points="27,190 20,178 27,183 34,178" fill="rgba(74,222,128,0.3)"/>

      {/* Main arrowhead — tip at top */}
      <polygon points="27,3 9,55 27,43 45,55"
        fill="#4ade80" filter="url(#arGlowF)"/>

      {/* Secondary arrowhead wing accents */}
      <polygon points="27,3 9,55 18,45" fill="rgba(74,222,128,0.5)"/>
      <polygon points="27,3 45,55 36,45" fill="rgba(74,222,128,0.3)"/>

      {/* Highlight on tip */}
      <polygon points="27,5 17,35 27,28" fill="rgba(255,255,255,0.45)"/>
    </svg>
  );
}

/* ── Kaaba simple fallback for error/loading states ─────────── */
function KaabaSimple({ size = 56 }: { size?: number }) {
  return <KaabaIcon3D size={size}/>;
}

/* ── Main Qibla Page ────────────────────────────────────────── */
export function Qibla() {
  const { heading, isSupported, requestPermission } = useCompass();
  const { coords, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation(true);

  const qiblaAngle = coords ? calculateQibla(coords.lat, coords.lng) : 0;

  /*
   * FIXED: Removed the incorrect +180 offset that was reversing the direction.
   * Correct formula: rotate arrow by (qiblaAngle - deviceHeading).
   * If the phone faces North (heading=0) and Qibla is at 135°, arrow points to 135°.
   */
  const arrowAngle = ((qiblaAngle - (heading ?? 0)) % 360 + 360) % 360;
  const isAligned  = heading !== null && coords !== null && (arrowAngle < 8 || arrowAngle > 352);
  const isSearching = heading === null || !coords;

  const wasAligned = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAligned.current && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    wasAligned.current = isAligned;
  }, [isAligned]);

  const SIZE = 300;

  const renderContent = () => {
    if (geoLoading) {
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(200,153,26,0.3)', borderTopColor: '#C8991A' }}/>
          <p className="font-bold text-lg" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C8991A' }}>
            جاري تحديد موقعك...
          </p>
        </div>
      );
    }

    if (geoError || !coords) {
      return (
        <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">
          <div className="opacity-80"><KaabaSimple size={70}/></div>
          <div className="rounded-3xl p-5 w-full border"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(200,153,26,0.3)' }}>
            <p className="font-bold text-base mb-2" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
              تحديد اتجاه القبلة
            </p>
            {geoError && (
              <p className="text-sm mb-3" style={{ fontFamily: '"Tajawal", sans-serif', color: '#f87171' }}>{geoError}</p>
            )}
            <p className="text-sm mb-4" style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>
              يحتاج التطبيق إلى موقعك لحساب اتجاه القبلة
            </p>
            <button onClick={requestLocation}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
              style={{ fontFamily: '"Tajawal", sans-serif', background: '#C8991A', color: '#0d0d0d' }}>
              <MapPin className="w-4 h-4"/>
              تحديد موقعي
            </button>
          </div>
        </div>
      );
    }

    if (!isSupported) {
      return (
        <div className="flex flex-col items-center gap-5 text-center max-w-xs">
          <KaabaSimple size={70}/>
          <div className="rounded-3xl p-5 w-full border"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(200,153,26,0.3)' }}>
            <p className="font-bold text-base mb-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
              البوصلة غير مدعومة
            </p>
            <p className="text-sm mb-3" style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>
              اتجاه القبلة من موقعك
            </p>
            <p className="text-5xl font-black" style={{ color: '#C8991A' }}>{Math.round(qiblaAngle)}°</p>
            <p className="text-sm mt-1" style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>شمالاً</p>
          </div>
        </div>
      );
    }

    const needsIOSPermission =
      heading === null && typeof (DeviceOrientationEvent as any).requestPermission === 'function';

    if (needsIOSPermission) {
      return (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs text-center">
          <KaabaSimple size={70}/>
          <div className="rounded-3xl p-5 w-full border"
            style={{ background: 'rgba(200,153,26,0.08)', borderColor: 'rgba(200,153,26,0.3)' }}>
            <p className="font-bold mb-2" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
              تفعيل البوصلة
            </p>
            <p className="text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B9070' }}>
              اضغط للسماح بالوصول لحساس الاتجاه
            </p>
          </div>
          <button onClick={requestPermission}
            className="w-full py-3.5 rounded-2xl font-bold text-sm"
            style={{ fontFamily: '"Tajawal", sans-serif', background: '#C8991A', color: '#0d0d0d' }}>
            تفعيل البوصلة
          </button>
        </div>
      );
    }

    /* ── Full compass ─────────────────────────────────────────── */
    return (
      <div className="flex flex-col items-center gap-5 w-full">

        {/* Status badge / pill */}
        <div className={`px-8 py-3 rounded-2xl text-center transition-all duration-500 ${
          isAligned
            ? 'border border-green-500/50'
            : 'border'
        }`} style={{
          background: isAligned
            ? 'rgba(34,197,94,0.18)'
            : 'rgba(200,153,26,0.12)',
          borderColor: isAligned
            ? 'rgba(74,222,128,0.45)'
            : 'rgba(200,153,26,0.3)',
          boxShadow: isAligned
            ? '0 0 20px rgba(74,222,128,0.2)'
            : 'none',
        }}>
          {isAligned ? (
            <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: '#4ade80' }}>
              أنت في اتجاه القبلة ✓
            </p>
          ) : isSearching ? (
            <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C8991A' }}>
              جاري البحث عن اتجاه القبلة...
            </p>
          ) : (
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8D090' }}>
                وجّه هاتفك نحو الكعبة المشرفة
              </p>
              <p className="text-xs mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', color: '#8B7040' }}>
                القبلة على بُعد {Math.round(qiblaAngle)}° من الشمال
              </p>
            </div>
          )}
        </div>

        {/* Compass container */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>

          {/* Premium compass face */}
          <PremiumCompassFace isAligned={isAligned}/>

          {/* 3D Kaaba fixed at 12 o'clock (north) */}
          <div className="absolute pointer-events-none z-10" style={{
            top: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            filter: isAligned
              ? 'drop-shadow(0 0 14px rgba(74,222,128,0.9))'
              : 'drop-shadow(0 4px 10px rgba(0,0,0,0.8))',
            transition: 'filter 0.5s',
          }}>
            <KaabaIcon3D size={72} glow={isAligned}/>
          </div>

          {/* Rotating arrow pointing to Qibla */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${isSearching ? 'animate-spin' : ''}`}
            style={isSearching ? { animationDuration: '1.8s' } : {
              transform: `rotate(${arrowAngle}deg)`,
              transition: heading !== null ? 'transform 0.15s ease-out' : 'none',
            }}
          >
            <QiblaArrow isAligned={isAligned} isSearching={isSearching}/>
          </div>

          {/* Center pivot dot */}
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="w-5 h-5 rounded-full transition-all duration-500" style={{
              background: '#4ade80',
              border: '3px solid #0d150d',
              boxShadow: '0 0 14px rgba(74,222,128,0.9), 0 0 28px rgba(74,222,128,0.4)',
            }}/>
          </div>
        </div>

        {/* Coordinates */}
        {coords && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" style={{ color: '#6B5030' }}/>
            <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: '#6B5030' }}>
              موقعك: {coords.lat.toFixed(4)}°، {coords.lng.toFixed(4)}°
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden" dir="rtl"
      style={{ background: 'linear-gradient(180deg, #121b10 0%, #0c1309 50%, #080e06 100%)' }}>

      {/* Islamic background watermark */}
      <IslamicBg/>

      {/* Header */}
      <div className="relative z-10 px-4 py-4 flex items-center gap-4 flex-shrink-0 border-b"
        style={{ background: 'rgba(0,0,0,0.35)', borderColor: 'rgba(200,153,26,0.2)' }}>
        <Link href="/more">
          <button className="p-2 rounded-full" style={{ background: 'rgba(200,153,26,0.15)' }}>
            <ArrowLeft className="w-5 h-5" style={{ color: '#C8991A' }}/>
          </button>
        </Link>
        <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif', color: '#E8C060' }}>
          تحديد القبلة
        </h1>
        {(geoError || (!geoLoading && !coords)) && (
          <button onClick={requestLocation}
            className="mr-auto p-2 rounded-full"
            style={{ background: 'rgba(200,153,26,0.15)' }}
            title="إعادة المحاولة">
            <RotateCcw className="w-4 h-4" style={{ color: '#C8991A' }}/>
          </button>
        )}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        {renderContent()}
      </div>
    </div>
  );
}
