'use client';

import ReactPlayer from 'react-player';

export default function LiveMatchPlayer() {
  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/10 relative group bg-black">
      <ReactPlayer
        url="https://www.youtube.com/watch?v=v29Y-V0-I-s"
        playing={true}
        muted={true}
        width="100%"
        height="100%"
        loop={true}
        controls={false}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />
      
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_red]" />
        <span className="font-black text-white uppercase text-xs tracking-widest drop-shadow-lg">LIVE BROADCAST</span>
      </div>
      
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[8px] text-white/50 uppercase font-bold tracking-tighter">Signal Strength</span>
            <div className="flex gap-0.5 mt-0.5">
              {[1,2,3,4].map(i => <div key={i} className="w-1 h-2 bg-[rgb(var(--color-primary))] rounded-full" />)}
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-[10px] text-white/90 font-bold tracking-widest uppercase">4K Ultra HD</span>
        </div>
      </div>
    </div>
  );
}
