'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

// ── Floating particle data ────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 4,
    opacity: 0.1 + Math.random() * 0.25,
  }));
}

// ── Cricket Stumps SVG ────────────────────────────────────────────────

function CricketStumps({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Bails */}
      <rect x="8" y="14" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
      <rect x="26" y="14" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
      {/* Three stumps */}
      <rect x="10" y="17" width="4" height="48" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="28" y="17" width="4" height="48" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="46" y="17" width="4" height="48" rx="2" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

// ── Live Ticker ───────────────────────────────────────────────────────

function LiveTicker() {
  return (
    <div className="flex items-center gap-3 justify-center">
      <motion.span
        className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"
        animate={{ opacity: [1, 0.2, 1], scale: [1, 1.3, 1] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      />
      <span className="text-sm font-semibold text-white/70 tracking-wide">
        CSK <span className="text-white/40 mx-1">vs</span> MI
        <span className="text-white/40 mx-2">·</span>
        <span className="text-amber-400 font-bold">Live Match in Progress</span>
      </span>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────

interface ScreenLandingProps {
  onEnter: () => void;
}

// ── Main Component ────────────────────────────────────────────────────

export default function ScreenLanding({ onEnter }: ScreenLandingProps) {
  const particles = useMemo(() => generateParticles(28), []);

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 50% 40%, #0f2a4a 0%, #020617 60%, #0a0010 100%)',
      }}
    >
      {/* ── Floating Particle Layer ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: `rgba(${p.id % 3 === 0 ? '0,240,255' : p.id % 3 === 1 ? '168,85,247' : '249,115,22'},${p.opacity})`,
              willChange: 'transform, opacity',
            }}
            animate={{
              opacity: [p.opacity, p.opacity * 0.2, p.opacity],
              scale: [1, 1.6, 1],
              y: [0, -18, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* ── Decorative Stumps — Bottom Corners ── */}
      <CricketStumps className="absolute bottom-4 left-4 w-12 h-16 opacity-30 hidden sm:block" />
      <CricketStumps className="absolute bottom-4 right-4 w-12 h-16 opacity-30 hidden sm:block" />

      {/* ── Glass Panel ── */}
      <AnimatePresence>
        <motion.div
          key="landing-panel"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          className="relative z-10 mx-4 w-full max-w-xl rounded-3xl border border-white/10 p-10 sm:p-14 text-center shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            willChange: 'transform, opacity',
          }}
        >
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-4 py-1.5">
            <span className="text-base">🏏</span>
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase">
              Indian Premier League 2026
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className="mb-2 font-black leading-none text-6xl sm:text-8xl"
            style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 50%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VibeStump
          </h1>

          {/* Sub-heading */}
          <p className="mb-8 text-xl font-medium tracking-wide text-white/60">
            Agentic Premier League
          </p>

          {/* Divider */}
          <div
            className="mx-auto mb-6 h-px w-2/3"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
            }}
          />

          {/* Live Ticker */}
          <div className="mb-8">
            <LiveTicker />
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            className="mb-5 inline-flex items-center gap-3 rounded-full px-10 py-4 text-base font-bold text-white shadow-lg transition-shadow hover:shadow-purple-500/30"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              willChange: 'transform',
            }}
          >
            Enter Stadium
            <span className="text-lg" aria-hidden="true">
              →
            </span>
          </motion.button>

          {/* Powered-by */}
          <p className="text-xs tracking-widest text-white/25 uppercase">
            Powered by Google Gemini · Real-time AI Analysis
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
