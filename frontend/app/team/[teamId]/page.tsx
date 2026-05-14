'use client';

import { useLibrarianAgent } from '@/hooks/useLibrarianAgent';
import { TEAM_THEMES, type TeamCode } from '@/lib/store';
import { ArrowLeft, Calendar, RefreshCw, Shield, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Player {
  name: string;
  role: 'BAT' | 'WK' | 'ALL' | 'BOWL';
  captain?: boolean;
  wicketkeeper?: boolean;
}

interface TeamDetail {
  name: string;
  short: string;
  coach: string;
  home: string;
  logo: string;
  primary: string;
  glow: string;
  playing_xi: Player[];
  substitutes: Player[];
  recent_results: string[];
  upcoming: string[];
  form: string;
}

const ROLE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  BAT: { label: 'BAT', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  WK: { label: 'WK', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  ALL: { label: 'ALL', bg: 'bg-green-500/20', text: 'text-green-400' },
  BOWL: { label: 'BOWL', bg: 'bg-red-500/20', text: 'text-red-400' },
};

function PlayerCard({ player, number, accent }: { player: Player; number: number; accent: string }) {
  const role = ROLE_STYLES[player.role] || ROLE_STYLES.BAT;
  return (
    <Link
      href={`/player/${encodeURIComponent(player.name)}`}
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[rgba(var(--color-surface),0.5)] transition-colors group"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: `${accent}22`, color: accent, border: `1.5px solid ${accent}44` }}
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors font-medium truncate">
            {player.name}
          </span>
          {player.captain && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 uppercase tracking-wider flex-shrink-0">
              C
            </span>
          )}
          {player.wicketkeeper && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 uppercase tracking-wider flex-shrink-0">
              WK
            </span>
          )}
        </div>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${role.bg} ${role.text}`}>
        {role.label}
      </span>
    </Link>
  );
}

export default function TeamPage() {
  const params = useParams();
  const teamId = (params.teamId as string || '').toUpperCase();

  // The Librarian Agent — cache-first with "Compiling Dossier..." on first load
  const { data: team, loading, loadingLabel, error, fromCache, refresh } =
    useLibrarianAgent<TeamDetail>({ type: 'team', id: teamId });

  const themeColors = TEAM_THEMES[teamId as TeamCode];
  const accent = themeColors?.primary || '#6366f1';

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-bg))]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="skeleton w-32 h-8 mb-8" />
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="skeleton w-24 h-24 rounded-full" />
              <div>
                <div className="skeleton w-48 h-8 mb-3" />
                <div className="skeleton w-32 h-4" />
              </div>
            </div>
            {loadingLabel && (
              <p className="text-sm text-[rgb(var(--color-muted))] text-center animate-pulse mt-4">
                🗂️ {loadingLabel}
              </p>
            )}
            <div className="skeleton w-full h-40 mt-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-bg))] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[rgb(var(--color-muted))]">{error || 'Team not found'}</p>
          <Link href="/" className="text-sm text-[rgb(var(--color-primary))] mt-2 inline-block hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const playingXI: Player[] = Array.isArray(team.playing_xi) ? team.playing_xi : [];
  const substitutes: Player[] = Array.isArray(team.substitutes) ? team.substitutes : [];

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Team Header */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-5 sm:gap-8">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
                border: `3px solid ${accent}66`,
              }}
            >
              {/* eslint-disable @next/next/no-img-element */}
              <img src={team.logo} alt={team.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[rgb(var(--color-text))]">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[rgb(var(--color-muted))]">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Coach: {team.coach}</span>
                <span className="hidden sm:flex items-center gap-1">🏟️ {team.home}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
                >
                  IPL 2026
                </span>
                {fromCache && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                    ✓ Cached
                  </span>
                )}
                <button
                  onClick={refresh}
                  title="Refresh team data"
                  className="ml-auto p-1.5 rounded-lg hover:bg-[rgba(var(--color-surface),0.5)] text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {team.form && (
            <div className="mt-5 p-4 rounded-xl bg-[rgba(var(--color-surface),0.4)] border border-[rgba(var(--color-border),0.15)]">
              <p className="text-sm text-[rgb(var(--color-text))] leading-relaxed">{team.form}</p>
            </div>
          )}
        </div>

        {/* Squad Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Playing XI */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: accent }} /> Playing XI
            </h2>
            {playingXI.length > 0 ? (
              <div className="space-y-1">
                {playingXI.map((player, i) => (
                  <PlayerCard key={i} player={player} number={i + 1} accent={accent} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[rgb(var(--color-muted))] py-4 text-center">
                Playing XI not announced yet
              </p>
            )}
          </div>

          {/* Substitutes + Match Info */}
          <div className="flex flex-col gap-6">
            {/* Substitutes / Impact Players */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Impact Players / Bench
              </h2>
              {substitutes.length > 0 ? (
                <div className="space-y-1">
                  {substitutes.map((player, i) => (
                    <PlayerCard key={i} player={player} number={i + 1} accent={accent} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[rgb(var(--color-muted))]">No substitute data</p>
              )}
            </div>

            {/* Upcoming Matches */}
            {team.upcoming && team.upcoming.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Upcoming Matches
                </h2>
                <div className="space-y-2">
                  {team.upcoming.map((match, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[rgba(var(--color-surface),0.3)] text-sm text-[rgb(var(--color-text))]">
                      {match}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Results */}
            {team.recent_results && team.recent_results.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Recent Results
                </h2>
                <div className="space-y-2">
                  {team.recent_results.map((result, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[rgba(var(--color-surface),0.3)] text-sm text-[rgb(var(--color-text))]">
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
