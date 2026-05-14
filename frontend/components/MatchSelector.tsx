'use client';

import { useVibeStore, type Match } from '@/lib/store';
import { ChevronDown, History, Radio } from 'lucide-react';

export default function MatchSelector() {
    const { matches, selectedMatchId, setSelectedMatchId } = useVibeStore();

    const liveMatches = matches.filter((m) => m.status === 'LIVE');
    const prevMatches = matches.filter((m) => m.status === 'COMPLETED');

    if (matches.length === 0) return null;

    const selectedMatch = matches.find((m) => m.id === selectedMatchId);

    const handleSelect = (id: string) => {
        if (id) setSelectedMatchId(id);
    };

    const teamLabel = (m: Match) =>
        m.team1 && m.team2 ? `${m.team1} vs ${m.team2}` : m.title;

    return (
        <div className="px-4 sm:px-6 py-2">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-3">
                {/* Today's / Live matches */}
                {liveMatches.length > 0 && (
                    <div className="relative flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider hidden sm:block">
                            Today
                        </span>
                        <div className="relative">
                            <select
                                value={liveMatches.some((m) => m.id === selectedMatchId) ? selectedMatchId || '' : ''}
                                onChange={(e) => handleSelect(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold
                           bg-[rgba(var(--color-surface),0.6)] border border-[rgba(var(--color-border),0.3)]
                           text-[rgb(var(--color-text))] cursor-pointer hover:border-red-500/50
                           focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                            >
                                {liveMatches.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        🔴 {teamLabel(m)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[rgb(var(--color-muted))]" />
                        </div>
                    </div>
                )}

                {/* Previous matches */}
                {prevMatches.length > 0 && (
                    <div className="relative flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-[rgb(var(--color-muted))] flex-shrink-0" />
                        <span className="text-[10px] font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider hidden sm:block">
                            Previous
                        </span>
                        <div className="relative">
                            <select
                                value={prevMatches.some((m) => m.id === selectedMatchId) ? selectedMatchId || '' : ''}
                                onChange={(e) => handleSelect(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold
                           bg-[rgba(var(--color-surface),0.6)] border border-[rgba(var(--color-border),0.3)]
                           text-[rgb(var(--color-muted))] cursor-pointer hover:border-[rgba(var(--color-primary),0.5)]
                           focus:outline-none focus:ring-1 focus:ring-[rgba(var(--color-primary),0.5)] transition-all"
                            >
                                <option value="">— Select previous match —</option>
                                {prevMatches.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        ✓ {teamLabel(m)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[rgb(var(--color-muted))]" />
                        </div>
                    </div>
                )}

                {/* Selected match indicator */}
                {selectedMatch && (
                    <span className="ml-auto text-[10px] text-[rgb(var(--color-muted))] hidden md:block truncate max-w-[300px]">
                        Viewing: <span className="text-[rgb(var(--color-text))] font-medium">{selectedMatch.title}</span>
                    </span>
                )}
            </div>
        </div>
    );
}
