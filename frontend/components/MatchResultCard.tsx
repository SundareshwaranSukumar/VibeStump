'use client';

import { TEAM_THEMES, type TeamCode } from '@/lib/store';
import { MapPin, Trophy } from 'lucide-react';
import Link from 'next/link';

export interface MatchResult {
  id: string;
  title: string;
  match_no: string;
  match_date: string;
  venue: string;
  winner: string;
  margin: string;
  team1_code: string;
  team1_name: string;
  team1_score: string;
  team1_overs: string;
  team2_code: string;
  team2_name: string;
  team2_score: string;
  team2_overs: string;
  player_of_match: string;
  pom_performance: string;
  top_bat_name: string;
  top_bat_score: string;
  top_bowl_name: string;
  top_bowl_figures: string;
}

function formatDate(d: string): string {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
}

interface TeamRowProps {
  code: TeamCode;
  name: string;
  score: string;
  overs: string;
  isWinner: boolean;
}

function TeamRow({ code, name, score, overs, isWinner }: TeamRowProps) {
  const theme = TEAM_THEMES[code] ?? { primary: '#94a3b8', glow: '148,163,184', logo: '' };
  return (
    <Link
      href={`/team/${code}`}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
        isWinner
          ? 'bg-[rgba(var(--color-surface),0.6)]'
          : 'opacity-60 hover:opacity-80'
      }`}
    >
      <img
        src={theme.logo}
        alt={code}
        className="w-9 h-9 object-contain flex-shrink-0"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black group-hover:underline underline-offset-2" style={{ color: theme.primary }}>
            {code}
          </span>
          {isWinner && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-400/15 text-green-400 border border-green-400/25">
              WON
            </span>
          )}
        </div>
        <p className="text-[10px] text-[rgb(var(--color-muted))] truncate leading-tight">{name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-base font-black text-[rgb(var(--color-text))]">{score || '—'}</p>
        {overs && (
          <p className="text-[10px] text-[rgb(var(--color-muted))]">({overs} ov)</p>
        )}
      </div>
    </Link>
  );
}

export default function MatchResultCard({ match }: { match: MatchResult }) {
  const winnerCode = (match.winner || '').toUpperCase() as TeamCode;
  const winnerTheme = TEAM_THEMES[winnerCode];

  return (
    <article className="glass rounded-2xl overflow-hidden flex flex-col hover:border-[rgba(var(--color-primary),0.25)] transition-all duration-200 border border-[rgba(var(--color-border),0.2)]">

      {/* ── Card header ───────────────────────────────────────── */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-[rgba(var(--color-border),0.15)]">
        <div className="flex items-center gap-2 flex-wrap">
          {match.match_no && (
            <span className="text-[11px] font-bold text-[rgb(var(--color-primary))]">
              {match.match_no}
            </span>
          )}
          {match.match_date && (
            <>
              <span className="text-[rgba(var(--color-muted),0.5)] text-[10px]">·</span>
              <span className="text-[11px] text-[rgb(var(--color-muted))]">
                {formatDate(match.match_date)}
              </span>
            </>
          )}
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[rgba(var(--color-surface),0.8)] text-[rgb(var(--color-muted))] border border-[rgba(var(--color-border),0.2)] flex-shrink-0">
          COMPLETED
        </span>
      </div>

      {/* ── Score rows ─────────────────────────────────────────── */}
      <div className="px-3 pt-3 space-y-1.5">
        <TeamRow
          code={match.team1_code as TeamCode}
          name={match.team1_name}
          score={match.team1_score}
          overs={match.team1_overs}
          isWinner={winnerCode === match.team1_code.toUpperCase()}
        />

        {/* Result banner */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px bg-[rgba(var(--color-border),0.2)]" />
          <span
            className="text-[9px] font-black tracking-wide px-2 py-0.5 rounded-full border"
            style={winnerTheme
              ? { color: winnerTheme.primary, borderColor: `rgba(${winnerTheme.glow},0.3)`, background: `rgba(${winnerTheme.glow},0.08)` }
              : { color: 'rgb(var(--color-muted))' }
            }
          >
            {match.winner || '?'} WON by {match.margin || '—'}
          </span>
          <div className="flex-1 h-px bg-[rgba(var(--color-border),0.2)]" />
        </div>

        <TeamRow
          code={match.team2_code as TeamCode}
          name={match.team2_name}
          score={match.team2_score}
          overs={match.team2_overs}
          isWinner={winnerCode === match.team2_code.toUpperCase()}
        />
      </div>

      {/* ── Venue ─────────────────────────────────────────────── */}
      {match.venue && (
        <div className="px-4 pt-2 pb-1 flex items-start gap-1.5">
          <MapPin className="w-3 h-3 text-[rgb(var(--color-muted))] flex-shrink-0 mt-px" />
          <p className="text-[10px] text-[rgb(var(--color-muted))] leading-tight">{match.venue}</p>
        </div>
      )}

      {/* ── Key performers ─────────────────────────────────────── */}
      <div className="px-4 py-3 mt-auto border-t border-[rgba(var(--color-border),0.15)] space-y-2">

        {/* Player of the match */}
        {match.player_of_match && (
          <div className="flex items-start gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-px" />
            <div className="min-w-0">
              <span className="text-[10px] text-[rgb(var(--color-muted))]">Player of Match  </span>
              <span className="text-xs font-bold text-[rgb(var(--color-text))]">{match.player_of_match}</span>
              {match.pom_performance && (
                <span className="text-[10px] text-amber-400 ml-1">({match.pom_performance})</span>
              )}
            </div>
          </div>
        )}

        {/* Top performers row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {match.top_bat_name && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">🏏</span>
              <span className="text-[11px] text-[rgb(var(--color-muted))]">{match.top_bat_name}</span>
              <span className="text-[11px] font-bold text-emerald-400">{match.top_bat_score}</span>
            </div>
          )}
          {match.top_bowl_name && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm leading-none">🎯</span>
              <span className="text-[11px] text-[rgb(var(--color-muted))]">{match.top_bowl_name}</span>
              <span className="text-[11px] font-bold text-rose-400">{match.top_bowl_figures}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
