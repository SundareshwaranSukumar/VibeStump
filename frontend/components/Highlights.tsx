'use client';

import { useVibeStore } from '@/lib/store';
import { ExternalLink, Play, Youtube } from 'lucide-react';

const MATCH_COLORS: Record<string, string> = {
  CSK: '#FACC15', MI: '#004BA0', RCB: '#E21836', KKR: '#3A225D',
  SRH: '#FF6600', GT: '#39B5E0', DC: '#004C93', LSG: '#A5F3FC',
  PBKS: '#DD1F2D', RR: '#E73895',
};

function getTeamColor(title: string): string {
  const upper = title.toUpperCase();
  for (const [code, color] of Object.entries(MATCH_COLORS)) {
    if (upper.includes(code)) return color;
  }
  return '#6366f1';
}

function isRealYouTubeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

export default function Highlights() {
  const { highlights } = useVibeStore();

  if (highlights.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4 flex items-center gap-2">
          <Youtube className="w-4 h-4" /> Match Highlights
        </h3>
        <div className="text-sm text-[rgb(var(--color-muted))] text-center py-6">
          Highlights will appear here after matches are completed.
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4 flex items-center gap-2">
        <Youtube className="w-4 h-4" /> Match Highlights
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {highlights.map((video) => {
          const accent = getTeamColor(video.title);
          const ytUrl = `https://www.youtube.com/watch?v=${video.video_id}`;
          const thumbUrl = isRealYouTubeId(video.video_id)
            ? `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`
            : '';

          return (
            <div
              key={video.video_id}
              className="rounded-2xl overflow-hidden border transition-all hover:scale-[1.02] group"
              style={{
                borderColor: `${accent}33`,
                background: `linear-gradient(135deg, ${accent}11, rgba(var(--color-surface),0.6))`,
              }}
            >
              {/* Thumbnail / placeholder */}
              <div className="relative aspect-video flex items-center justify-center overflow-hidden bg-black/30">
                {thumbUrl && (
                  /* eslint-disable @next/next/no-img-element */
                  <img
                    src={thumbUrl}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                {/* Play icon overlay */}
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: `${accent}cc` }}
                >
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Info row */}
              <div className="p-3 flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-[rgb(var(--color-text))] line-clamp-2 leading-relaxed flex-1">
                  {video.title}
                </p>
                {isRealYouTubeId(video.video_id) && (
                  <a
                    href={ytUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
                    style={{ color: accent, background: `${accent}22` }}
                    title="Watch on YouTube"
                  >
                    <ExternalLink className="w-3 h-3" />
                    YouTube
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
