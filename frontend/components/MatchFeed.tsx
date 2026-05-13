'use client';

import ScoreGraph from './ScoreGraph';
import TensionGauge from './TensionGauge';
import { useVibeStore } from '@/lib/store';

interface Analysis {
  tension_index: number;
  vibe_score: number;
  event_type: string;
  is_critical_event: boolean;
}

export default function MatchFeed({
  commentary,
  analysis,
}: {
  commentary: string;
  analysis: Analysis | null;
}) {
  const { vibeHistory } = useVibeStore();
  
  // Convert vibeHistory to runs vs overs for the graph
  const graphData = vibeHistory.map((v, idx) => ({
    over: parseFloat(v.score.overs) || idx,
    runs: v.score.runs
  })).slice(-15); // Show last 15 data points

  const eventColor =
    analysis?.event_type === 'WICKET' ? '#EF4444' :
      analysis?.event_type === 'SIX' ? '#10B981' :
        analysis?.event_type === 'FOUR' ? 'rgb(var(--color-secondary))' :
          'rgba(var(--color-primary))';

  return (
    <div className="space-y-4">
      {/* Commentary Card */}
      <div className="glass glow-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider"
            style={{ color: 'rgba(var(--color-muted))' }}>
            🎙️ Live Commentary
          </span>
          {analysis?.is_critical_event && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: eventColor + '22', color: eventColor, border: `1px solid ${eventColor}44` }}>
              {analysis.event_type}
            </span>
          )}
        </div>
        <p className="text-xl font-bold leading-relaxed"
          style={{ borderLeft: `5px solid ${eventColor}`, paddingLeft: '20px' }}>
          {commentary || 'Waiting for match data...'}
        </p>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass glow-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: 'rgb(var(--color-secondary))' }}>
            ⚡ Tension Meter
          </h3>
          <TensionGauge value={analysis?.tension_index ?? 5} />
        </div>

        <div className="glass glow-border p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: 'rgb(var(--color-secondary))' }}>
            📈 Run Progression (Runs vs Overs)
          </h3>
          <ScoreGraph data={graphData} />
        </div>
      </div>
    </div>
  );
}
