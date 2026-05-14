'use client';

import { TEAM_THEMES, type TeamCode } from '@/lib/store';
import Link from 'next/link';

const TEAM_NAMES: Record<TeamCode, string> = {
  RCB: 'Royal Challengers Bengaluru',
  KKR: 'Kolkata Knight Riders',
  CSK: 'Chennai Super Kings',
  MI: 'Mumbai Indians',
  SRH: 'Sunrisers Hyderabad',
  GT: 'Gujarat Titans',
  DC: 'Delhi Capitals',
  LSG: 'Lucknow Super Giants',
  PBKS: 'Punjab Kings',
  RR: 'Rajasthan Royals',
};

export default function TeamsGrid() {
  return (
    <section className="px-4 sm:px-6 py-3">
      <div className="max-w-[1600px] mx-auto">
        {/* Outer box */}
        <div className="glass rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-primary))]" />
            IPL 2026 Teams
          </h2>
          {/* Inner box */}
          <div className="rounded-xl p-3 border border-[rgba(var(--color-border),0.15)] bg-[rgba(var(--color-surface),0.25)]">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TEAM_THEMES) as TeamCode[]).map((code) => {
                const theme = TEAM_THEMES[code];
                return (
                  <Link
                    key={code}
                    href={`/team/${code}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95"
                    style={{
                      borderColor: `rgba(${theme.glow}, 0.35)`,
                      backgroundColor: `rgba(${theme.glow}, 0.08)`,
                    }}
                  >
                    <img
                      src={theme.logo}
                      alt={code}
                      className="h-6 w-6 object-contain flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span
                      className="text-xs font-bold tracking-wide"
                      style={{ color: theme.primary }}
                    >
                      {code}
                    </span>
                    <span className="text-[10px] text-[rgb(var(--color-muted))] hidden sm:inline truncate max-w-[120px]">
                      {TEAM_NAMES[code]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
