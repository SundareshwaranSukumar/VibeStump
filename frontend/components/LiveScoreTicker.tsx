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
      <header className="sticky top-0 z-50 glass glow-border px-6 py-3 mx-4 mt-3 rounded-2xl">
        <p className="text-center text-sm" style={{ color: 'rgba(var(--color-muted))' }}>
          ⏳ Connecting to match feed...
        </p>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 glass glow-border px-6 py-3 mx-4 mt-3 rounded-2xl">
      <div className="flex items-center justify-between">
        {/* Match Info */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(var(--color-muted))' }}>
            LIVE — Match 57
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: 'rgba(var(--color-muted))' }}>
              {score.batting}
            </p>
            <p className="text-2xl font-extrabold glow-text">
              {score.runs}/{score.wickets}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: 'rgba(var(--color-muted))' }}>
              Overs
            </p>
            <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-text))' }}>
              {score.overs}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: 'rgba(var(--color-muted))' }}>
              Run Rate
            </p>
            <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-secondary))' }}>
              {score.run_rate}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: 'rgba(var(--color-muted))' }}>
              Target
            </p>
            <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-text))' }}>
              {score.target}
            </p>
          </div>

          {score.required_rate ? (
            <div className="text-center">
              <p className="text-xs font-medium" style={{ color: 'rgba(var(--color-muted))' }}>
                Req. Rate
              </p>
              <p className="text-lg font-bold" style={{ color: '#EF4444' }}>
                {score.required_rate}
              </p>
            </div>
          ) : null}
        </div>

        {/* vs */}
        <div className="text-sm font-semibold" style={{ color: 'rgba(var(--color-muted))' }}>
          vs {score.bowling}
        </div>
      </div>

      {/* Momentum bar */}
      <div className="momentum-bar h-0.5 mt-2 rounded-full" />
    </header>
  );
}
