'use client';

import { useVibeStore } from '@/lib/store';
import dynamic from 'next/dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import('react-player') as any, { ssr: false }) as any;

export default function LiveVideoPlayer() {
  const { score } = useVibeStore();

  // Sample live YouTube video for demonstrations (replace with actual stream URL)
  const liveStreamUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

  return (
    <section className="px-4 sm:px-6 py-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="relative w-full bg-[rgba(var(--color-surface),0.4)]">
            <div className="aspect-video">
              <ReactPlayer
                url={liveStreamUrl}
                width="100%"
                height="100%"
                controls
                playing={false}
                config={{
                  youtube: {
                    playerVars: { showinfo: 1, fs: 1 }
                  }
                }}
              />
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-[rgb(var(--color-text))] uppercase tracking-wider">
                Live Stream
              </h3>
            </div>
            {score && (
              <p className="text-xs text-[rgb(var(--color-muted))] mt-2">
                {score.batting_team} vs {score.bowling_team} • {score.match_status}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
