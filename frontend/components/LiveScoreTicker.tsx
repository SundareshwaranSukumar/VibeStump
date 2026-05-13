'use client';

interface ScoreData {
  runs: number;
  wickets: number;
  overs: number;
  run_rate: number;
  target: number | string;
  batting: string;
  bowling: string;
  required_rate?: number;
}

export default function LiveScoreTicker({ score }: { score: ScoreData | null }) {
  if (!score) {
    return (
      <div className="w-full flex justify-center mt-6">
        <div className="glass px-8 py-4 rounded-xl flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-t-[rgb(var(--color-primary))] rounded-full animate-spin" />
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Initializing Match Feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 mb-2">
      {/* Broadcast Score Bug */}
      <div className="flex overflow-hidden rounded-xl" style={{ 
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(var(--color-primary), 0.15)',
        border: '1px solid rgba(var(--color-primary), 0.3)'
      }}>
        
        {/* Batting Team Box */}
        <div className="relative w-40 flex items-center justify-center bg-gradient-to-br from-[rgb(var(--color-bg))] to-[rgb(var(--color-surface))] border-r border-white/10">
          <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)', animation: 'shine 4s infinite' }} />
          <h2 className="text-3xl font-black italic tracking-tighter" style={{ color: 'rgb(var(--color-primary))', textShadow: '0 0 20px rgba(var(--color-primary),0.5)' }}>
            {score.batting}
          </h2>
        </div>

        {/* Main Score Area */}
        <div className="flex-1 bg-gradient-to-b from-[#0F172A] to-[#020617] flex items-center justify-between px-8 py-3 relative">
          {/* Neon Top Border */}
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, rgb(var(--color-primary)), transparent)' }} />

          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              {score.runs}
            </span>
            <span className="text-2xl font-bold text-white/50">-</span>
            <span className="text-4xl font-bold" style={{ color: '#EF4444', textShadow: '0 0 15px rgba(239,68,68,0.5)' }}>
              {score.wickets}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Overs</span>
            <span className="text-2xl font-bold text-white tracking-tight">{score.overs}</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Target: {score.target}</span>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase text-white/40 block">CRR</span>
                <span className="text-sm font-bold" style={{ color: 'rgb(var(--color-secondary))' }}>{score.run_rate}</span>
              </div>
              {score.required_rate ? (
                <div className="text-right border-l border-white/10 pl-3">
                  <span className="text-[10px] uppercase text-white/40 block">RRR</span>
                  <span className="text-sm font-bold text-red-400">{score.required_rate}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bowling Team Box */}
        <div className="w-24 flex items-center justify-center bg-[#0B172A] border-l border-white/10">
          <h2 className="text-xl font-black italic tracking-tighter text-white/40">
            {score.bowling}
          </h2>
        </div>

      </div>

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          20%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
