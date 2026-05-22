'use client';

/**
 * ScreenScout.tsx — Macro Intelligence Hub (Screen 4).
 *
 * 3-tab layout:
 *   • Standings   — IPL Points Table
 *   • Schedule    — Upcoming + Previous matches
 *   • Squads      — Teams grid + Player Radar modal
 */

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

import PlayerRadarChart from '@/components/PlayerRadarChart';
import PointsTable from '@/components/PointsTable';
import PreviousMatches from '@/components/PreviousMatches';
import TeamsGrid from '@/components/TeamsGrid';
import UpcomingMatches from '@/components/UpcomingMatches';

// ── Types ─────────────────────────────────────────────────────────────

type ScoutTab = 'standings' | 'schedule' | 'squads';

interface SelectedPlayer {
  name: string;
  team: string;
}

// ── Demo players for quick access ─────────────────────────────────────

const DEMO_PLAYERS: SelectedPlayer[] = [
  { name: 'Virat Kohli',     team: 'RCB' },
  { name: 'MS Dhoni',        team: 'CSK' },
  { name: 'Rohit Sharma',    team: 'MI'  },
  { name: 'Jos Buttler',     team: 'RR'  },
  { name: 'Shubman Gill',    team: 'GT'  },
];

const TEAM_COLORS: Record<string, string> = {
  RCB: '#E21836', CSK: '#FACC15', MI: '#004BA0', KKR: '#3A225D',
  SRH: '#FF6600', GT: '#39B5E0', DC: '#004C93', RR: '#E73895',
  LSG: '#A5F3FC', PBKS: '#DD1F2D',
};

// ── Sub-components ─────────────────────────────────────────────────────

function TabPill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
        active
          ? 'text-white bg-white/15 border border-white/20 scale-105'
          : 'text-white/40 hover:text-white/70 border border-transparent hover:border-white/10'
      }`}
      style={active ? { willChange: 'transform' } : {}}
    >
      {children}
    </button>
  );
}

// ── Player modal ───────────────────────────────────────────────────────

function PlayerModal({
  player,
  onClose,
}: {
  player: SelectedPlayer;
  onClose: () => void;
}) {
  const accentColor = TEAM_COLORS[player.team] ?? '#6366f1';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10"
        style={{ background: '#0a0f1e', willChange: 'transform' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Team color header strip */}
        <div
          className="h-2 w-full"
          style={{ background: accentColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5"
              style={{ color: accentColor }}
            >
              {player.team} · Player Analysis
            </p>
            <h2 className="text-2xl font-black text-white">{player.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Radar chart */}
        <div className="px-5 pb-4">
          <PlayerRadarChart playerName={player.name} />
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <p className="text-[9px] text-white/20 uppercase tracking-widest text-center">
            IPL Career Statistics · 2026 Season Data
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────

export default function ScreenScout() {
  const [activeTab, setActiveTab] = useState<ScoutTab>('standings');
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: 'rgb(var(--color-bg))' }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <span
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
              style={{
                color: '#a855f7',
                borderColor: 'rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.08)',
              }}
            >
              🔍 Macro Intelligence Hub
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Scout Suite
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            IPL 2026 standings, fixtures, and franchise intelligence
          </p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-3 border-b border-white/5 sticky top-0 z-30"
        style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(16px)' }}
      >
        <div className="max-w-5xl mx-auto flex gap-2">
          <TabPill active={activeTab === 'standings'} onClick={() => setActiveTab('standings')}>
            🏆 Standings
          </TabPill>
          <TabPill active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')}>
            🗓️ Schedule
          </TabPill>
          <TabPill active={activeTab === 'squads'} onClick={() => setActiveTab('squads')}>
            🏏 Squads
          </TabPill>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 py-6"
        >

          {/* Standings */}
          {activeTab === 'standings' && (
            <div>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-2xl">🏆</span>
                <div>
                  <h2 className="text-xl font-black text-white">IPL 2026 Points Table</h2>
                  <p className="text-xs text-white/40 mt-0.5">Top 4 qualify for playoffs</p>
                </div>
              </div>
              <PointsTable fullPage />
            </div>
          )}

          {/* Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-2xl">🗓️</span>
                  <div>
                    <h2 className="text-xl font-black text-white">Upcoming Fixtures</h2>
                    <p className="text-xs text-white/40 mt-0.5">Confirmed match dates and venues</p>
                  </div>
                </div>
                <UpcomingMatches fullPage />
              </div>
              <div>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h2 className="text-xl font-black text-white">Recent Results</h2>
                    <p className="text-xs text-white/40 mt-0.5">Completed matches and scorecards</p>
                  </div>
                </div>
                <PreviousMatches />
              </div>
            </div>
          )}

          {/* Squads */}
          {activeTab === 'squads' && (
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl">🏏</span>
                <div>
                  <h2 className="text-xl font-black text-white">IPL 2026 Franchises</h2>
                  <p className="text-xs text-white/40 mt-0.5">Tap any team to view squad</p>
                </div>
              </div>

              <TeamsGrid />

              {/* Quick Player Analysis demo */}
              <div
                className="mt-8 rounded-2xl border border-white/5 p-5"
                style={{ background: 'rgba(168,85,247,0.06)' }}
              >
                <p className="text-xs font-black uppercase tracking-widest text-purple-400/70 mb-3">
                  ⚡ Quick Player Intelligence
                </p>
                <p className="text-sm text-white/50 mb-4">
                  Deep-dive into any player's phase-wise metrics, matchup weaknesses, and radar profile:
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_PLAYERS.map(p => (
                    <button
                      key={p.name}
                      onClick={() => setSelectedPlayer(p)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-purple-400/40 hover:bg-white/5 transition-all text-sm text-white/70 hover:text-white"
                      style={{ willChange: 'transform' }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: TEAM_COLORS[p.team] ?? '#6366f1' }}
                      />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Player detail modal ───────────────────────────── */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
