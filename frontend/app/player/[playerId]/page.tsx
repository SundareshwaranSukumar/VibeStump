'use client';

import { fetchPlayerDetail } from '@/lib/api';
import { ArrowLeft, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PlayerDetail {
  name: string;
  role: string;
  batting_avg: string;
  bowling_avg: string;
  total_runs: string;
  total_wickets: string;
  current_season: string;
}

export default function PlayerPage() {
  const params = useParams();
  const playerName = decodeURIComponent(params.playerId as string || '');
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchPlayerDetail(playerName);
        setPlayer(data);
      } catch (e) {
        console.error('[PlayerPage]', e);
      } finally {
        setLoading(false);
      }
    };
    if (playerName) load();
  }, [playerName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-bg))]">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="skeleton w-32 h-8 mb-8" />
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="skeleton w-20 h-20 rounded-full" />
              <div>
                <div className="skeleton w-48 h-8 mb-3" />
                <div className="skeleton w-24 h-4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
              <div className="skeleton h-24 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-bg))] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[rgb(var(--color-muted))]">Player not found</p>
          <Link href="/" className="text-sm text-[rgb(var(--color-primary))] mt-2 inline-block hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const roleColor = player.role?.toLowerCase().includes('bat') ? 'text-blue-400' :
                     player.role?.toLowerCase().includes('bowl') ? 'text-green-400' :
                     player.role?.toLowerCase().includes('all') ? 'text-purple-400' :
                     'text-amber-400';

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-text))] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Player Header */}
        <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[rgba(var(--color-primary),0.1)] flex items-center justify-center flex-shrink-0">
              <span className="text-2xl sm:text-3xl font-black text-[rgb(var(--color-primary))]">
                {player.name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[rgb(var(--color-text))]">{player.name}</h1>
              <span className={`text-sm font-semibold ${roleColor} uppercase tracking-wider`}>
                {player.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="IPL Runs" value={player.total_runs} icon={<TrendingUp className="w-4 h-4" />} />
          <StatCard label="IPL Wickets" value={player.total_wickets} icon={<Target className="w-4 h-4" />} />
          <StatCard label="Batting Average" value={player.batting_avg} />
          <StatCard label="Bowling Average" value={player.bowling_avg} />
        </div>

        {/* Current Season */}
        {player.current_season && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider mb-3">
              Current Season
            </h2>
            <p className="text-sm text-[rgb(var(--color-text))] leading-relaxed">{player.current_season}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-[rgb(var(--color-primary))]">{icon}</span>}
        <span className="text-xs font-medium text-[rgb(var(--color-muted))] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[rgb(var(--color-text))]">{value || 'N/A'}</p>
    </div>
  );
}
