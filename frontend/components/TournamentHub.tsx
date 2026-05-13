'use client';

import { useVibeStore, getLogoForTeamName } from '@/lib/store';
import { useEffect, useState } from 'react';
import { fetchMatches, fetchHighlights } from '@/lib/api';

export default function TournamentHub() {
  const { demoMode, toggleDemo, resetMatch, ballCount, selectedMatchId, setSelectedMatchId } = useVibeStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);

  useEffect(() => {
    fetchMatches().then(setMatches).catch(console.error);
  }, []);

  useEffect(() => {
    const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];
    if (activeMatch) {
      fetchHighlights(`${activeMatch.title} highlights`).then((data) => {
        if (data && data.videos) setHighlights(data.videos);
      }).catch(console.error);
    }
  }, [selectedMatchId, matches]);

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
                  className={`py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all ${isActive
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
            className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${demoMode
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

      {/* Internet Feed Match Selector */}
      <div className="glass glow-border p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"
            style={{ color: 'rgb(var(--color-secondary))' }}>
            <span className="text-lg">📡</span> Match Selection
          </h3>
          <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Powered by Live Internet Feed</p>
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col p-2 gap-2 bg-black/20">
          {matches.map((m) => {
            const isSelected = selectedMatchId === m.id;
            const isLive = m.status === 'LIVE';
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMatchId(m.id)}
                className={`relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 transform ${isSelected
                    ? 'border-2 scale-[1.02] shadow-lg'
                    : 'border border-white/5 hover:border-white/20 hover:scale-[1.01] opacity-80 hover:opacity-100'
                  }`}
                style={{
                  borderColor: isSelected ? 'rgb(var(--color-primary))' : undefined,
                  background: isSelected ? 'rgba(var(--color-primary), 0.1)' : 'rgba(255,255,255,0.03)'
                }}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[rgb(var(--color-primary))] shadow-[0_0_10px_rgb(var(--color-primary))]" />
                )}

                <div className="p-3 pl-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-red-500/20 text-red-400 border border-red-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]" />
                        LIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest bg-white/10 text-white/60">
                        COMPLETED
                      </span>
                    )}
                    {/* Logos */}
                    <div className="flex -space-x-2">
                      {m.title.split(' v ').slice(0, 2).map((teamPart: string, idx: number) => (
                        <div key={idx} className="w-6 h-6 rounded-full bg-white/10 border border-white/20 p-0.5 overflow-hidden flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getLogoForTeamName(teamPart.trim())} alt="team" className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold leading-tight text-white/90">
                    {m.title}
                  </h4>
                </div>
              </div>
            );
          })}
          {matches.length === 0 && (
            <div className="flex flex-col items-center justify-center p-6 text-white/40 gap-2">
              <span className="animate-spin text-xl">⏳</span>
              <span className="text-xs tracking-wider uppercase">Scanning Internet...</span>
            </div>
          )}
        </div>
      </div>

      {/* Match Highlights */}
      {highlights.length > 0 && (
        <div className="glass glow-border p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: '#EAB308' }}>
            <span className="text-lg">▶️</span> Highlights
          </h3>
          <div className="space-y-3">
            {highlights.slice(0, 2).map((vid) => (
              <a key={vid.videoId}
                href={`https://youtube.com/watch?v=${vid.videoId}`}
                target="_blank" rel="noopener noreferrer"
                className="block group">
                <div className="relative rounded-lg overflow-hidden mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vid.thumbnail} alt={vid.title} className="w-full h-auto transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-2xl">📺</span>
                  </div>
                </div>
                <p className="text-[10px] text-white/80 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                  {vid.title}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
