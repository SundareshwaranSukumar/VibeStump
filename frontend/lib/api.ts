/**
 * api.ts — Fetch helpers for the FastAPI backend.
 * All calls go through Next.js rewrites → backend.
 */

const BASE = '';  // Uses Next.js rewrite proxy

export async function fetchMatches() {
  const res = await fetch(`${BASE}/api/matches`);
  return res.json();
}

export async function fetchScore(ball: number, demo: boolean, matchId: string | null = null) {
  const url = `${BASE}/api/score?ball=${ball}&demo=${demo}${matchId ? `&match_id=${encodeURIComponent(matchId)}` : ''}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchCommentary(ball: number, demo: boolean, matchId: string | null = null) {
  const url = `${BASE}/api/commentary?ball=${ball}&demo=${demo}${matchId ? `&match_id=${encodeURIComponent(matchId)}` : ''}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchHighlights(query: string) {
  const res = await fetch(`${BASE}/api/youtube?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function analyzeVibe(commentary: string) {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commentary }),
  });
  return res.json();
}

export async function fetchHistorian(event_type: string, context: string) {
  const res = await fetch(`${BASE}/api/historian`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type, context }),
  });
  return res.json();
}

export async function fetchYouTube(query: string) {
  const res = await fetch(`${BASE}/api/youtube?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function diversionFood() {
  const res = await fetch(`${BASE}/api/diversion/food`, { method: 'POST' });
  return res.json();
}

export async function diversionNetflix() {
  const res = await fetch(`${BASE}/api/diversion/netflix`, { method: 'POST' });
  return res.json();
}

export async function fetchPointsTable() {
  const res = await fetch(`${BASE}/api/points-table`);
  return res.json();
}

export async function fetchTeamInfo(teamCode: string) {
  const res = await fetch(`${BASE}/api/team-info/${teamCode}`);
  return res.json();
}
