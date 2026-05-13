'use client';

import { useVibeStore, getLogoForTeamName } from '@/lib/store';
import { useEffect, useState } from 'react';
import { fetchMatches, fetchHighlights } from '@/lib/api';

export default function TournamentHub() {
  const { demoMode, toggleDemo, resetMatch, ballCount, selectedMatchId, setSelectedMatchId } = useVibeStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [pointsTable, setPointsTable] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [selectedTeamInfo, setSelectedTeamInfo] = useState<any | null>(null);

  useEffect(() => {
    fetchMatches().then(setMatches).catch(console.error);
    fetch('/api/points-table').then(res => res.json()).then(setPointsTable).catch(console.error);
  }, []);

  useEffect(() => {
    const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];
    if (activeMatch) {
      fetchHighlights(`${activeMatch.title} highlights`).then((data) => {
        if (data && data.videos) setHighlights(data.videos);
      }).catch(console.error);
    }
  }, [selectedMatchId, matches]);

  const handleTeamClick = async (teamCode: string) => {
    try {
      const info = await (await fetch(`/api/team-info/${teamCode}`)).json();
      setSelectedTeamInfo({ code: teamCode, ...info });
    } catch (e) {
      console.error(e);
    }
  };

  const teams = [
    { code: 'RCB', name: 'Bengaluru' },
    { code: 'CSK', name: 'Chennai' },
    { code: 'KKR', name: 'Kolkata' },
    { code: 'MI', name: 'Mumbai' },
    { code: 'SRH', name: 'Hyderabad' },
    { code: 'GT', name: 'Gujarat' },
    { code: 'LSG', name: 'Lucknow' },
    { code: 'DC', name: 'Delhi' },
  ];

  return (
    <div className="space-y-4">
      {/* Gamification (Fan Points & Oracle) */}
      <div className="glass glow-border p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[rgb(var(--color-primary))] opacity-10 blur-2xl rounded-full" />
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Fan Points</h3>
            <div className="text-4xl font-black italic tracking-tighter glow-text">
              {useVibeStore().fanPoints}
            </div>
          </div>
          <div className="text-2xl">🔥</div>
        </div>
      </div>

      {/* IPL Points Table */}
      <div className="glass glow-border p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-[rgb(var(--color-primary))]">
          <span className="text-lg">🏆</span> IPL Points Table
        </h3>
        <div className="text-[10px] w-full">
          <div className="grid grid-cols-5 font-bold text-white/40 mb-2 border-b border-white/5 pb-1 uppercase">
            <div className="col-span-2">Team</div>
            <div className="text-center">P</div>
            <div className="text-center">W</div>
            <div className="text-center">Pts</div>
          </div>
          <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
            {pointsTable.map((t, idx) => (
              <div key={idx} className="grid grid-cols-5 items-center hover:bg-white/5 p-1 rounded transition-colors">
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center p-0.5">
                    <img src={getLogoForTeamName(t.team)} className="w-full h-full object-contain" />
                  </div>
                  <span className="font-bold">{t.team}</span>
                </div>
                <div className="text-center text-white/60">{t.played}</div>
                <div className="text-center text-white/60">{t.won}</div>
                <div className="text-center font-black text-[rgb(var(--color-primary))]">{t.pts}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IPL Team Gallery */}
      <div className="glass glow-border p-4">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 text-[rgb(var(--color-secondary))]">
          <span className="text-lg">🛡️</span> IPL Teams
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {teams.map((t) => (
            <button 
              key={t.code}
              onClick={() => handleTeamClick(t.code)}
              className="group flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 p-1.5 group-hover:scale-110 group-hover:border-[rgb(var(--color-primary))] transition-transform">
                <img src={getLogoForTeamName(t.code)} alt={t.name} className="w-full h-full object-contain" />
              </div>
              <span className="text-[8px] font-bold uppercase text-white/40 group-hover:text-white">{t.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team Details Modal/Overlay */}
      {selectedTeamInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
          <div className="glass glow-border p-6 max-w-md w-full relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedTeamInfo(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >✕</button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-white/10 p-3">
                <img src={getLogoForTeamName(selectedTeamInfo.code)} className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter glow-text">
                  {selectedTeamInfo.code} Details
                </h2>
                <p className="text-xs text-white/40 uppercase tracking-widest">Coach: {selectedTeamInfo.coach}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-[rgb(var(--color-primary))] uppercase mb-2">Upcoming Matches</h4>
                <div className="space-y-1">
                  {selectedTeamInfo.upcoming.map((m: string, i: number) => (
                    <div key={i} className="text-sm bg-white/5 p-2 rounded border border-white/5">{m}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-[rgb(var(--color-secondary))] uppercase mb-2">Previous Results</h4>
                <div className="space-y-1">
                  {selectedTeamInfo.previous.map((m: string, i: number) => (
                    <div key={i} className="text-sm bg-white/5 p-2 rounded border border-white/5 opacity-70">{m}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
