/**
 * AgentDataRouter.ts — Central classification engine for VibeStump's dual-agent architecture.
 *
 * Evaluates any data request and classifies it as STATIC or DYNAMIC based on TTL rules:
 *
 *   STATIC  (TTL > 1 hour)  → Route to The Librarian Agent (CacheManager + backend)
 *     Examples: player profiles, team rosters, career stats, coach info, home ground
 *
 *   DYNAMIC (TTL < 1 minute) → Route to The Live Reporter Agent (direct polling)
 *     Examples: live score, current run-rate, ball commentary, tension index, events
 */

export type DataClass = 'STATIC' | 'DYNAMIC';

/** Minimum TTL boundary (ms) that separates static from dynamic data. */
export const STATIC_TTL_MS = 60 * 60 * 1000; // 1 hour
export const DYNAMIC_TTL_MS = 30 * 1000;      // 30 seconds

export interface RouterConfig {
    /** Free-text description of what data is needed (e.g. "CSK Roster", "live score"). */
    query: string;
    /**
     * Explicit override:
     *   'auto'    → let the router decide (default)
     *   'static'  → force Librarian Agent
     *   'dynamic' → force Live Reporter Agent
     */
    type?: 'auto' | 'static' | 'dynamic';
}

export interface RoutingDecision {
    dataClass: DataClass;
    ttlMs: number;
    reason: string;
}

// ── Keyword dictionaries ────────────────────────────────────────────

/** Keywords that signal long-lived, historical, or biographical data. */
const STATIC_KEYWORDS: string[] = [
    'team', 'player', 'roster', 'squad', 'profile', 'bio', 'biography',
    'history', 'stats', 'career', 'ground', 'stadium', 'coach', 'captain',
    'wicketkeeper', 'playing xi', 'bench', 'substitute', 'form', 'upcoming',
    'schedule', 'fixture', 'result', 'completed', 'highlights', 'points table',
];

/** Keywords that signal ball-by-ball or near-real-time data. */
const DYNAMIC_KEYWORDS: string[] = [
    'live', 'score', 'commentary', 'current', 'ball', 'wicket', 'six', 'four',
    'boundary', 'tension', 'vibe', 'event', 'run rate', 'required rate',
    'over', 'target', 'chase', 'crr', 'rrr', 'meme', 'mood', 'audience',
];

// ── Router ─────────────────────────────────────────────────────────

/**
 * Classify a data request as STATIC or DYNAMIC.
 *
 * Priority order:
 *  1. Explicit type override ('static' | 'dynamic')
 *  2. Dynamic keyword match (higher urgency → checked first)
 *  3. Static keyword match
 *  4. Default → STATIC (safer, avoids unnecessary polling)
 */
export function classifyRequest(config: RouterConfig): RoutingDecision {
    const { query, type = 'auto' } = config;

    if (type === 'static') {
        return { dataClass: 'STATIC', ttlMs: STATIC_TTL_MS, reason: 'explicit override' };
    }
    if (type === 'dynamic') {
        return { dataClass: 'DYNAMIC', ttlMs: DYNAMIC_TTL_MS, reason: 'explicit override' };
    }

    const q = query.toLowerCase();

    for (const kw of DYNAMIC_KEYWORDS) {
        if (q.includes(kw)) {
            return { dataClass: 'DYNAMIC', ttlMs: DYNAMIC_TTL_MS, reason: `dynamic keyword: "${kw}"` };
        }
    }

    for (const kw of STATIC_KEYWORDS) {
        if (q.includes(kw)) {
            return { dataClass: 'STATIC', ttlMs: STATIC_TTL_MS, reason: `static keyword: "${kw}"` };
        }
    }

    // Default fallback — treat unknown as static to avoid runaway polling
    return { dataClass: 'STATIC', ttlMs: STATIC_TTL_MS, reason: 'default (no keyword matched)' };
}

/**
 * Convenience wrapper — returns just the DataClass.
 */
export function classify(query: string, type?: RouterConfig['type']): DataClass {
    return classifyRequest({ query, type }).dataClass;
}
