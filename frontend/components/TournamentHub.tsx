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
      {/* Gamification (Fan Points & Oracle) */}
      <div className="glass glow-border p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[rgb(var(--color-primary))] opacity-10 blur-2xl rounded-full" />
        
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">
              Fan Points
            </h3>
            <div className="text-4xl font-black italic tracking-tighter glow-text">
              {useVibeStore().fanPoints}
            </div>
          </div>
          <div className="text-2xl">🔥</div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-white/80">
            Oracle Prediction
          </h4>
          <p className="text-[10px] text-white/50 mb-3">
            Predict the next ball. Win 100 points!
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {['Hype', 'High Tension', 'Calm', 'Wicket'].map(pred => {
              const currentPrediction = useVibeStore().currentPrediction;
              const setPrediction = useVibeStore().setPrediction;
              const isActive = currentPrediction === pred;
              
              return (
                <button
                  key={pred}
                  onClick={() => setPrediction(pred)}
                  className={`py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all ${
                    isActive 
                      ? 'bg-[rgb(var(--color-primary))] text-black border-[rgb(var(--color-primary))] shadow-[0_0_10px_rgba(var(--color-primary),0.5)] scale-105' 
                      : 'bg-black/40 text-white/60 border-white/10 hover:border-white/30'
                  }`}
                >
                  {pred}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="glass p-3 border border-white/10">
        <div className="flex gap-2">
          <button
            onClick={toggleDemo}
            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
              demoMode
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}
          >
            {demoMode ? 'Demo ON' : 'Live'}
          </button>
          <button
            onClick={resetMatch}
            className="flex-1 py-1.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            Reset
          </button>
        </div>
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
