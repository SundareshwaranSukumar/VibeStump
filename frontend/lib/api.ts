/**
 * api.ts — Fetch helpers for the FastAPI backend.
 * All calls go through Next.js rewrites → backend.
 */

const BASE = '';  // Uses Next.js rewrite proxy

export async function fetchScore(ball: number, demo: boolean) {
  const res = await fetch(`${BASE}/api/score?ball=${ball}&demo=${demo}`);
  return res.json();
}

export async function fetchCommentary(ball: number, demo: boolean) {
  const res = await fetch(`${BASE}/api/commentary?ball=${ball}&demo=${demo}`);
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
