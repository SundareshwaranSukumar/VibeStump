'use client';

import { fetchCompletedMatches } from '@/lib/api';
import { useEffect, useState } from 'react';
import MatchResultCard, { type MatchResult } from './MatchResultCard';

export default function PreviousMatches() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchCompletedMatches();
        if (Array.isArray(data)) setMatches(data as MatchResult[]);
      } catch (e) {
        console.error('[PreviousMatches]', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton rounded-2xl h-72" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-20 text-[rgb(var(--color-muted))]">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm">Fetching recent match results…</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {matches.map((m) => (
        <MatchResultCard key={m.id} match={m} />
      ))}
    </div>
  );
}
