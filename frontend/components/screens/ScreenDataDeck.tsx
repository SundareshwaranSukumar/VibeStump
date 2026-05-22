'use client';

/**
 * ScreenDataDeck.tsx — 3-column analytics dashboard (Screen 2).
 * Shows Scoreboard, RunsGraph, AgentCommentary, Commentary, and MatchSelector
 * with a bottom dock CTA to enter AR mode.
 */

import AgentCommentary from '@/components/AgentCommentary';
import Commentary from '@/components/Commentary';
import MatchSelector from '@/components/MatchSelector';
import RunsGraph from '@/components/RunsGraph';
import Scoreboard from '@/components/Scoreboard';
import { motion } from 'framer-motion';

// ── Batter Telemetry Card ─────────────────────────────────────────────

interface BatterMetric {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

const BATTER_METRICS: BatterMetric[] = [
  { label: 'SR', value: '142.5', sub: 'Strike Rate', color: '#22c55e' },
  { label: 'Runs', value: '48', sub: 'Current Innings', color: '#f0f0ff' },
  { label: 'Balls', value: '34', sub: 'Faced', color: '#94a3b8' },
  { label: 'Fours', value: '4', sub: 'Boundaries', color: '#3b82f6' },
  { label: 'Sixes', value: '2', sub: 'Maximums', color: '#a855f7' },
  { label: 'Dot %', value: '26.5', sub: 'Dot Ball %', color: '#f97316' },
];

function BatterTelemetryCard() {
  return (
    <div
      className="rounded-2xl border border-white/10 p-4"
      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
        Batter Telemetry
      </p>
      <div className="grid grid-cols-3 gap-2">
        {BATTER_METRICS.map((m) => (
          <motion.div
            key={m.label}
            whileHover={{ scale: 1.04 }}
            className="flex flex-col items-center rounded-xl py-2.5 px-1 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <span
              className="text-xl font-black leading-none tabular-nums"
              style={{ color: m.color ?? 'white' }}
            >
              {m.value}
            </span>
            <span className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider text-center leading-tight">
              {m.sub ?? m.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── AR Stadium Button ─────────────────────────────────────────────────

function ARDockButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full max-w-md mx-auto flex items-center justify-center gap-3 rounded-full py-4 px-8 font-bold text-white shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        willChange: 'transform',
        boxShadow: '0 4px 32px rgba(139,92,246,0.35)',
      }}
    >
      {/* Isometric pitch inline SVG */}
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" aria-hidden="true">
        {/* Pitch rectangle with perspective */}
        <rect x="9" y="7" width="10" height="14" rx="1" fill="rgba(255,255,255,0.3)" />
        {/* Perspective lines from corners to vanishing point */}
        <line x1="9" y1="7" x2="4" y2="1" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="19" y1="7" x2="24" y2="1" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1="4" y1="1" x2="24" y2="1" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
        {/* VR visor lenses */}
        <ellipse cx="9" cy="19" rx="4" ry="2.5" stroke="white" strokeWidth="1.2" strokeOpacity="0.8" fill="none" />
        <ellipse cx="19" cy="19" rx="4" ry="2.5" stroke="white" strokeWidth="1.2" strokeOpacity="0.8" fill="none" />
        <line x1="13" y1="19" x2="15" y2="19" stroke="white" strokeWidth="1" strokeOpacity="0.6" />
        {/* Stumps */}
        <line x1="12" y1="10" x2="12" y2="18" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="14" y1="9" x2="14" y2="18" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1="16" y1="10" x2="16" y2="18" stroke="white" strokeWidth="0.8" strokeOpacity="0.5" />
      </svg>
      <span className="text-base">Go Live: Augmented Reality Stand</span>
    </motion.button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────

interface ScreenDataDeckProps {
  onGoLive: () => void;
}

// ── Main Component ────────────────────────────────────────────────────

export default function ScreenDataDeck({ onGoLive }: ScreenDataDeckProps) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'rgb(var(--color-bg, 2 6 23))' }}
    >
      {/* Match Selector */}
      <div className="pt-2">
        <MatchSelector />
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4 sm:px-6 pb-32 pt-4">

        {/* ── Column 1: Scoreboard + Batter Telemetry ── */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="rounded-2xl overflow-hidden border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Scoreboard />
          </div>
          <BatterTelemetryCard />
        </motion.div>

        {/* ── Column 2: Runs Graph ── */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div
            className="rounded-2xl border border-white/10 p-4"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-pulse" />
              Live Runs Worm
            </p>
            <RunsGraph />
          </div>
        </motion.div>

        {/* ── Column 3: AgentCommentary + Commentary ── */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="rounded-2xl overflow-hidden border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <AgentCommentary />
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <Commentary />
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Fixed Dock ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3"
        style={{
          background: 'rgba(2,6,23,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <ARDockButton onClick={onGoLive} />
      </div>
    </div>
  );
}
