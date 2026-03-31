import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onDone: () => void;
}

/* ══════════════════════════════════════════════════════
   REALISTIC 3-D MOSQUE ENTRANCE SVG
   Light source: top-centre, slightly left
   Style: Moroccan / Andalusian
   ══════════════════════════════════════════════════════ */
function MosqueEntrance3D() {
  const W = 340;
  const H = 430;
  const cx = W / 2;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* ── Stone / sandstone wall texture ── */}
        <pattern id="stone" x="0" y="0" width="36" height="22" patternUnits="userSpaceOnUse">
          <rect width="36" height="22" fill="#2a1f0e" />
          <rect x="0.5" y="0.5" width="34" height="10" rx="0.5" fill="#2e2210" stroke="#1a140a" strokeWidth="0.4" />
          <rect x="0.5" y="11.5" width="34" height="9.5" rx="0.5" fill="#261d0c" stroke="#1a140a" strokeWidth="0.4" />
          {/* mortar highlights */}
          <line x1="0" y1="0" x2="36" y2="0" stroke="rgba(193,154,107,0.07)" strokeWidth="0.3" />
          <line x1="0" y1="11" x2="36" y2="11" stroke="rgba(193,154,107,0.07)" strokeWidth="0.3" />
        </pattern>

        {/* Offset stone for alternating courses */}
        <pattern id="stone2" x="18" y="0" width="36" height="22" patternUnits="userSpaceOnUse">
          <rect width="36" height="22" fill="#2a1f0e" />
          <rect x="0.5" y="0.5" width="34" height="10" rx="0.5" fill="#2e2210" stroke="#1a140a" strokeWidth="0.4" />
          <rect x="0.5" y="11.5" width="34" height="9.5" rx="0.5" fill="#261d0c" stroke="#1a140a" strokeWidth="0.4" />
          <line x1="0" y1="0" x2="36" y2="0" stroke="rgba(193,154,107,0.07)" strokeWidth="0.3" />
          <line x1="0" y1="11" x2="36" y2="11" stroke="rgba(193,154,107,0.07)" strokeWidth="0.3" />
        </pattern>

        {/* ── Marble / polished stone for arch face ── */}
        <linearGradient id="archFaceGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#1c1409" />
          <stop offset="18%" stopColor="#3d2e18" />
          <stop offset="40%" stopColor="#4a3820" />
          <stop offset="60%" stopColor="#3d2e18" />
          <stop offset="82%" stopColor="#2a1e0d" />
          <stop offset="100%" stopColor="#160f06" />
        </linearGradient>

        {/* ── Gold gradients ── */}
        <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFF3CC" />
          <stop offset="25%"  stopColor="#E8C97A" />
          <stop offset="55%"  stopColor="#C19A6B" />
          <stop offset="100%" stopColor="#6B4A28" />
        </linearGradient>
        <linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#5a3a18" />
          <stop offset="30%"  stopColor="#C19A6B" />
          <stop offset="50%"  stopColor="#FFE4A0" />
          <stop offset="70%"  stopColor="#C19A6B" />
          <stop offset="100%" stopColor="#5a3a18" />
        </linearGradient>
        <linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7a5030" />
          <stop offset="40%"  stopColor="#E8C97A" />
          <stop offset="60%"  stopColor="#FFF0C0" />
          <stop offset="100%" stopColor="#9a6a40" />
        </linearGradient>

        {/* ── Column: 3D cylinder illusion ── */}
        <linearGradient id="colLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#0e0a04" />
          <stop offset="15%"  stopColor="#2a1e0e" />
          <stop offset="40%"  stopColor="#4a3820" />
          <stop offset="60%"  stopColor="#3d2e16" />
          <stop offset="80%"  stopColor="#1e1609" />
          <stop offset="100%" stopColor="#100c05" />
        </linearGradient>
        <linearGradient id="colRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#100c05" />
          <stop offset="20%"  stopColor="#1e1609" />
          <stop offset="40%"  stopColor="#3d2e16" />
          <stop offset="60%"  stopColor="#4a3820" />
          <stop offset="85%"  stopColor="#2a1e0e" />
          <stop offset="100%" stopColor="#0e0a04" />
        </linearGradient>

        {/* ── Arch interior depth ── */}
        <radialGradient id="archDepth" cx="50%" cy="35%" r="55%">
          <stop offset="0%"   stopColor="#1a1206" stopOpacity="0.4" />
          <stop offset="70%"  stopColor="#080603" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#030201" stopOpacity="0.97" />
        </radialGradient>

        {/* ── Inner light (lamp glow) ── */}
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFE4A0" stopOpacity="0.55" />
          <stop offset="40%"  stopColor="#C19A6B" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#C19A6B" stopOpacity="0" />
        </radialGradient>

        {/* ── Drop shadow filter ── */}
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.7" />
        </filter>
        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#C19A6B" floodOpacity="0.6" />
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#C19A6B" floodOpacity="0.25" />
        </filter>
        <filter id="noorGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="8"  floodColor="#FFE4A0" floodOpacity="0.7" />
          <feDropShadow dx="0" dy="0" stdDeviation="20" floodColor="#C19A6B" floodOpacity="0.4" />
        </filter>
        <filter id="domeGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#C19A6B" floodOpacity="0.5" />
        </filter>

        {/* Clip paths */}
        <clipPath id="archClip">
          <path d={`M ${cx-82},${H-32} L ${cx-82},195
            C ${cx-82},130 ${cx},80 ${cx},80
            C ${cx},80 ${cx+82},130 ${cx+82},195
            L ${cx+82},${H-32} Z`} />
        </clipPath>
        <clipPath id="archFaceClip">
          <rect x="0" y="50" width={W} height={H} />
        </clipPath>
      </defs>

      {/* ══════════════════════════════════
          1. MAIN WALL (stone texture)
          ══════════════════════════════════ */}
      <rect x="0" y="60" width={W} height={H - 60} fill="url(#stone)" />
      {/* Wall top-lighting gradient overlay */}
      <rect x="0" y="60" width={W} height={H - 60}
        fill="url(#archFaceGrad)" opacity="0.55" />
      {/* Subtle ambient occlusion at sides */}
      <rect x="0" y="60" width="40" height={H}
        fill="black" opacity="0.3" />
      <rect x={W - 40} y="60" width="40" height={H}
        fill="black" opacity="0.3" />

      {/* ══════════════════════════════════
          2. DECORATIVE RECESSED PANELS (side walls)
          ══════════════════════════════════ */}
      {/* Left panels */}
      {[130, 200, 275, 348].map((y, i) => (
        <g key={`lp-${i}`}>
          <rect x="8" y={y} width="52" height="54" rx="2"
            fill="#1e1608" stroke="rgba(193,154,107,0.18)" strokeWidth="0.8" />
          <rect x="11" y={y + 3} width="46" height="48" rx="1.5"
            fill="none" stroke="rgba(193,154,107,0.12)" strokeWidth="0.5" />
          {/* inner pattern */}
          <line x1="20" y1={y+18} x2="52" y2={y+18} stroke="rgba(193,154,107,0.1)" strokeWidth="0.5"/>
          <line x1="20" y1={y+36} x2="52" y2={y+36} stroke="rgba(193,154,107,0.1)" strokeWidth="0.5"/>
          <line x1="34" y1={y+6} x2="34" y2={y+48} stroke="rgba(193,154,107,0.1)" strokeWidth="0.5"/>
          <rect x="29" y={y+13} width="10" height="10" rx="1"
            fill="none" stroke="rgba(193,154,107,0.2)" strokeWidth="0.7"
            transform={`rotate(45,34,${y+18})`}/>
        </g>
      ))}
      {/* Right panels (mirror) */}
      {[130, 200, 275, 348].map((y, i) => (
        <g key={`rp-${i}`}>
          <rect x={W - 60} y={y} width="52" height="54" rx="2"
            fill="#1e1608" stroke="rgba(193,154,107,0.18)" strokeWidth="0.8" />
          <rect x={W - 57} y={y + 3} width="46" height="48" rx="1.5"
            fill="none" stroke="rgba(193,154,107,0.12)" strokeWidth="0.5" />
          <line x1={W-52} y1={y+18} x2={W-16} y2={y+18} stroke="rgba(193,154,107,0.1)" strokeWidth="0.5"/>
          <line x1={W-52} y1={y+36} x2={W-16} y2={y+36} stroke="rgba(193,154,107,0.1)" strokeWidth="0.5"/>
          <line x1={W-34} y1={y+6} x2={W-34} y2={y+48} stroke="rgba(193,154,107,0.1)" strokeWidth="0.5"/>
          <rect x={W-39} y={y+13} width="10" height="10" rx="1"
            fill="none" stroke="rgba(193,154,107,0.2)" strokeWidth="0.7"
            transform={`rotate(45,${W-34},${y+18})`}/>
        </g>
      ))}

      {/* ══════════════════════════════════
          3. ARCH OPENING (deep dark interior)
          ══════════════════════════════════ */}
      <path
        d={`M ${cx-82},${H-28} L ${cx-82},195
           C ${cx-82},130 ${cx},80 ${cx},80
           C ${cx},80 ${cx+82},130 ${cx+82},195
           L ${cx+82},${H-28} Z`}
        fill="url(#archDepth)"
      />
      {/* Lamp glow inside */}
      <ellipse cx={cx} cy={200} rx={68} ry={90}
        fill="url(#lampGlow)" />

      {/* ══════════════════════════════════
          4. ARCH MOULDING (multi-step 3D bevel)
          Outermost → innermost, each slightly smaller
          ══════════════════════════════════ */}
      {[
        { ox: 94, col: 'rgba(193,154,107,0.75)', sw: 2.5 },
        { ox: 88, col: 'rgba(193,154,107,0.55)', sw: 1.8 },
        { ox: 82, col: 'rgba(255,228,160,0.85)', sw: 2.0 },
      ].map(({ ox, col, sw }, idx) => (
        <path key={`arch-${idx}`}
          d={`M ${cx - ox},${H - 28} L ${cx - ox},${192 + (ox - 82) * 0.6}
             C ${cx - ox},${128 + (ox - 82) * 0.6} ${cx},${76 + (ox - 82) * 0.6} ${cx},${76 + (ox - 82) * 0.6}
             C ${cx},${76 + (ox - 82) * 0.6} ${cx + ox},${128 + (ox - 82) * 0.6} ${cx + ox},${192 + (ox - 82) * 0.6}
             L ${cx + ox},${H - 28}`}
          fill="none"
          stroke={col}
          strokeWidth={sw}
          filter={idx === 2 ? 'url(#goldGlow)' : undefined}
        />
      ))}

      {/* ══════════════════════════════════
          5. ARCH FACE CLADDING (stone face with bevel)
          ══════════════════════════════════ */}
      {/* Left face of arch jamb */}
      <path
        d={`M ${cx - 105},${H - 28} L ${cx - 105},200
           C ${cx - 105},125 ${cx},70 ${cx},70
           L ${cx},80
           C ${cx},80 ${cx - 94},130 ${cx - 94},195
           L ${cx - 94},${H - 28} Z`}
        fill="url(#archFaceGrad)"
        opacity="0.9"
      />
      {/* Right face */}
      <path
        d={`M ${cx + 105},${H - 28} L ${cx + 105},200
           C ${cx + 105},125 ${cx},70 ${cx},70
           L ${cx},80
           C ${cx},80 ${cx + 94},130 ${cx + 94},195
           L ${cx + 94},${H - 28} Z`}
        fill="url(#archFaceGrad)"
        opacity="0.7"
      />

      {/* ══════════════════════════════════
          6. MUQARNAS (honeycomb stalactites at arch crown)
          ══════════════════════════════════ */}
      {/* Row 1 — 5 cells */}
      {[-48, -24, 0, 24, 48].map((dx, i) => {
        const by = i === 2 ? 106 : i === 1 || i === 3 ? 112 : 119;
        return (
          <g key={`mq1-${i}`}>
            <path
              d={`M ${cx + dx - 12},${by} L ${cx + dx},${by - 14} L ${cx + dx + 12},${by}
                 L ${cx + dx + 8},${by + 12} L ${cx + dx - 8},${by + 12} Z`}
              fill={`rgba(${i===2?'255,228,160':'193,154,107'},0.28)`}
              stroke="rgba(193,154,107,0.5)"
              strokeWidth="0.7"
            />
            <path
              d={`M ${cx + dx},${by - 14} L ${cx + dx},${by + 12}`}
              stroke="rgba(193,154,107,0.3)" strokeWidth="0.4"
            />
          </g>
        );
      })}
      {/* Row 2 — 4 cells between row 1 */}
      {[-36, -12, 12, 36].map((dx, i) => (
        <g key={`mq2-${i}`}>
          <path
            d={`M ${cx + dx - 12},128 L ${cx + dx},114 L ${cx + dx + 12},128
               L ${cx + dx + 8},140 L ${cx + dx - 8},140 Z`}
            fill="rgba(193,154,107,0.2)"
            stroke="rgba(193,154,107,0.4)"
            strokeWidth="0.6"
          />
        </g>
      ))}
      {/* Row 3 — 3 cells */}
      {[-24, 0, 24].map((dx, i) => (
        <g key={`mq3-${i}`}>
          <path
            d={`M ${cx + dx - 12},150 L ${cx + dx},136 L ${cx + dx + 12},150
               L ${cx + dx + 8},162 L ${cx + dx - 8},162 Z`}
            fill={`rgba(193,154,107,${i===1?0.25:0.15})`}
            stroke="rgba(193,154,107,0.35)"
            strokeWidth="0.6"
          />
        </g>
      ))}
      {/* Gold highlight band above muqarnas */}
      <rect x={cx - 105} y={94} width={210} height={4} rx={1}
        fill="url(#goldH)" opacity={0.7} />

      {/* ══════════════════════════════════
          7. ZELLIGE TILE BAND (geometric tilework frieze)
          ══════════════════════════════════ */}
      <rect x={cx - 105} y={165} width={210} height={18}
        fill="#1a1206" stroke="rgba(193,154,107,0.3)" strokeWidth="0.5" />
      {Array.from({ length: 14 }, (_, i) => (
        <g key={`zel-${i}`}>
          <rect
            x={cx - 104 + i * 15} y={166}
            width={13} height={16} rx={0.5}
            fill="none"
            stroke="rgba(193,154,107,0.4)" strokeWidth="0.5"
          />
          <rect
            x={cx - 101 + i * 15} y={169}
            width={7} height={7}
            fill="rgba(193,154,107,0.15)"
            stroke="rgba(193,154,107,0.35)" strokeWidth="0.4"
            transform={`rotate(45,${cx - 97.5 + i * 15},172.5)`}
          />
        </g>
      ))}

      {/* ══════════════════════════════════
          8. COLUMNS (realistic 3-D cylinder illusion)
          ══════════════════════════════════ */}
      {/* Left column body */}
      <rect x={cx - 120} y={165} width={28} height={H - 195} rx={1}
        fill="url(#colLeft)" />
      {/* Column highlight stripe */}
      <rect x={cx - 110} y={165} width={5} height={H - 195}
        fill="white" opacity={0.05} />
      {/* Left capital (Corinthian-style step) */}
      <rect x={cx - 124} y={158} width={36} height={9} rx={1.5}
        fill="url(#goldH)" filter="url(#shadow)" />
      <rect x={cx - 120} y={155} width={28} height={6} rx={1}
        fill="url(#goldHL)" />
      {/* Left base */}
      <rect x={cx - 126} y={H - 32} width={40} height={8} rx={1.5}
        fill="url(#goldH)" />
      <rect x={cx - 122} y={H - 26} width={32} height={5} rx={1}
        fill="url(#goldHL)" />
      {/* Column shadow cast on wall */}
      <rect x={cx - 92} y={165} width={12} height={H - 195}
        fill="black" opacity={0.22} />

      {/* Right column body */}
      <rect x={cx + 92} y={165} width={28} height={H - 195} rx={1}
        fill="url(#colRight)" />
      <rect x={cx + 115} y={165} width={5} height={H - 195}
        fill="white" opacity={0.05} />
      <rect x={cx + 88} y={158} width={36} height={9} rx={1.5}
        fill="url(#goldH)" filter="url(#shadow)" />
      <rect x={cx + 92} y={155} width={28} height={6} rx={1}
        fill="url(#goldHL)" />
      <rect x={cx + 86} y={H - 32} width={40} height={8} rx={1.5}
        fill="url(#goldH)" />
      <rect x={cx + 90} y={H - 26} width={32} height={5} rx={1}
        fill="url(#goldHL)" />
      {/* Column shadow cast on wall */}
      <rect x={cx + 80} y={165} width={12} height={H - 195}
        fill="black" opacity={0.22} />

      {/* ══════════════════════════════════
          9. OUTER ARCH MOULDING (above columns)
          ══════════════════════════════════ */}
      {/* Extrados decorative band */}
      <path
        d={`M ${cx - 108},165 C ${cx - 108},98 ${cx},52 ${cx},52
           C ${cx},52 ${cx + 108},98 ${cx + 108},165`}
        fill="none"
        stroke="url(#goldV)"
        strokeWidth="3"
        filter="url(#goldGlow)"
        strokeLinecap="round"
      />
      {/* Second arch moulding line */}
      <path
        d={`M ${cx - 100},165 C ${cx - 100},105 ${cx},60 ${cx},60
           C ${cx},60 ${cx + 100},105 ${cx + 100},165`}
        fill="none"
        stroke="rgba(193,154,107,0.4)"
        strokeWidth="1.2"
      />

      {/* ══════════════════════════════════
          10. ARABESQUE SPANDREL ORNAMENTS
          (decorative roundels in the tympanum)
          ══════════════════════════════════ */}
      {/* Left spandrel medallion */}
      <circle cx={cx - 75} cy={138} r={18}
        fill="none" stroke="rgba(193,154,107,0.3)" strokeWidth="0.8" />
      <circle cx={cx - 75} cy={138} r={12}
        fill="none" stroke="rgba(193,154,107,0.22)" strokeWidth="0.6" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <circle key={`ls-${i}`}
            cx={cx - 75 + Math.cos(a) * 12}
            cy={138 + Math.sin(a) * 12}
            r={2.5}
            fill="rgba(193,154,107,0.25)"
          />
        );
      })}
      <circle cx={cx - 75} cy={138} r={4}
        fill="rgba(193,154,107,0.3)" />

      {/* Right spandrel medallion */}
      <circle cx={cx + 75} cy={138} r={18}
        fill="none" stroke="rgba(193,154,107,0.3)" strokeWidth="0.8" />
      <circle cx={cx + 75} cy={138} r={12}
        fill="none" stroke="rgba(193,154,107,0.22)" strokeWidth="0.6" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <circle key={`rs-${i}`}
            cx={cx + 75 + Math.cos(a) * 12}
            cy={138 + Math.sin(a) * 12}
            r={2.5}
            fill="rgba(193,154,107,0.25)"
          />
        );
      })}
      <circle cx={cx + 75} cy={138} r={4}
        fill="rgba(193,154,107,0.3)" />

      {/* ══════════════════════════════════
          11. DOME + FINIAL above arch
          ══════════════════════════════════ */}
      {/* Drum (cylindrical base of dome) */}
      <rect x={cx - 22} y={28} width={44} height={28} rx={2}
        fill="#1e1608" stroke="rgba(193,154,107,0.4)" strokeWidth="0.8" />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`drum-${i}`} x={cx - 20 + i * 9} y={30} width={7} height={24} rx={1}
          fill="none" stroke="rgba(193,154,107,0.22)" strokeWidth="0.5" />
      ))}
      {/* Dome body */}
      <path
        d={`M ${cx - 28},28 Q ${cx - 28},0 ${cx},0 Q ${cx + 28},0 ${cx + 28},28`}
        fill="#1e1608"
        stroke="rgba(193,154,107,0.5)"
        strokeWidth="1"
        filter="url(#domeGlow)"
      />
      {/* Dome highlight (left-side light) */}
      <path
        d={`M ${cx - 20},28 Q ${cx - 20},8 ${cx - 4},2`}
        fill="none"
        stroke="rgba(255,228,160,0.18)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Dome gold rib lines */}
      {[-14, -7, 0, 7, 14].map((dx, i) => (
        <path key={`rib-${i}`}
          d={`M ${cx + dx},28 Q ${cx + dx * 0.3},${ 6 } ${cx},0`}
          fill="none"
          stroke={`rgba(193,154,107,${i === 2 ? 0.55 : 0.22})`}
          strokeWidth="0.6"
        />
      ))}
      {/* Finial shaft */}
      <line x1={cx} y1="0" x2={cx} y2={-16}
        stroke="url(#goldV)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Crescent */}
      <path
        d={`M ${cx - 7},${-22} A 8,8 0 0,1 ${cx + 7},${-22}
           A 5,5 0 0,0 ${cx - 7},${-22} Z`}
        fill="#C19A6B"
        filter="url(#goldGlow)"
      />
      {/* Star above crescent */}
      <circle cx={cx} cy={-30} r={2.5}
        fill="#FFE4A0"
        filter="url(#goldGlow)"
      />

      {/* ══════════════════════════════════
          12. نور — glowing inside the arch
          ══════════════════════════════════ */}
      <text
        x={cx}
        y={252}
        textAnchor="middle"
        fontFamily='"Amiri", "Scheherazade New", serif'
        fontSize={62}
        fill="#E8C97A"
        filter="url(#noorGlow)"
        letterSpacing="4"
      >
        نُور
      </text>
      {/* Subtle lamp chain */}
      <line x1={cx} y1="82" x2={cx} y2="120"
        stroke="rgba(193,154,107,0.35)" strokeWidth="1"
        strokeDasharray="2,3"
      />
      <circle cx={cx} cy="122" r="4"
        fill="rgba(255,228,160,0.45)"
        filter="url(#goldGlow)"
      />

      {/* ══════════════════════════════════
          13. GROUND PLATFORM (steps)
          ══════════════════════════════════ */}
      <rect x="0" y={H - 30} width={W} height={8} rx={0}
        fill="url(#goldH)" opacity="0.55" />
      <rect x="0" y={H - 22} width={W} height={6}
        fill="url(#goldH)" opacity="0.35" />
      {/* Step highlight */}
      <rect x="0" y={H - 30} width={W} height={1.5}
        fill="rgba(255,228,160,0.4)" />

      {/* ══════════════════════════════════
          14. GLOBAL LIGHTING OVERLAY
          Top-light vignette
          ══════════════════════════════════ */}
      <radialGradient id="topLight" cx="50%" cy="0%" r="70%">
        <stop offset="0%"   stopColor="rgba(255,228,160,0.07)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
      </radialGradient>
      <rect x="0" y="0" width={W} height={H}
        fill="url(#topLight)" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   SPLASH SCREEN WRAPPER
   ══════════════════════════════════════════════════════ */
export function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'text' | 'full' | 'out'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('text'), 1000);
    const t2 = setTimeout(() => setPhase('full'), 1900);
    const t3 = setTimeout(() => setPhase('out'), 4800);
    const t4 = setTimeout(() => onDone(), 5400);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== 'out' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 36%, #1e1408 0%, #0f0a04 50%, #040302 100%)',
          }}
        >
          {/* Deep ambient glow behind the entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 0.28, scale: 1 }}
            transition={{ delay: 0.1, duration: 2.5, ease: 'easeOut' }}
            className="absolute pointer-events-none"
            style={{
              width: 480, height: 480,
              top: '5%', left: '50%', transform: 'translateX(-50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #C19A6B 0%, transparent 65%)',
              filter: 'blur(60px)',
            }}
          />
          {/* Ground reflection */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'full' ? 0.15 : 0 }}
            transition={{ duration: 1.5 }}
            className="absolute pointer-events-none"
            style={{
              width: 340, height: 80,
              bottom: '12%', left: '50%', transform: 'translateX(-50%)',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, #C19A6B 0%, transparent 70%)',
              filter: 'blur(25px)',
            }}
          />

          {/* ── Main content ── */}
          <div className="relative z-10 flex flex-col items-center" style={{ direction: 'rtl' }}>
            {/* Mosque entrance */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <MosqueEntrance3D />
            </motion.div>

            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: phase === 'text' || phase === 'full' ? 1 : 0,
                opacity: phase === 'text' || phase === 'full' ? 1 : 0,
              }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="flex items-center gap-2 mt-1"
            >
              <div style={{ width: 80, height: 1, background: 'linear-gradient(to left, rgba(193,154,107,0.75), transparent)' }} />
              <svg width={16} height={16} viewBox="0 0 20 20">
                <polygon
                  points="10,1 12.1,7.3 18.8,7.3 13.4,11.2 15.5,17.5 10,13.6 4.5,17.5 6.6,11.2 1.2,7.3 7.9,7.3"
                  fill="rgba(193,154,107,0.9)"
                />
              </svg>
              <div style={{ width: 80, height: 1, background: 'linear-gradient(to right, rgba(193,154,107,0.75), transparent)' }} />
            </motion.div>

            {/* بسم الله الرحمن الرحيم */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{
                opacity: phase === 'text' || phase === 'full' ? 1 : 0,
                y:       phase === 'text' || phase === 'full' ? 0 : 14,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mt-3 text-center"
              style={{
                fontFamily: '"Amiri Quran", "Amiri", "Scheherazade New", serif',
                fontSize: '1.55rem',
                lineHeight: 1.8,
                color: '#F0DEBC',
                textShadow:
                  '0 0 28px rgba(193,154,107,0.65), 0 0 55px rgba(193,154,107,0.25), 0 2px 8px rgba(0,0,0,0.7)',
                letterSpacing: '0.04em',
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </motion.p>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'full' ? 0.48 : 0 }}
              transition={{ duration: 0.9 }}
              className="mt-3"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                fontSize: '0.68rem',
                color: 'rgba(193,154,107,0.85)',
                letterSpacing: '0.22em',
              }}
            >
              رفيقك الإسلامي الشامل
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
