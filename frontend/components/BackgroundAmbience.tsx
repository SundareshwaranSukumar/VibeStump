'use client';

import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
import { useVibeStore } from '@/lib/store';
import { useEffect, useState } from 'react';

const TEAM_VIDEOS: Record<string, string> = {
  RCB: 'https://www.youtube.com/watch?v=v29Y-V0-I-s', 
  CSK: 'https://www.youtube.com/watch?v=H8-fCPrZ4dI',
  KKR: 'https://www.youtube.com/watch?v=3j0XmZJk_uM',
  MI:  'https://www.youtube.com/watch?v=H8-fCPrZ4dI',
};

export default function BackgroundAmbience() {
  const { selectedTeam } = useVibeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const videoUrl = TEAM_VIDEOS[selectedTeam] || TEAM_VIDEOS.RCB;

  const Player = ReactPlayer as any;
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black pointer-events-none">
      <div className="absolute inset-0 opacity-20 scale-150">
        <Player
          url={videoUrl}
          playing
          loop
          muted
          width="100%"
          height="100%"
          controls={false}
        />
      </div>
      {/* Dynamic Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(var(--color-bg),0.8)] via-[rgba(var(--color-bg),0.95)] to-black" />
    </div>
  );
}
