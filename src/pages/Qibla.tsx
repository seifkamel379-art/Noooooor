import { useCompass } from '@/hooks/use-compass';
import { useGeolocation, calculateQibla } from '@/hooks/use-geolocation';
import { ArrowLeft, MapPin, RotateCcw } from 'lucide-react';
import { Link } from 'wouter';
import { useEffect, useRef } from 'react';

/* ── Realistic Kaaba SVG ────────────────────────────────────── */
function KaabaIcon({ size = 56, glow = false }: { size?: number; glow?: boolean }) {
  const w = size;
  const h = Math.round(size * 1.25);
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#1c1c1c"/>
          <stop offset="40%"  stopColor="#111"/>
          <stop offset="100%" stopColor="#0a0a0a"/>
        </linearGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#E8C060"/>
          <stop offset="50%"  stopColor="#B8860B"/>
          <stop offset="100%" stopColor="#8a6200"/>
        </linearGradient>
        <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#C8991A"/>
          <stop offset="30%"  stopColor="#8B6510"/>
          <stop offset="100%" stopColor="#6a4e00"/>
        </linearGradient>
        <linearGradient id="doorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#E8C060"/>
          <stop offset="100%" stopColor="#A07820"/>
        </linearGradient>
        {glow && (
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
      </defs>
      <rect x="2" y="10" width="76" height="2" fill="#5a3d00" opacity="0.5"/>
      <rect x="2" y="2" width="76" height="10" rx="2" fill="url(#roofGrad)"/>
      <rect x="2" y="2" width="76" height="3" rx="2" fill="#F0D070" opacity="0.6"/>
      <rect x="2" y="10" width="76" height="1.5" fill="#6a4500"/>
      <rect x="2" y="12" width="76" height="86" rx="1" fill="url(#bodyGrad)"/>
      <rect x="2" y="12" width="5" height="86" fill="#C8991A" opacity="0.18"/>
      <rect x="73" y="12" width="5" height="86" fill="#000" opacity="0.35"/>
      <rect x="2" y="27" width="76" height="1.5" fill="#000" opacity="0.4"/>
      <rect x="2" y="28" width="76" height="20" fill="url(#bandGrad)"/>
      <rect x="2" y="28" width="76" height="2.5" fill="#E8C060" opacity="0.85"/>
      <rect x="2" y="46" width="76" height="2" fill="#E8C060" opacity="0.7"/>
      <rect x="2" y="47.5" width="76" height="1" fill="#000" opacity="0.35"/>
      <rect x="8" y="32"  width="64" height="1.5" rx="0.75" fill="#4a3000" opacity="0.9"/>
      <rect x="8" y="35.5" width="64" height="1.5" rx="0.75" fill="#4a3000" opacity="0.9"/>
      <rect x="8" y="39"  width="64" height="1.5" rx="0.75" fill="#4a3000" opacity="0.9"/>
      <rect x="8" y="42.5" width="64" height="1.5" rx="0.75" fill="#4a3000" opacity="0.9"/>
      <rect x="8" y="32"  width="64" height="0.6" rx="0.3" fill="#E8C060" opacity="0.3"/>
      <rect x="8" y="35.5" width="64" height="0.6" rx="0.3" fill="#E8C060" opacity="0.3"/>
      <rect x="8" y="39"  width="64" height="0.6" rx="0.3" fill="#E8C060" opacity="0.3"/>
      {[15, 27, 40, 53, 65].map((x, i) => (
        <g key={i}>
          <polygon points={`${x},33.5 ${x+4},37.5 ${x},41.5 ${x-4},37.5`} fill="#E8C060" opacity="0.55"/>
          <polygon points={`${x},34.5 ${x+2.5},37.5 ${x},40.5 ${x-2.5},37.5`} fill="#000" opacity="0.25"/>
        </g>
      ))}
      <rect x="31" y="62" width="18" height="26" rx="2" fill="url(#doorGrad)"/>
      <rect x="33" y="64" width="14" height="22" rx="1.5" fill="#0a0a0a" opacity="0.6"/>
      <rect x="34" y="65" width="12" height="20" rx="1" fill="#7a5200" opacity="0.3"/>
      <rect x="35" y="66" width="4" height="18" rx="0.5" fill="#E8C060" opacity="0.15"/>
      <rect x="41" y="66" width="4" height="18" rx="0.5" fill="#E8C060" opacity="0.15"/>
      <rect x="35" y="74.5" width="10" height="1" fill="#E8C060" opacity="0.3"/>
      <rect x="2" y="2" width="76" height="96" rx="2"
        fill="none" stroke="#C8991A" strokeWidth="1" opacity="0.4"/>
      {glow && (
        <rect x="2" y="2" width="76" height="96" rx="2"
          fill="none" stroke="#4ade80" strokeWidth="2" opacity="0.7"
          filter="url(#glowFilter)"
        />
      )}
    </svg>
  );
}

/* ── Compass face with degree numbers ──────────────────────── */
function CompassFace({ isAligned }: { isAligned: boolean }) {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const angle  = i * 5;
    const isCard = angle % 90 === 0;
    const isMid  = angle % 45 === 0 && !isCard;
    const outerR = 120;
    const innerR = isCard ? 102 : isMid ? 108 : 114;
    const rad    = (angle * Math.PI) / 180;
    return {
      x1: 130 + outerR * Math.sin(rad), y1: 130 - outerR * Math.cos(rad),
      x2: 130 + innerR * Math.sin(rad), y2: 130 - innerR * Math.cos(rad),
      isCard, isMid,
    };
  });

  /* Degree labels every 30°, but skip 0° (Kaaba is there) */
  const degLabels = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const labelR = 105;

  const accent = isAligned ? '#4ade80' : 'var(--primary)';
  return (
    <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="cBg" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--card)" stopOpacity="1"/>
          <stop offset="100%" stopColor="var(--background)" stopOpacity="1"/>
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="130" cy="130" r="127" fill="url(#cBg)"/>
      <circle cx="130" cy="130" r="125" fill="none"
        stroke={accent} strokeWidth="2.5"
        opacity={isAligned ? 0.85 : 0.4}
        style={{ transition: 'stroke 0.5s, opacity 0.5s' }}
      />
      <circle cx="130" cy="130" r="90" fill="none"
        stroke={accent} strokeWidth="0.5" opacity="0.12"/>

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.isCard ? 'var(--primary)' : t.isMid ? 'var(--primary)' : 'var(--border)'}
          strokeWidth={t.isCard ? 2.5 : t.isMid ? 1.5 : 0.8}
          opacity={t.isCard ? 1 : t.isMid ? 0.55 : 0.35}
        />
      ))}

      {/* Degree numbers every 30° */}
      {degLabels.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 130 + labelR * Math.sin(rad);
        const y = 130 - labelR * Math.cos(rad);
        return (
          <text
            key={deg}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--muted-foreground)"
            fontSize="8"
            fontFamily="Tajawal,sans-serif"
            opacity="0.65"
            transform={`rotate(${deg}, ${x}, ${y})`}
          >
            {deg}
          </text>
        );
      })}

      {/* Cardinal labels — ش (N) at top, ق (E) right, ج (S) bottom, غ (W) left */}
      <text x="130" y="14" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="bold" fontFamily="Tajawal,sans-serif">ش</text>
      <text x="247" y="135" textAnchor="middle" fill="var(--primary)" fontSize="11" fontFamily="Tajawal,sans-serif" opacity="0.8">ق</text>
      <text x="130" y="250" textAnchor="middle" fill="var(--primary)" fontSize="11" fontFamily="Tajawal,sans-serif" opacity="0.8">ج</text>
      <text x="13"  y="135" textAnchor="middle" fill="var(--primary)" fontSize="11" fontFamily="Tajawal,sans-serif" opacity="0.8">غ</text>
    </svg>
  );
}

/* ── Qibla Arrow — tip always at TOP of SVG ─────────────────
   Fix: we add 180° externally so tip actually faces Qibla.
───────────────────────────────────────────────────────────── */
function QiblaArrow({ isAligned, isSearching }: { isAligned: boolean; isSearching: boolean }) {
  const tipColor   = isAligned ? '#4ade80' : 'var(--primary)';
  const shaftColor = isAligned ? 'rgba(74,222,128,0.45)' : 'rgba(193,154,107,0.45)';
  const glowColor  = isAligned ? 'rgba(74,222,128,0.9)' : 'transparent';
  const glowBlur   = isAligned ? '8px' : '0px';

  return (
    <svg
      width="44"
      height="180"
      viewBox="0 0 44 180"
      style={{
        overflow: 'visible',
        filter: isAligned
          ? `drop-shadow(0 0 ${glowBlur} ${glowColor})`
          : `drop-shadow(0 2px 6px rgba(0,0,0,0.35))`,
        transition: 'filter 0.5s',
      }}
    >
      <defs>
        {isAligned && (
          <filter id="arrowGlow">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        )}
        <linearGradient id="arrowShaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tipColor} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={tipColor} stopOpacity="0.15"/>
        </linearGradient>
      </defs>

      {/* Shaft */}
      <rect
        x="18" y="40" width="8" height="120" rx="4"
        fill="url(#arrowShaft)"
        style={{ transition: 'fill 0.5s' }}
      />

      {/* Tail fin */}
      <polygon
        points="22,160 14,145 22,150 30,145"
        fill={shaftColor}
        style={{ transition: 'fill 0.5s' }}
      />

      {/* Arrowhead — pointing UP (tip at y=2) */}
      <polygon
        points="22,2 6,44 22,36 38,44"
        fill={tipColor}
        filter={isAligned ? 'url(#arrowGlow)' : undefined}
        style={{ transition: 'fill 0.5s' }}
      />

      {/* Highlight */}
      <polygon
        points="22,4 14,30 22,25"
        fill="white"
        opacity={isAligned ? 0.35 : 0.15}
        style={{ transition: 'opacity 0.5s' }}
      />
    </svg>
  );
}

/* ── Main Qibla Page ─────────────────────────────────────── */
export function Qibla() {
  const { heading, isSupported, requestPermission } = useCompass();
  const { coords, error: geoError, isLoading: geoLoading, requestLocation } = useGeolocation(true);

  const qiblaAngle = coords ? calculateQibla(coords.lat, coords.lng) : 0;

  /*
   * +180 corrects the heading reference so the TIP (not tail) of the arrow
   * points toward Qibla. Without this correction the device heading is
   * measured from the back of the phone, so the arrow ends up inverted.
   */
  const arrowAngle = ((qiblaAngle - (heading ?? 0) + 180) % 360 + 360) % 360;
  const isAligned  = heading !== null && coords !== null && (arrowAngle < 8 || arrowAngle > 352);

  const isSearching = heading === null || !coords;

  const wasAligned = useRef(false);
  useEffect(() => {
    if (isAligned && !wasAligned.current && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    wasAligned.current = isAligned;
  }, [isAligned]);

  const SIZE = 290;

  const renderContent = () => {
    if (geoLoading) {
      return (
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
          <p className="text-primary font-bold text-lg" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            جاري تحديد موقعك...
          </p>
        </div>
      );
    }

    if (geoError || !coords) {
      return (
        <div className="flex flex-col items-center gap-6 text-center max-w-xs w-full">
          <div className="opacity-70"><KaabaIcon size={72}/></div>
          <div className="bg-card border border-border rounded-3xl p-5 w-full shadow-sm">
            <p className="font-bold text-base mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              تحديد اتجاه القبلة
            </p>
            {geoError && (
              <p className="text-sm text-destructive mb-3" style={{ fontFamily: '"Tajawal", sans-serif' }}>{geoError}</p>
            )}
            <p className="text-sm text-muted-foreground mb-4" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              يحتاج التطبيق إلى موقعك لحساب اتجاه القبلة
            </p>
            <button
              onClick={requestLocation}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-primary text-primary-foreground"
              style={{ fontFamily: '"Tajawal", sans-serif' }}
            >
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
          <KaabaIcon size={72}/>
          <div className="bg-card border border-border rounded-3xl p-5 w-full shadow-sm">
            <p className="font-bold text-base mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>البوصلة غير مدعومة</p>
            <p className="text-sm text-muted-foreground mb-3" style={{ fontFamily: '"Tajawal", sans-serif' }}>اتجاه القبلة من موقعك</p>
            <p className="text-5xl font-black text-primary">{Math.round(qiblaAngle)}°</p>
            <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>شمالاً</p>
          </div>
        </div>
      );
    }

    const needsIOSPermission =
      heading === null && typeof (DeviceOrientationEvent as any).requestPermission === 'function';

    if (needsIOSPermission) {
      return (
        <div className="flex flex-col items-center gap-5 w-full max-w-xs text-center">
          <KaabaIcon size={72}/>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 w-full">
            <p className="font-bold text-amber-600 mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>تفعيل البوصلة</p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              اضغط للسماح بالوصول لحساس الاتجاه
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-primary text-primary-foreground"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            تفعيل البوصلة
          </button>
        </div>
      );
    }

    /* ── Full compass ────────────────────────────────────────── */
    return (
      <div className="flex flex-col items-center gap-6 w-full">

        {/* Status badge */}
        <div className={`px-6 py-3 rounded-2xl text-center transition-all duration-500 ${
          isAligned
            ? 'bg-green-500/15 border border-green-500/40'
            : 'bg-card border border-border'
        }`}>
          {isAligned ? (
            <p className="font-bold text-base text-green-600 dark:text-green-400" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              أنت في اتجاه القبلة ✓
            </p>
          ) : isSearching ? (
            <p className="font-bold text-sm text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              جاري البحث عن اتجاه القبلة...
            </p>
          ) : (
            <div>
              <p className="font-bold text-sm text-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                وجّه هاتفك نحو الكعبة المشرفة
              </p>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                القبلة على بُعد {Math.round(qiblaAngle)}° من الشمال
              </p>
            </div>
          )}
        </div>

        {/* Compass ring */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>

          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              boxShadow: isAligned
                ? '0 0 0 3px rgba(74,222,128,0.6), 0 0 48px rgba(74,222,128,0.2)'
                : '0 0 0 2px rgba(193,154,107,0.3), 0 0 28px rgba(193,154,107,0.07)',
            }}
          />

          {/* Static compass face with degree numbers */}
          <CompassFace isAligned={isAligned} />

          {/* Kaaba fixed at 12 o'clock */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              filter: isAligned
                ? 'drop-shadow(0 0 10px rgba(74,222,128,0.8))'
                : 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
              transition: 'filter 0.5s',
            }}
          >
            <KaabaIcon size={40} glow={isAligned} />
          </div>

          {/* Rotating arrow — points toward Qibla */}
          <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 ${isSearching ? 'animate-spin' : ''}`}
            style={isSearching ? { animationDuration: '1.8s' } : {
              transform: `rotate(${arrowAngle}deg)`,
              transition: heading !== null ? 'transform 0.15s ease-out' : 'none',
            }}
          >
            <QiblaArrow isAligned={isAligned} isSearching={isSearching} />
          </div>

          {/* Center pivot dot */}
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div
              className="w-4 h-4 rounded-full transition-all duration-500"
              style={{
                background: isAligned ? '#4ade80' : 'var(--primary)',
                border: '3px solid var(--background)',
                boxShadow: isAligned
                  ? '0 0 12px rgba(74,222,128,0.9)'
                  : '0 0 7px rgba(193,154,107,0.5)',
              }}
            />
          </div>
        </div>

        {/* Coordinates */}
        {coords && (
          <p className="text-xs text-muted-foreground/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            موقعك: {coords.lat.toFixed(4)}°، {coords.lng.toFixed(4)}°
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col max-w-lg mx-auto bg-background" dir="rtl">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-card shadow-sm border-b border-border flex-shrink-0">
        <Link href="/more">
          <button className="p-2 bg-secondary rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="font-bold text-xl" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          تحديد القبلة
        </h1>
        {(geoError || (!geoLoading && !coords)) && (
          <button
            onClick={requestLocation}
            className="mr-auto p-2 rounded-full bg-secondary"
            title="إعادة المحاولة"
          >
            <RotateCcw className="w-4 h-4 text-primary"/>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">
        {renderContent()}
      </div>
    </div>
  );
}
