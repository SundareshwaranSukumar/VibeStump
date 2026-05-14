/**
 * CacheManager.ts — localStorage-backed static data cache for VibeStump.
 *
 * Used exclusively by The Librarian Agent to persist player profiles,
 * team rosters, and historical stats with a 1-hour TTL.
 *
 * STATIC data (TTL > 1 hour) → stored here → zero-latency repeat loads.
 * DYNAMIC data (TTL < 1 min)  → never stored here → always fetched live.
 */

export interface StaticCacheEntry {
    id: string;
    data: unknown;
    lastUpdated: number; // Unix timestamp (ms)
}

/** 1 hour in milliseconds — static data TTL */
const STATIC_TTL_MS = 60 * 60 * 1000;

const CACHE_PREFIX = 'vibestump:cache:';

function storageAvailable(): boolean {
    try {
        const key = '__vibestump_test__';
        localStorage.setItem(key, '1');
        localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
}

class CacheManager {
    private readonly prefix = CACHE_PREFIX;
    private readonly ttl = STATIC_TTL_MS;
    private readonly available: boolean;

    constructor() {
        this.available = storageAvailable();
    }

    /**
     * Retrieve a cached entry by key.
     * Returns null if missing, expired, or storage unavailable.
     */
    get<T = unknown>(id: string): T | null {
        if (!this.available) return null;
        try {
            const raw = localStorage.getItem(this.prefix + id);
            if (!raw) return null;
            const entry: StaticCacheEntry = JSON.parse(raw);
            const age = Date.now() - entry.lastUpdated;
            if (age > this.ttl) {
                localStorage.removeItem(this.prefix + id);
                return null;
            }
            return entry.data as T;
        } catch {
            return null;
        }
    }

    /**
     * Store a value under the given key with the current timestamp.
     */
    set(id: string, data: unknown): void {
        if (!this.available) return;
        try {
            const entry: StaticCacheEntry = { id, data, lastUpdated: Date.now() };
            localStorage.setItem(this.prefix + id, JSON.stringify(entry));
        } catch (e) {
            // Storage quota exceeded — silently skip
            console.warn('[CacheManager] Write failed:', e);
        }
    }

    /**
     * Remove a single entry from cache.
     */
    invalidate(id: string): void {
        if (!this.available) return;
        localStorage.removeItem(this.prefix + id);
    }

    /**
     * Wipe all VibeStump cache entries from localStorage.
     */
    clearAll(): void {
        if (!this.available) return;
        Object.keys(localStorage)
            .filter((k) => k.startsWith(this.prefix))
            .forEach((k) => localStorage.removeItem(k));
    }

    /**
     * Check whether a cached (non-expired) entry exists.
     */
    has(id: string): boolean {
        return this.get(id) !== null;
    }
}

/** Singleton — import and use anywhere in the frontend. */
export const cacheManager = new CacheManager();
