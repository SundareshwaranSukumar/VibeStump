'use client';

import { TEAM_THEMES, useVibeStore, type TeamCode } from '@/lib/store';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function RunsGraph() {
  const { scoreProgression, score } = useVibeStore();

  if (scoreProgression.length === 0) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4">
          Runs Progression — Both Innings
        </h3>
        <div className="h-[200px] flex items-center justify-center text-sm text-[rgb(var(--color-muted))] text-center">
          <span>Ball-by-ball run chart will appear as the match progresses</span>
        </div>
      </div>
    );
  }

  // Check whether we have meaningful numeric overs data from the feed
  const hasOvers = scoreProgression.some(p => {
    const ov = String((p as { overs: string }).overs ?? '');
    const val = parseFloat(ov);
    return ov !== '' && !isNaN(val) && val > 0;
  });

  // Group runs by batting_team in arrival order
  const teamGroups: Record<string, { x: number | string; runs: number }[]> = {};
  const teamCounters: Record<string, number> = {};

  for (const point of scoreProgression) {
    const team = (point as { batting_team?: string }).batting_team || 'Team';
    if (!teamGroups[team]) { teamGroups[team] = []; teamCounters[team] = 0; }
    teamCounters[team]++;

    const x: number | string = hasOvers
      ? (parseFloat(String((point as { overs: string }).overs)) || teamCounters[team])
      : teamCounters[team]; // sequential update index when overs unavailable

    teamGroups[team].push({ x, runs: (point as { runs: number }).runs });
  }

  const teams = Object.keys(teamGroups);

  // Build merged dataset — align teams by their sequential position in each innings
  // (update #1 of team A vs update #1 of team B at same stage of their innings)
  const maxLen = Math.max(...teams.map(t => teamGroups[t].length), 1);
  const data = Array.from({ length: maxLen }, (_, i) => {
    const row: Record<string, string | number> = {
      x: hasOvers
        ? (teamGroups[teams[0]]?.[i]?.x ?? i + 1)
        : i + 1
    };
    for (const team of teams) {
      if (i < teamGroups[team].length) {
        row[team] = teamGroups[team][i].runs;
      }
    }
    return row;
  });

  // Team colors from TEAM_THEMES (fallback to css vars)
  const COLORS = ['rgb(var(--color-primary))', '#f59e0b', '#10b981', '#8b5cf6'];
  const getTeamColor = (code: string, idx: number): string => {
    const theme = TEAM_THEMES[code as TeamCode];
    return theme ? theme.primary : COLORS[idx % COLORS.length];
  };

  const xLabel = hasOvers ? 'Overs' : 'Updates';
  const tooltipLabel = hasOvers
    ? (v: string | number) => `Over ${v}`
    : (v: string | number) => `Update #${v}`;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider">
          Runs Progression — Both Innings
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
              dataKey="x"
              tick={{ fill: 'rgb(var(--color-muted))', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(var(--color-border), 0.3)' }}
              label={{ value: xLabel, position: 'insideBottom', offset: -2, fill: 'rgb(var(--color-muted))', fontSize: 10 }}
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
              labelFormatter={tooltipLabel}
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

