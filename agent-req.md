Master Prompt: Dual-Agent Data Routing & Caching Architecture
Project Context: React + TypeScript + Backend-for-Frontend (or robust local state)
Goal: Implement a "Dual-Agent Data Orchestration" system that automatically classifies information requests as either STATIC or DYNAMIC, routing them to specialized AI Agents.

1. Architectural Overview: The Routing Engine
Build a central AgentDataRouter.ts utility. This router must evaluate the required data points for any given page and automatically classify them based on Time-To-Live (TTL) rules.

The Classification Rules (Implement this logic):

STATIC DATA (TTL: > 1 Hour): Data that does not change during the match.

Examples: Player profiles, team history, stadium dimensions, lifetime stats, team rosters.

Action: Route to The Librarian Agent.

DYNAMIC DATA (TTL: < 1 Minute): Data that changes ball-by-ball.

Examples: Live score, current batter strike-rate, ball commentary, live Tension Index, Wicket/Boundary events.

Action: Route to The Live Reporter Agent.

2. Agent 1: "The Librarian" (Static Context & DB Caching)
Design an agent and caching layer responsible for deep, historical knowledge.

The Database Layer: Implement a CacheManager.ts (use IndexedDB/localStorage for the frontend MVP, or setup a schema for a backend DB like Supabase/Firebase if a backend is present).

The Flow:

User navigates to a specific team/player page.

AgentDataRouter identifies the request as STATIC.

Check CacheManager. If data exists: Return it immediately to the UI (Zero latency).

If data is missing (First Load): Show a "Compiling Dossier..." loading state. Trigger the Librarian Agent (Gemini API) to generate/fetch comprehensive, deep-dive JSON data about that entity.

Save the generated JSON to the DB/Cache with a timestamp. Return data to UI.

3. Agent 2: "The Live Reporter" (High-Speed Dynamic Data)
Design an agent optimized purely for speed and reaction.

The Flow:

User opens the "Live Match" view.

AgentDataRouter identifies the request as DYNAMIC.

Bypass the DB. Do not write live scores to the heavy static database.

Trigger the Live Reporter Agent. This agent uses a highly optimized, short-context Gemini prompt to read the latest ball commentary and immediately output the { score, vibe, tension, event } JSON.

Feed this directly into the React State/Context to update the UI (like the Jumbotron) instantly.

4. Required Refactoring & Implementation Steps
hooks/useAgentData.ts: Create a universal hook that components use.

Usage Example: const { data, loading } = useAgentData({ query: 'CSK Roster', type: 'auto' }). The hook must auto-determine if it hits the Cache or the Live Agent.

Page-Level Data Fetching:

On the Team Dashboard Page: Trigger the Librarian Agent. Let it take 5-10 seconds on the first load to build a rich DB of player bios.

On the Live Match Page: Trigger the Live Reporter Agent on an interval (or simulated WebSocket) for immediate updates.

Database Schema (Types):

TypeScript
interface StaticCacheEntry {
  id: string; // e.g., 'team_csk_roster'
  data: any;
  lastUpdated: number; // Unix timestamp
}
Output Instructions:
Do not break existing UI components. Focus strictly on generating the Data Orchestration Logic:

Generate AgentDataRouter.ts and CacheManager.ts.

Generate the two specific agent hooks (useLibrarianAgent.ts and useLiveReporterAgent.ts).

Provide an example of how to update App.tsx or a specific page component to use this new caching architecture cleanly.