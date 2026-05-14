'use client';
/**
 * useLibrarianAgent.ts — The Librarian Agent hook.
 *
 * Responsible for deep, historical knowledge about teams and players.
 * Implements a cache-first strategy using CacheManager (localStorage).
 *
 * Flow:
 *   1. Check CacheManager for a fresh (< 1h) entry → return immediately (zero latency)
 *   2. Cache miss → show "Compiling Dossier..." state → fetch from backend
 *   3. Store result in CacheManager → return to UI
 *
 * Routed from: AgentDataRouter when DataClass === 'STATIC'
 */

import { cacheManager } from '@/lib/CacheManager';
import { fetchPlayerDetail, fetchTeamDetail } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────

export type LibrarianQuery =
    | { type: 'team'; id: string }
    | { type: 'player'; name: string };

export interface LibrarianResult<T = unknown> {
    /** The fetched/cached data. Null while loading or on error. */
    data: T | null;
    /** True while fetching from the backend (cache miss path). */
    loading: boolean;
    /** Human-readable loading label — "Compiling Dossier..." on first load. */
    loadingLabel: string;
    /** Error message, or null if successful. */
    error: string | null;
    /** True when data was served from cache (zero-latency path). */
    fromCache: boolean;
    /** Manually invalidate cache and re-fetch. */
    refresh: () => void;
}

// ── Cache key builders ─────────────────────────────────────────────

function buildCacheKey(query: LibrarianQuery): string {
    if (query.type === 'team') {
        return `team_${query.id.toLowerCase()}`;
    }
    return `player_${query.name.toLowerCase().replace(/\s+/g, '_')}`;
}

/** Returns the primary identifier from the query (id or name). */
function getQueryValue(query: LibrarianQuery): string {
    return query.type === 'team' ? query.id : query.name;
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * The Librarian Agent — static data with cache-first delivery.
 *
 * @example
 *   const { data, loading, loadingLabel } = useLibrarianAgent({ type: 'team', id: 'CSK' });
 */
export function useLibrarianAgent<T = unknown>(
    query: LibrarianQuery,
): LibrarianResult<T> {
    const cacheKey = buildCacheKey(query);
    const queryValue = getQueryValue(query);

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fromCache, setFromCache] = useState(false);

    const fetchData = useCallback(
        async (forceRefresh = false) => {
            // Guard: skip fetch if identifier is missing (hook called with idle state)
            if (!queryValue) {
                setLoading(false);
                return;
            }

            // 1. Cache check (skip if force refresh)
            if (!forceRefresh) {
                const cached = cacheManager.get<T>(cacheKey);
                if (cached !== null) {
                    setData(cached);
                    setFromCache(true);
                    setLoading(false);
                    setError(null);
                    return;
                }
            }

            // 2. Cache miss — fetch from backend
            setLoading(true);
            setFromCache(false);
            setError(null);

            try {
                let result: unknown;
                if (query.type === 'team') {
                    result = await fetchTeamDetail(query.id);
                } else {
                    result = await fetchPlayerDetail(query.name);
                }

                // 3. Persist to cache
                cacheManager.set(cacheKey, result);
                setData(result as T);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to fetch data';
                setError(msg);
                console.error('[LibrarianAgent] Fetch failed:', msg);
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cacheKey, queryValue, query.type],
    );

    // Trigger on mount and whenever the query changes
    useEffect(() => {
        // Reset state when query changes
        setData(null);
        setLoading(true);
        setError(null);
        setFromCache(false);
        fetchData();
    }, [fetchData]);

    const refresh = useCallback(() => {
        cacheManager.invalidate(cacheKey);
        fetchData(true);
    }, [cacheKey, fetchData]);

    const loadingLabel = fromCache
        ? ''
        : loading
            ? 'Compiling Dossier...'
            : '';

    return { data, loading, loadingLabel, error, fromCache, refresh };
}
