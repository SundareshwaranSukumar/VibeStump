'use client';

import { TEAM_THEMES, useVibeStore, type TeamCode } from '@/lib/store';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function RunsGraph() {
  const { scoreProgression, score } = useVibeStore();

  if (scoreProgression.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4">
          Runs vs Overs — Both Innings
        </h3>
        <div className="h-[200px] flex items-center justify-center text-sm text-[rgb(var(--color-muted))]">
          Waiting for live match data...
        </div>
      </div>
    );
  }

  // Group score points by batting_team
  const teamGroups: Record<string, { overs: string; runs: number }[]> = {};
  for (const point of scoreProgression) {
    const team = (point as { batting_team?: string; overs: string; runs: number }).batting_team || 'Team';
    if (!teamGroups[team]) teamGroups[team] = [];
    teamGroups[team].push({ overs: point.overs, runs: point.runs });
  }

  const teams = Object.keys(teamGroups);

  // Build a merged dataset keyed by over string
  const overSet = new Set<string>();
  for (const pts of Object.values(teamGroups)) {
    pts.forEach(p => overSet.add(p.overs));
  }
  const sortedOvers = Array.from(overSet).sort((a, b) => parseFloat(a) - parseFloat(b));

  const data = sortedOvers.map(ov => {
    const row: Record<string, string | number> = { overs: ov };
    for (const team of teams) {
      const pt = teamGroups[team].find(p => p.overs === ov);
      if (pt) row[team] = pt.runs;
    }
    return row;
  });

  // Team colors from TEAM_THEMES (fallback to css vars)
  const COLORS = ['rgb(var(--color-primary))', '#f59e0b', '#10b981', '#8b5cf6'];
  const getTeamColor = (code: string, idx: number): string => {
    const theme = TEAM_THEMES[code as TeamCode];
    return theme ? theme.primary : COLORS[idx % COLORS.length];
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider">
          Runs vs Overs — Both Innings
        </h3>
        {score?.target && score.target !== '-' && score.target !== '0' && (
          <span className="text-xs text-[rgb(var(--color-muted))] bg-[rgba(var(--color-surface),0.5)] px-2 py-1 rounded-lg">
            Target: <span className="text-[rgb(var(--color-text))] font-semibold">{score.target}</span>
          </span>
        )}
      </div>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border), 0.3)" />
            <XAxis
              dataKey="overs"
              tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(var(--color-border), 0.3)' }}
              label={{ value: 'Overs', position: 'insideBottom', offset: -2, fill: 'rgb(var(--color-muted))', fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(var(--color-border), 0.3)' }}
              label={{ value: 'Runs', angle: -90, position: 'insideLeft', offset: 12, fill: 'rgb(var(--color-muted))', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(var(--color-card))',
                border: '1px solid rgba(var(--color-border), 0.3)',
                borderRadius: '12px',
                color: 'rgb(var(--color-text))',
                fontSize: '12px',
              }}
              labelFormatter={(v) => `Over ${v}`}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: 'rgb(var(--color-muted))' }}
            />
            {teams.map((team, idx) => (
              <Line
                key={team}
                type="monotone"
                dataKey={team}
                stroke={getTeamColor(team, idx)}
                strokeWidth={2.5}
                dot={{ fill: getTeamColor(team, idx), r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
                strokeDasharray={idx === 1 ? '6 3' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
