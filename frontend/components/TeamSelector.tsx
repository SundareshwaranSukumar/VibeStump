'use client';

import { useVibeStore, TEAM_THEMES, type TeamName } from '@/lib/store';

const teams = Object.keys(TEAM_THEMES) as TeamName[];

export default function TeamSelector() {
  const { selectedTeam, setTeam } = useVibeStore();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <select
        value={selectedTeam}
        onChange={(e) => setTeam(e.target.value as TeamName)}
        className="glass glow-border px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer appearance-none"
        style={{ color: 'rgb(var(--color-primary))', background: 'rgba(var(--color-surface), 0.9)' }}
      >
        {teams.map((t) => (
          <option key={t} value={t} style={{ background: '#0F172A', color: '#F8FAFC' }}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
