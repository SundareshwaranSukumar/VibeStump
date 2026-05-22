'use client';

/**
 * IsometricStadium.tsx — Pure SVG pseudo-3D isometric cricket stadium.
 *
 * Features:
 * • Isometric cricket ground with pitch, boundary, pavilion, and stands
 * • `#player-jersey` node receives conditional CSS fill for team tints
 * • Hardware-accelerated with will-change: transform
 */

interface IsometricStadiumProps {
  jerseyColor?: string;
  className?: string;
}

export default function IsometricStadium({
  jerseyColor = '#FCE300',
  className = '',
}: IsometricStadiumProps) {
  return (
    <svg
      viewBox="0 0 600 420"
      className={`w-full h-auto ${className}`}
      style={{ willChange: 'transform', filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.6))' }}
      aria-label="Isometric cricket stadium"
    >
      <defs>
        {/* Grass gradient */}
        <radialGradient id="grassGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a5c2a" />
          <stop offset="60%" stopColor="#145020" />
          <stop offset="100%" stopColor="#0d3a17" />
        </radialGradient>
        {/* Pitch gradient */}
        <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4a35a" />
          <stop offset="100%" stopColor="#a07c3a" />
        </linearGradient>
        {/* Stand gradient */}
        <linearGradient id="standGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        {/* Light gradient for stands faces */}
        <linearGradient id="standFace" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        {/* Jersey fill with dynamic color */}
        <style>{`
          #player-jersey { fill: ${jerseyColor}; transition: fill 0.5s ease; }
          #player-jersey-2 { fill: ${jerseyColor}; transition: fill 0.5s ease; opacity: 0.9; }
          .stand-seat { fill: rgba(255,255,255,0.07); }
          .crowd-dot { fill: rgba(255,255,255,0.3); }
        `}</style>
      </defs>

      {/* ── Outer boundary (isometric ellipse) ────────────────────── */}
      <ellipse cx="300" cy="230" rx="240" ry="145" fill="url(#grassGrad)" stroke="#0d3a17" strokeWidth="2" />

      {/* ── Inner circle / 30-yard ─────────────────────────────────── */}
      <ellipse cx="300" cy="228" rx="130" ry="78" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="6 4" />

      {/* ── Pitch rectangle (isometric) ───────────────────────────── */}
      <path
        d="M 284 175 L 316 175 L 316 285 L 284 285 Z"
        fill="url(#pitchGrad)"
        stroke="#8a6520"
        strokeWidth="0.8"
      />
      {/* Crease lines */}
      <line x1="282" y1="195" x2="318" y2="195" stroke="white" strokeWidth="1.5" opacity="0.9" />
      <line x1="282" y1="265" x2="318" y2="265" stroke="white" strokeWidth="1.5" opacity="0.9" />

      {/* ── Stumps (batting end) ──────────────────────────────────── */}
      <g transform="translate(295, 185)">
        <rect x="0" y="-14" width="2" height="14" fill="#e2c97e" rx="0.5" />
        <rect x="4" y="-16" width="2" height="16" fill="#e2c97e" rx="0.5" />
        <rect x="8" y="-14" width="2" height="14" fill="#e2c97e" rx="0.5" />
        {/* Bails */}
        <rect x="0" y="-15" width="10" height="1.5" fill="#f5d78e" rx="0.5" />
      </g>

      {/* ── Stumps (bowling end) ──────────────────────────────────── */}
      <g transform="translate(295, 271)">
        <rect x="0" y="0" width="2" height="14" fill="#e2c97e" rx="0.5" />
        <rect x="4" y="0" width="2" height="16" fill="#e2c97e" rx="0.5" />
        <rect x="8" y="0" width="2" height="14" fill="#e2c97e" rx="0.5" />
        <rect x="0" y="13" width="10" height="1.5" fill="#f5d78e" rx="0.5" />
      </g>

      {/* ── Player silhouettes ────────────────────────────────────── */}
      {/* Batsman (batting end) */}
      <g id="player-jersey" transform="translate(288, 198)">
        {/* Body */}
        <ellipse cx="8" cy="0" rx="7" ry="9" />
        {/* Head */}
        <circle cx="8" cy="-13" r="5" fill="#f5c5a0" />
        {/* Helmet */}
        <path d="M 3 -16 Q 8 -22 13 -16" fill={jerseyColor} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
        {/* Bat */}
        <rect x="14" y="-6" width="3" height="18" rx="1.5" fill="#c4a35a" transform="rotate(15, 15, 0)" />
      </g>

      {/* Bowler (bowling end) */}
      <g id="player-jersey-2" transform="translate(290, 252)">
        <ellipse cx="8" cy="0" rx="6" ry="8" />
        <circle cx="8" cy="-11" r="4" fill="#f5c5a0" />
        {/* Ball */}
        <circle cx="18" cy="-8" r="3" fill="#dc2626" />
        <line x1="9" y1="-5" x2="18" y2="-8" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
      </g>

      {/* ── North Stand (top) ─────────────────────────────────────── */}
      {/* Stand roof */}
      <path d="M 120 100 L 480 100 L 510 68 L 90 68 Z" fill="url(#standGrad)" stroke="#334155" strokeWidth="1" />
      {/* Stand face */}
      <path d="M 120 135 L 480 135 L 480 100 L 120 100 Z" fill="url(#standFace)" />
      {/* Crowd rows */}
      {[108, 118, 128].map((y, ri) => (
        Array.from({ length: 18 }, (_, i) => (
          <circle key={`n-${ri}-${i}`} cx={130 + i * 20} cy={y} r="3.5" className="crowd-dot"
            fill={`hsl(${(ri * 120 + i * 20) % 360}, 60%, 55%)`} opacity="0.5" />
        ))
      ))}
      {/* Floodlight tower left */}
      <rect x="95" y="40" width="6" height="60" fill="#94a3b8" />
      <ellipse cx="98" cy="38" rx="18" ry="5" fill="#fbbf24" opacity="0.8" />
      {/* Floodlight tower right */}
      <rect x="499" y="40" width="6" height="60" fill="#94a3b8" />
      <ellipse cx="502" cy="38" rx="18" ry="5" fill="#fbbf24" opacity="0.8" />

      {/* ── West Stand (left) ────────────────────────────────────── */}
      <path d="M 60 155 L 110 110 L 110 320 L 60 340 Z" fill="url(#standGrad)" stroke="#1e293b" strokeWidth="1" />
      <path d="M 60 155 L 110 155 L 110 110 L 60 135 Z" fill="url(#standFace)" />
      {[140, 165, 190, 215, 240, 265, 290, 315].map((y, i) => (
        <circle key={`w-${i}`} cx={72} cy={y} r="3.5" className="crowd-dot"
          fill={`hsl(${i * 45}, 55%, 55%)`} opacity="0.4" />
      ))}

      {/* ── East Stand (right) ───────────────────────────────────── */}
      <path d="M 540 155 L 490 110 L 490 320 L 540 340 Z" fill="url(#standGrad)" stroke="#1e293b" strokeWidth="1" />
      <path d="M 540 155 L 490 155 L 490 110 L 540 135 Z" fill="url(#standFace)" />
      {[140, 165, 190, 215, 240, 265, 290, 315].map((y, i) => (
        <circle key={`e-${i}`} cx={528} cy={y} r="3.5" className="crowd-dot"
          fill={`hsl(${i * 45 + 20}, 55%, 55%)`} opacity="0.4" />
      ))}

      {/* ── South Stand (bottom, partial) ─────────────────────────── */}
      <path d="M 140 365 L 460 365 L 490 320 L 110 320 Z" fill="url(#standGrad)" stroke="#334155" strokeWidth="1" />
      {/* Bottom floodlights */}
      <rect x="112" y="290" width="5" height="35" fill="#94a3b8" />
      <ellipse cx="114" cy="288" rx="15" ry="4" fill="#fbbf24" opacity="0.6" />
      <rect x="483" y="290" width="5" height="35" fill="#94a3b8" />
      <ellipse cx="485" cy="288" rx="15" ry="4" fill="#fbbf24" opacity="0.6" />

      {/* ── Score board overlay ───────────────────────────────────── */}
      <rect x="235" y="68" width="130" height="32" rx="6"
        fill="rgba(0,0,0,0.85)" stroke="rgba(99,102,241,0.6)" strokeWidth="1.5" />
      <text x="300" y="84" textAnchor="middle" fill="#00f0ff" fontSize="11" fontWeight="bold" fontFamily="monospace">
        VIBESTUMP
      </text>
      <text x="300" y="96" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace">
        LIVE MATCH
      </text>

      {/* ── Boundary rope ─────────────────────────────────────────── */}
      <ellipse cx="300" cy="228" rx="238" ry="143" fill="none"
        stroke="white" strokeWidth="2" strokeDasharray="1 8" opacity="0.4" />
    </svg>
  );
}
