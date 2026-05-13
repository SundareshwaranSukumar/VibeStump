'use client';

import { useVibeStore } from '@/lib/store';

const POINTS_TABLE = [
  { team: 'GT', p: 13, w: 9, pts: 18, nrr: '+0.823' },
  { team: 'RCB', p: 13, w: 8, pts: 16, nrr: '+0.654' },
  { team: 'CSK', p: 13, w: 8, pts: 16, nrr: '+0.312' },
  { team: 'KKR', p: 13, w: 7, pts: 14, nrr: '+0.201' },
  { team: 'MI', p: 13, w: 6, pts: 12, nrr: '-0.142' },
  { team: 'SRH', p: 13, w: 6, pts: 12, nrr: '-0.311' },
];

const FIXTURES = [
  { match: 'RCB vs KKR', status: 'LIVE', time: 'NOW' },
  { match: 'GT vs SRH', status: 'completed', time: 'Yesterday' },
  { match: 'PBKS vs MI', status: 'upcoming', time: 'Tomorrow' },
];

export default function TournamentHub() {
  const { demoMode, toggleDemo, resetMatch, ballCount } = useVibeStore();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="glass glow-border p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 glow-text">
          ⚙️ Controls
        </h3>
        <button
          onClick={toggleDemo}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold mb-2 transition-all ${
            demoMode
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}
        >
          {demoMode ? '🚀 Demo Mode ON' : '📡 Live Mode'}
        </button>
        <button
          onClick={resetMatch}
          className="w-full py-2 px-3 rounded-lg text-xs font-semibold
                     bg-red-500/10 text-red-400 border border-red-500/20
                     hover:bg-red-500/20 transition-all"
        >
          🗑️ Reset Match
        </button>
        <p className="text-xs mt-2" style={{ color: 'rgba(var(--color-muted))' }}>
          Ball: {ballCount + 1}
        </p>
      </div>

      {/* Points Table */}
      <div className="glass glow-border p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: 'rgb(var(--color-secondary))' }}>
          📊 Points Table
        </h3>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'rgba(var(--color-muted))' }}>
              <th className="text-left pb-2">Team</th>
              <th className="text-center pb-2">P</th>
              <th className="text-center pb-2">W</th>
              <th className="text-center pb-2">Pts</th>
              <th className="text-right pb-2">NRR</th>
            </tr>
          </thead>
          <tbody>
            {POINTS_TABLE.map((row, i) => (
              <tr key={row.team}
                  className={`border-t border-white/5 ${i < 4 ? 'opacity-100' : 'opacity-50'}`}>
                <td className="py-1.5 font-semibold">{row.team}</td>
                <td className="text-center">{row.p}</td>
                <td className="text-center">{row.w}</td>
                <td className="text-center font-bold glow-text">{row.pts}</td>
                <td className="text-right" style={{ color: parseFloat(row.nrr) > 0 ? '#10B981' : '#EF4444' }}>
                  {row.nrr}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixtures */}
      <div className="glass glow-border p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: 'rgb(var(--color-secondary))' }}>
          📅 Fixtures
        </h3>
        <div className="space-y-2">
          {FIXTURES.map((f) => (
            <div key={f.match}
                 className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm font-medium">{f.match}</span>
              {f.status === 'LIVE' ? (
                <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'rgba(var(--color-muted))' }}>
                  {f.time}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
