'use client';
/**
 * useAgentData.ts — Universal data hook for VibeStump's dual-agent architecture.
 *
 * This is the single entry point for all component-level data fetching.
 * Internally it calls AgentDataRouter to classify the request, then
 * delegates to either The Librarian Agent or The Live Reporter Agent.
 *
 * Usage:
 *   // Auto-classify — router decides based on query text
 *   const { data, loading } = useAgentData({ query: 'CSK Roster', type: 'auto' });
 *
 *   // Explicit team page
 *   const { data, loading, fromCache } = useAgentData({ query: 'team', teamId: 'CSK' });
 *
 *   // Explicit live match
 *   const { data, loading } = useAgentData({ query: 'live score', matchId: 'match_41' });
 *
 * Rules for hooks:
 *   Both sub-hooks are ALWAYS called (React rules). The router decides which result is used.
 *   The unused hook receives a null/empty value so it stays idle.
 */

import { classifyRequest, DataClass } from '@/lib/AgentDataRouter';
import { useLibrarianAgent, type LibrarianQuery } from './useLibrarianAgent';
import { useLiveReporterAgent, type LiveReport } from './useLiveReporterAgent';

// ── Options ────────────────────────────────────────────────────────

export interface UseAgentDataOptions {
    /**
     * Natural language description of what data you need.
     * Examples: 'CSK Roster', 'live score', 'player profile', 'commentary'
     */
    query: string;

    /**
     * Routing hint — overrides keyword-based classification.
     *   'auto'    → AgentDataRouter decides (default)
     *   'static'  → force Librarian Agent
     *   'dynamic' → force Live Reporter Agent
     */
    type?: 'auto' | 'static' | 'dynamic';

    /** Required for DYNAMIC routing — the active match ID. */
    matchId?: string;

    /** Required for STATIC team routing — the team code (e.g. 'CSK'). */
    teamId?: string;

    /** Required for STATIC player routing — the player name. */
    playerName?: string;
}

// ── Result ─────────────────────────────────────────────────────────

export interface UseAgentDataResult {
    /**
     * The fetched data.
     *   STATIC  → team or player object
     *   DYNAMIC → { score: LiveScoreData, commentary: CommentaryItem[], latestEvent: string }
     */
    data: unknown;
    /** True while the initial fetch is in progress. */
    loading: boolean;
    /** Loading label to display — "Compiling Dossier..." on cache-miss for static data. */
    loadingLabel: string;
    /** Error message or null. */
    error: string | null;
    /** Whether the data came from the local cache (STATIC only). */
    fromCache: boolean;
    /** Which agent is serving this request. */
    dataClass: DataClass;
    /** For DYNAMIC data — timestamp of the last successful poll. */
    lastUpdatedAt: number | null;
    /** Force re-fetch (STATIC: also invalidates cache). */
    refresh: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────

export function useAgentData(options: UseAgentDataOptions): UseAgentDataResult {
    const { query, type = 'auto', matchId, teamId, playerName } = options;

    // Classify request — runs synchronously (no side effects)
    const { dataClass } = classifyRequest({ query, type });

    // Build the librarian query — always call, pass empty string if unused (hook guards internally)
    const librarianQuery: LibrarianQuery = teamId
        ? { type: 'team', id: teamId }
        : { type: 'player', name: playerName ?? '' };

    // The Librarian Agent: receives idle query ({ type: 'player', name: '' }) when routing DYNAMIC
    // useLibrarianAgent guards against empty names and skips the fetch automatically.
    const librarian = useLibrarianAgent(
        dataClass === 'STATIC' ? librarianQuery : { type: 'player', name: '' },
    );

    // The Live Reporter Agent: receives null matchId when routing STATIC — stays idle
    const live: LiveReport = useLiveReporterAgent(
        dataClass === 'DYNAMIC' ? (matchId ?? null) : null,
    );

    // Return the relevant agent's result
    if (dataClass === 'STATIC') {
        return {
            data: librarian.data,
            loading: librarian.loading,
            loadingLabel: librarian.loadingLabel,
            error: librarian.error,
            fromCache: librarian.fromCache,
            dataClass,
            lastUpdatedAt: null,
            refresh: librarian.refresh,
        };
    }

    // DYNAMIC path
    const liveData = {
        score: live.score,
        commentary: live.commentary,
        latestEvent: live.latestEvent,
    };

    return {
        data: liveData,
        loading: live.loading,
        loadingLabel: '',
        error: live.error,
        fromCache: false,
        dataClass,
        lastUpdatedAt: live.lastUpdatedAt,
        // Live data can't be "refreshed" manually — it auto-polls
        refresh: () => { },
    };
}
