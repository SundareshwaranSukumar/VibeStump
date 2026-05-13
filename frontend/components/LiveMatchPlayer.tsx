'use client';

export default function LiveMatchPlayer() {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 relative group">
      {/* This mimics the central broadcast feed without needing an actual stream */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-10" />
      
      {/* Placeholder content since we don't have a real live stream URL */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0B172A]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[rgb(var(--color-primary))] border-r-[rgb(var(--color-primary))] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white/80 uppercase tracking-widest">Live Feed Initializing</h2>
          <p className="text-sm text-white/40 mt-2">Connecting to host broadcaster...</p>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]" />
        <span className="font-bold text-white uppercase text-sm drop-shadow-md">LIVE</span>
      </div>
      
      <div className="absolute top-4 right-4 z-20">
        <span className="bg-black/50 backdrop-blur-md text-white/80 px-3 py-1 rounded text-xs font-bold border border-white/10 uppercase tracking-widest">
          Camera 1
        </span>
      </div>
    </div>
  );
}
