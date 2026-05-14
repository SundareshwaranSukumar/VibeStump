'use client';

import { fetchUpcomingMatches } from '@/lib/api';
import { TEAM_THEMES, type TeamCode } from '@/lib/store';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface UpcomingMatch {
    id: string;
    team1: string;
    team2: string;
    venue: string;
    date: string;
    time: string;
    match_no: string;
}

function formatDateLong(dateStr: string): string {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function formatDateShort(dateStr: string): string {
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

function MatchCard({ m, fullPage }: { m: UpcomingMatch; fullPage: boolean }) {
    const t1 = TEAM_THEMES[m.team1 as TeamCode];
    const t2 = TEAM_THEMES[m.team2 as TeamCode];

    if (fullPage) {
        return (
            <div className="glass rounded-2xl border border-[rgba(var(--color-border),0.2)] overflow-hidden hover:border-[rgba(var(--color-primary),0.3)] transition-all">
                {/* Match meta bar */}
                <div className="px-5 py-2.5 flex items-center gap-3 bg-[rgba(var(--color-surface),0.5)] border-b border-[rgba(var(--color-border),0.15)]">
                    <span className="text-[11px] font-bold text-[rgb(var(--color-primary))]">{m.match_no}</span>
                    <span className="text-[rgba(var(--color-muted),0.5)] text-xs">·</span>
                    <div className="flex items-center gap-1 text-[11px] text-[rgb(var(--color-muted))]">
                        <Clock className="w-3 h-3" />
                        <span>{m.time} IST</span>
                    </div>
                </div>

                {/* Teams */}
                <div className="px-5 py-4 flex items-center gap-4">
                    {/* Team 1 */}
                    <Link href={`/team/${m.team1}`} className="flex flex-col items-center gap-1.5 group">
                        {t1?.logo && (
                            <img src={t1.logo} alt={m.team1} className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
                        )}
                        <span className="text-sm font-black group-hover:underline underline-offset-2" style={{ color: t1?.primary ?? 'rgb(var(--color-text))' }}>{m.team1}</span>
                    </Link>

                    {/* VS */}
                    <div className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-lg font-black text-[rgba(var(--color-muted),0.5)]">VS</span>
                        <div className="flex items-center gap-1 text-[10px] text-[rgb(var(--color-muted))]">
                            <MapPin className="w-3 h-3" />
                            <span className="text-center leading-tight">{m.venue}</span>
                        </div>
                    </div>

                    {/* Team 2 */}
                    <Link href={`/team/${m.team2}`} className="flex flex-col items-center gap-1.5 group">
                        {t2?.logo && (
                            <img src={t2.logo} alt={m.team2} className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
                        )}
                        <span className="text-sm font-black group-hover:underline underline-offset-2" style={{ color: t2?.primary ?? 'rgb(var(--color-text))' }}>{m.team2}</span>
                    </Link>
                </div>
            </div>
        );
    }

    // Compact card for sidebar
    return (
        <div className="rounded-xl border border-[rgba(var(--color-border),0.2)] bg-[rgba(var(--color-surface),0.3)] p-3 hover:border-[rgba(var(--color-primary),0.3)] transition-all">
            <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-center min-w-[52px]">
                    {t1?.logo && <img src={t1.logo} alt={m.team1} className="w-7 h-7 object-contain mb-0.5" onError={(e) => { e.currentTarget.style.display='none'; }} />}
                    <span className="text-sm font-black" style={{ color: t1?.primary ?? 'rgb(var(--color-text))' }}>{m.team1}</span>
                </div>

                <div className="flex-1 text-center">
                    <div className="text-xs font-bold text-[rgb(var(--color-muted))] mb-1">VS</div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[rgb(var(--color-muted))]">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{formatDateShort(m.date)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] text-[rgb(var(--color-muted))]">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{m.time} IST</span>
                    </div>
                </div>

                <div className="flex flex-col items-center min-w-[52px]">
                    {t2?.logo && <img src={t2.logo} alt={m.team2} className="w-7 h-7 object-contain mb-0.5" onError={(e) => { e.currentTarget.style.display='none'; }} />}
                    <span className="text-sm font-black" style={{ color: t2?.primary ?? 'rgb(var(--color-text))' }}>{m.team2}</span>
                </div>
            </div>

            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[rgba(var(--color-border),0.15)]">
                <MapPin className="w-3 h-3 text-[rgb(var(--color-muted))] flex-shrink-0" />
                <span className="text-[10px] text-[rgb(var(--color-muted))] truncate">{m.venue}</span>
                <span className="ml-auto text-[10px] text-[rgb(var(--color-primary))] font-semibold flex-shrink-0">{m.match_no}</span>
            </div>
        </div>
    );
}

export default function UpcomingMatches({ fullPage = false }: { fullPage?: boolean }) {
    const [matches, setMatches] = useState<UpcomingMatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchUpcomingMatches();
                if (Array.isArray(data)) setMatches(data);
            } catch (e) {
                console.error('[UpcomingMatches]', e);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 120000);
        return () => clearInterval(interval);
    }, []);

    const loadingSkeletons = fullPage ? 5 : 3;

    if (fullPage) {
        // Group by date
        const grouped = matches.reduce<Record<string, UpcomingMatch[]>>((acc, m) => {
            const key = m.date || 'TBD';
            if (!acc[key]) acc[key] = [];
            acc[key].push(m);
            return acc;
        }, {});
        const sortedDates = Object.keys(grouped).sort();

        return (
            <div>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[...Array(loadingSkeletons)].map((_, i) => (
                            <div key={i} className="skeleton h-36 rounded-2xl" />
                        ))}
                    </div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-20 text-[rgb(var(--color-muted))]">
                        <p className="text-4xl mb-3">🗓️</p>
                        <p className="text-sm">No upcoming matches scheduled.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedDates.map((date) => (
                            <div key={date}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-px flex-1 bg-[rgba(var(--color-border),0.2)]" />
                                    <span className="text-xs font-bold text-[rgb(var(--color-primary))] uppercase tracking-wide flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDateLong(date)}
                                    </span>
                                    <div className="h-px flex-1 bg-[rgba(var(--color-border),0.2)]" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {grouped[date].map((m) => (
                                        <MatchCard key={m.id} m={m} fullPage />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Sidebar compact mode
    return (
        <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[rgb(var(--color-primary))]" />
                <h3 className="text-sm font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider">
                    Upcoming Matches
                </h3>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(loadingSkeletons)].map((_, i) => (
                        <div key={i} className="skeleton h-16 rounded-xl" />
                    ))}
                </div>
            ) : matches.length === 0 ? (
                <p className="text-sm text-[rgb(var(--color-muted))] text-center py-4">
                    No upcoming matches scheduled.
                </p>
            ) : (
                <div className="space-y-3">
                    {matches.map((m) => (
                        <MatchCard key={m.id} m={m} fullPage={false} />
                    ))}
                </div>
            )}
        </div>
    );
}
