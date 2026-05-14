/**
 * api.ts — Clean API helpers for the VibeStump frontend.
 * All calls go through the Next.js proxy → FastAPI backend.
 */

const BASE = '';

export async function fetchMatches() {
  const res = await fetch(`${BASE}/api/matches`);
  return res.json();
}

export async function fetchLiveScore(matchId: string) {
  const res = await fetch(`${BASE}/api/live-score?match_id=${encodeURIComponent(matchId)}`);
  return res.json();
}

export async function fetchAllLiveScores() {
  const res = await fetch(`${BASE}/api/live-score`);
  return res.json();
}

export async function fetchScoreProgression(matchId: string) {
  const res = await fetch(`${BASE}/api/score-progression?match_id=${encodeURIComponent(matchId)}`);
  return res.json();
}

export async function fetchCommentary(matchId: string, limit: number = 30) {
  const res = await fetch(`${BASE}/api/commentary?match_id=${encodeURIComponent(matchId)}&limit=${limit}`);
  return res.json();
}

export async function fetchHighlights(limit: number = 6) {
  const res = await fetch(`${BASE}/api/highlights?limit=${limit}`);
  return res.json();
}

export async function fetchInsights(matchId: string, limit: number = 10) {
  const res = await fetch(`${BASE}/api/insights?match_id=${encodeURIComponent(matchId)}&limit=${limit}`);
  return res.json();
}

export async function fetchPointsTable() {
  const res = await fetch(`${BASE}/api/points-table`);
  return res.json();
}

export async function fetchUpcomingMatches() {
  const res = await fetch(`${BASE}/api/upcoming-matches`);
  return res.json();
}

export async function fetchTeams() {
  const res = await fetch(`${BASE}/api/teams`);
  return res.json();
}

export async function fetchTeamDetail(teamCode: string) {
  const res = await fetch(`${BASE}/api/teams/${encodeURIComponent(teamCode)}`);
  return res.json();
}

export async function fetchPlayerDetail(playerName: string) {
  const res = await fetch(`${BASE}/api/players/${encodeURIComponent(playerName)}`);
  return res.json();
}

export async function chatWithStumpMind(message: string, history: { role: string; content: string }[]) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return res.json();
}

export async function fetchCompletedMatches() {
  const res = await fetch(`${BASE}/api/completed-matches`);
  return res.json();
}

export async function fetchMatchResult(matchId: string) {
  const res = await fetch(`${BASE}/api/match-result/${encodeURIComponent(matchId)}`);
  return res.json();
}
