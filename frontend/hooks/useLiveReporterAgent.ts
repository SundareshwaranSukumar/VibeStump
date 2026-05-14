'use client';
/**
 * useLiveReporterAgent.ts — The Live Reporter Agent hook.
 *
 * Optimized purely for speed and real-time reaction.
 * Bypasses the DB/cache entirely — always fetches fresh data from the backend.
 *
 * Flow:
 *   1. User opens the Live Match view (matchId is set)
 *   2. AgentDataRouter classifies request as DYNAMIC
 *   3. This hook polls /api/live-score and /api/commentary on a tight interval
 *   4. Data feeds directly into React state → Jumbotron, Scoreboard, Commentary update instantly
 *
 * No caching. No IndexedDB writes. Pure speed.
 *
 * Routed from: AgentDataRouter when DataClass === 'DYNAMIC'
 */

import { fetchCommentary, fetchLiveScore } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export interface LiveScoreData {
    match_id: string;
    batting_team: string;
    bowling_team: string;
    runs: number;
    wickets: number;
    overs: string;
    target: string;
    run_rate: number;
    required_rate: number;
    match_status: string;
    raw_title: string;
}

export interface CommentaryItem {
    text: string;
    event_type: string;
    created_at: string;
}

export interface LiveReport {
    /** Latest live score snapshot. Null until first successful poll. */
    score: LiveScoreData | null;
    /** Recent commentary items (newest first). */
    commentary: CommentaryItem[];
    /** The most recent event type (WICKET | SIX | FOUR | RUNS | NONE). */
    latestEvent: string;
    /** True only on the very first fetch before any data arrives. */
    loading: boolean;
    /** Non-null when the last poll failed. Clears on next success. */
    error: string | null;
    /** Unix timestamp of the last successful poll. */
    lastUpdatedAt: number | null;
}

/** Poll interval in milliseconds — Live Reporter fires every 5s. */
const POLL_INTERVAL_MS = 5_000;

/** Number of commentary items to fetch per poll. */
const COMMENTARY_LIMIT = 10;

// ── Hook ───────────────────────────────────────────────────────────

/**
 * The Live Reporter Agent — zero-cache, high-speed polling.
 *
 * @example
 *   const { score, commentary, latestEvent } = useLiveReporterAgent(selectedMatchId);
 */
export function useLiveReporterAgent(matchId: string | null): LiveReport {
    const [score, setScore] = useState<LiveScoreData | null>(null);
    const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
    const [latestEvent, setLatestEvent] = useState<string>('NONE');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const mountedRef = useRef(true);

    const poll = useCallback(async () => {
        if (!matchId) return;
        try {
            // Bypass cache — fetch both score and commentary in parallel
            const [scoreData, commentaryData] = await Promise.all([
                fetchLiveScore(matchId),
                fetchCommentary(matchId, COMMENTARY_LIMIT),
            ]);

            if (!mountedRef.current) return;

            // Extract the latest event from commentary
            const items: CommentaryItem[] = Array.isArray(commentaryData) ? commentaryData : [];
            const newestEvent = items.length > 0 ? items[0].event_type : 'NONE';

            setScore(scoreData as LiveScoreData);
            setCommentary(items);
            setLatestEvent(newestEvent || 'NONE');
            setError(null);
            setLastUpdatedAt(Date.now());
        } catch (e: unknown) {
            if (!mountedRef.current) return;
            const msg = e instanceof Error ? e.message : 'Live data unavailable';
            setError(msg);
            console.warn('[LiveReporterAgent] Poll failed:', msg);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [matchId]);

    useEffect(() => {
        mountedRef.current = true;

        if (!matchId) {
            setLoading(false);
            return;
        }

        // Reset state when matchId changes
        setScore(null);
        setCommentary([]);
        setLatestEvent('NONE');
        setLoading(true);
        setError(null);
        setLastUpdatedAt(null);

        // Immediate first poll, then on interval
        poll();
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            mountedRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [matchId, poll]);

    return { score, commentary, latestEvent, loading, error, lastUpdatedAt };
}
