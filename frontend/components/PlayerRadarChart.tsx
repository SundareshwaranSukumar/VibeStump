'use client';

/**
 * PlayerRadarChart.tsx — Animated SVG hexagonal radar chart for player stats.
 *
 * Features:
 * • 6-axis hexagonal radar with smooth entry animation
 * • Phase splits: Powerplay | Middle Overs | Death Overs
 * • Historical matchup weakness table
 * • Fully typed TypeScript
 */

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────

type Phase = 'Powerplay' | 'Middle' | 'Death';

interface RadarAxis {
  label: string;
  powerplay: number;
  middle: number;
  death: number;
}

interface PlayerStats {
  name: string;
  team: string;
  role: string;
  axes: RadarAxis[];
  matchupWeaknesses: { bowlerType: string; economy: string; dismissals: number }[];
  phaseSplits: { phase: Phase; runs: number; sr: number; avg: number }[];
}

// ── Demo stats ────────────────────────────────────────────────────────

const KNOWN_PLAYERS: Record<string, PlayerStats> = {
  'Virat Kohli': {
    name: 'Virat Kohli', team: 'RCB', role: 'Batter',
    axes: [
      { label: 'Strike Rate', powerplay: 88, middle: 82, death: 75 },
      { label: 'Avg / Match',  powerplay: 92, middle: 87, death: 65 },
      { label: 'Boundary %',  powerplay: 70, middle: 65, death: 58 },
      { label: 'Dot Ball %',  powerplay: 35, middle: 38, death: 42 },
      { label: 'Consistency', powerplay: 95, middle: 90, death: 78 },
      { label: 'Pressure Idx',powerplay: 82, middle: 88, death: 72 },
    ],
    matchupWeaknesses: [
      { bowlerType: 'Left-arm Pace',    economy: '7.2', dismissals: 8 },
      { bowlerType: 'Off-spin',         economy: '6.8', dismissals: 6 },
      { bowlerType: 'Yorker Specialist',economy: '8.4', dismissals: 4 },
    ],
    phaseSplits: [
      { phase: 'Powerplay', runs: 892,  sr: 138.4, avg: 44.6 },
      { phase: 'Middle',    runs: 1480, sr: 125.7, avg: 52.3 },
      { phase: 'Death',     runs: 624,  sr: 148.9, avg: 28.4 },
    ],
  },
  'MS Dhoni': {
    name: 'MS Dhoni', team: 'CSK', role: 'WK-Batter',
    axes: [
      { label: 'Finishing',   powerplay: 60, middle: 75, death: 97 },
      { label: 'Keeping',     powerplay: 95, middle: 95, death: 95 },
      { label: 'Strike Rate', powerplay: 65, middle: 72, death: 92 },
      { label: 'Pressure Idx',powerplay: 78, middle: 85, death: 98 },
      { label: 'Partnership', powerplay: 70, middle: 80, death: 95 },
      { label: 'Match IQ',    powerplay: 92, middle: 92, death: 98 },
    ],
    matchupWeaknesses: [
      { bowlerType: 'Swing Bowling',economy: '5.8', dismissals: 12 },
      { bowlerType: 'Short Pitch',  economy: '6.4', dismissals: 9  },
      { bowlerType: 'Leg-spin',     economy: '7.1', dismissals: 7  },
    ],
    phaseSplits: [
      { phase: 'Powerplay', runs: 124,  sr: 112.7, avg: 18.2 },
      { phase: 'Middle',    runs: 680,  sr: 136.0, avg: 34.8 },
      { phase: 'Death',     runs: 1240, sr: 172.4, avg: 42.1 },
    ],
  },
};

function getPlayerStats(playerName: string): PlayerStats {
  if (playerName in KNOWN_PLAYERS) return KNOWN_PLAYERS[playerName];
  return {
    name: playerName, team: 'IPL', role: 'All-rounder',
    axes: [
      { label: 'Strike Rate', powerplay: 72, middle: 68, death: 80 },
      { label: 'Average',     powerplay: 68, middle: 74, death: 55 },
      { label: 'Boundary %', powerplay: 60, middle: 55, death: 65 },
      { label: 'Dot Ball %', powerplay: 38, middle: 42, death: 35 },
      { label: 'Consistency',powerplay: 70, middle: 72, death: 62 },
      { label: 'Pressure',   powerplay: 65, middle: 70, death: 75 },
    ],
    matchupWeaknesses: [
      { bowlerType: 'Left-arm Pace', economy: '7.8', dismissals: 5 },
      { bowlerType: 'Wrist Spin',    economy: '7.1', dismissals: 4 },
      { bowlerType: 'Death Yorkers', economy: '9.2', dismissals: 3 },
    ],
    phaseSplits: [
      { phase: 'Powerplay', runs: 420, sr: 128.4, avg: 32.4 },
      { phase: 'Middle',    runs: 780, sr: 118.7, avg: 38.8 },
      { phase: 'Death',     runs: 340, sr: 152.5, avg: 22.1 },
    ],
  };
}

// ── SVG helpers ───────────────────────────────────────────────────────

const N_AXES = 6;
const CX = 110;
const CY = 110;
const MAX_R = 85;

function axisPoint(idx: number, r: number) {
  const angle = (Math.PI / 3) * idx - Math.PI / 2;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function buildPoly(values: number[]): string {
  return values.map((v, i) => {
    const r = (Math.min(100, Math.max(0, v)) / 100) * MAX_R;
    const p = axisPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');
}

// ── Phase colors ──────────────────────────────────────────────────────

const PHASE_COLORS: Record<Phase, string> = {
  Powerplay: '#22c55e',
  Middle:    '#3b82f6',
  Death:     '#ef4444',
};

const PHASES: Phase[] = ['Powerplay', 'Middle', 'Death'];

// ── Component ─────────────────────────────────────────────────────────

interface PlayerRadarChartProps {
  playerName: string;
  defaultPhase?: Phase;
}

export default function PlayerRadarChart({
  playerName,
  defaultPhase = 'Powerplay',
}: PlayerRadarChartProps) {
  const [activePhase, setActivePhase] = useState<Phase>(defaultPhase);
  const stats = useMemo(() => getPlayerStats(playerName), [playerName]);

  const phaseKey = activePhase === 'Powerplay' ? 'powerplay'
    : activePhase === 'Middle' ? 'middle' : 'death';

  const values = stats.axes.map(a => a[phaseKey]);
  const phaseColor = PHASE_COLORS[activePhase];
  const phaseSplit = stats.phaseSplits.find(p => p.phase === activePhase) ?? stats.phaseSplits[0];

  const polyPoints = buildPoly(values);
  const avgScore = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return (
    <div className="w-full space-y-4">

      {/* Phase toggle */}
      <div className="flex gap-2 justify-center">
        {PHASES.map(p => (
          <button
            key={p}
            onClick={() => setActivePhase(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${
              activePhase === p
                ? 'text-white border-transparent scale-105'
                : 'text-white/50 border-white/10 hover:border-white/30'
            }`}
            style={activePhase === p
              ? { background: PHASE_COLORS[p], boxShadow: `0 0 14px ${PHASE_COLORS[p]}66` }
              : {}
            }
          >
            {p}
          </button>
        ))}
      </div>

      {/* Hexagonal radar SVG */}
      <div className="flex justify-center">
        <svg viewBox="0 0 220 220" width="220" height="220" className="overflow-visible">

          {/* Grid rings at 20%, 40%, 60%, 80%, 100% */}
          {[20, 40, 60, 80, 100].map(pct => {
            const r = (pct / 100) * MAX_R;
            const pts = Array.from({ length: N_AXES }, (_, i) => axisPoint(i, r));
            return (
              <polygon
                key={pct}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            );
          })}

          {/* Axis spokes */}
          {stats.axes.map((_, i) => {
            const outer = axisPoint(i, MAX_R);
            return (
              <line key={i}
                x1={CX} y1={CY}
                x2={outer.x} y2={outer.y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <motion.polygon
            key={activePhase}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
            points={polyPoints}
            fill={`${phaseColor}28`}
            stroke={phaseColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Data vertex circles */}
          {values.map((v, i) => {
            const r = (Math.min(100, Math.max(0, v)) / 100) * MAX_R;
            const p = axisPoint(i, r);
            return (
              <motion.circle
                key={`${activePhase}-dot-${i}`}
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: 4.5, opacity: 1 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                cx={p.x} cy={p.y}
                fill={phaseColor}
                stroke="white"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Axis labels */}
          {stats.axes.map((axis, i) => {
            const p = axisPoint(i, MAX_R + 18);
            return (
              <text key={i}
                x={p.x} y={p.y + 4}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize="7.5"
                fontFamily="Inter, system-ui, sans-serif"
                fontWeight="600"
              >
                {axis.label}
              </text>
            );
          })}

          {/* Center score */}
          <text x={CX} y={CY - 5} textAnchor="middle"
            fill={phaseColor} fontSize="18" fontWeight="900"
            fontFamily="Inter, system-ui, sans-serif">
            {avgScore}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle"
            fill="rgba(255,255,255,0.3)" fontSize="7"
            fontFamily="Inter, system-ui, sans-serif">
            OVERALL
          </text>
        </svg>
      </div>

      {/* Phase splits summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Runs', value: phaseSplit.runs.toString() },
          { label: 'S/R',  value: phaseSplit.sr.toFixed(1) },
          { label: 'Avg',  value: phaseSplit.avg.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label}
            className="bg-white/5 rounded-xl py-3 px-2 border border-white/5 text-center"
          >
            <p className="text-[9px] text-white/40 uppercase tracking-widest">{label}</p>
            <p className="text-xl font-black mt-0.5" style={{ color: phaseColor }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Matchup weaknesses */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
          Historical Matchup Weaknesses
        </p>
        <div className="space-y-1.5">
          {stats.matchupWeaknesses.map((mw, i) => (
            <div key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.05]"
            >
              <span className="text-xs text-white/70">{mw.bowlerType}</span>
              <div className="flex gap-3 text-xs">
                <span className="text-red-400 font-bold">Eco {mw.economy}</span>
                <span className="text-white/40">{mw.dismissals} wkts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
