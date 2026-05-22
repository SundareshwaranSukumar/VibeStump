'use client';

/**
 * VibeStumpStateContext.tsx — Global state engine for VibeStump 4-Screen SPA.
 *
 * Bridges the Zustand store with derived UI state:
 * - activeScreen (1|2|3|4)
 * - winProbability (derived from run rate and target)
 * - agentReactionText (latest AI insight as scrolling marquee)
 * - userProfile (gender, favoriteTeam — persisted to localStorage)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useVibeStore } from './store';

// ── Types ────────────────────────────────────────────────────────────

export type ScreenId = 1 | 2 | 3 | 4;
export type Gender = 'male' | 'female' | 'unset';
export type FavoriteTeam = 'CSK' | 'MI' | 'RCB' | 'KKR' | 'SRH' | 'DC' | 'GT' | 'RR' | 'LSG' | 'PBKS' | null;

export interface UserProfile {
  gender: Gender;
  favoriteTeam: FavoriteTeam;
}

export interface VibeStumpContextValue {
  // Navigation
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;

  // Live match derived state
  liveScore: string;       // "148/6"
  wickets: number;
  runs: number;
  currentOver: string;     // "18.2"
  winProbability: string;  // "67%"

  // Agent reaction text for marquee
  agentReactionText: string;

  // User profile
  userProfile: UserProfile;
  setUserProfile: (profile: Partial<UserProfile>) => void;
}

// ── Context ──────────────────────────────────────────────────────────

const VibeStumpStateContext = createContext<VibeStumpContextValue | null>(null);

// ── Win probability calculator ────────────────────────────────────────

function calcWinProbability(
  runs: number,
  wickets: number,
  overs: string,
  target: string,
  runRate: number,
): string {
  const targetNum = parseInt(target);
  if (!targetNum || targetNum <= 0 || target === '-') {
    // First innings — estimate from run rate
    const oversFloat = parseFloat(overs) || 0;
    const projectedScore = oversFloat > 0 ? Math.round((runs / oversFloat) * 20) : 0;
    const prob = Math.min(95, Math.max(5, 40 + (projectedScore - 160) / 2));
    return `${Math.round(prob)}%`;
  }
  // Second innings — simplified chase model
  const needed = targetNum - runs;
  const oversFloat = parseFloat(overs) || 0;
  const ballsLeft = Math.max(0, (20 - oversFloat) * 6);
  const requiredRate = ballsLeft > 0 ? (needed / ballsLeft) * 6 : 99;
  const wicketsLeft = 10 - wickets;

  if (needed <= 0) return '99%';
  if (ballsLeft <= 0) return '1%';

  // Base: need vs required rate ratio
  const rateRatio = requiredRate > 0 ? runRate / requiredRate : 1;
  const wicketFactor = wicketsLeft / 10;
  const prob = Math.min(95, Math.max(5, rateRatio * wicketFactor * 60));
  return `${Math.round(prob)}%`;
}

// ── Provider ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'vibestump_user_profile';

function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return { gender: 'unset', favoriteTeam: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UserProfile;
  } catch { /* ignore */ }
  return { gender: 'unset', favoriteTeam: null };
}

export function VibeStumpProvider({ children }: { children: React.ReactNode }) {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(1);
  const [userProfile, setUserProfileState] = useState<UserProfile>(loadProfile);

  const { score, insights } = useVibeStore();

  // Persist user profile
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    } catch { /* ignore */ }
  }, [userProfile]);

  const setUserProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfileState(prev => ({ ...prev, ...patch }));
  }, []);

  // Derived live match state
  const runs = score?.runs ?? 0;
  const wickets = score?.wickets ?? 0;
  const currentOver = score?.overs ?? '0.0';
  const liveScore = `${runs}/${wickets}`;
  const winProbability = useMemo(
    () => calcWinProbability(
      runs, wickets, currentOver,
      score?.target ?? '-',
      score?.run_rate ?? 0,
    ),
    [runs, wickets, currentOver, score?.target, score?.run_rate],
  );

  // Agent reaction text — use latest insight text for marquee
  const agentReactionText = useMemo(() => {
    if (insights && insights.length > 0) return insights[0].text;
    if (score) {
      const batting = score.batting_team || 'Team';
      return `${batting} are batting at ${runs}/${wickets} in ${currentOver} overs · CRR: ${score.run_rate?.toFixed(2) ?? '0.00'} · Follow the action live on VibeStump!`;
    }
    return 'Welcome to VibeStump — Agentic Premier League! Real-time AI-powered IPL analytics powered by Google Gemini. 🏏';
  }, [insights, score, runs, wickets, currentOver]);

  const value: VibeStumpContextValue = useMemo(() => ({
    activeScreen, setActiveScreen,
    liveScore, wickets, runs, currentOver, winProbability,
    agentReactionText,
    userProfile, setUserProfile,
  }), [
    activeScreen, liveScore, wickets, runs, currentOver, winProbability,
    agentReactionText, userProfile, setUserProfile,
  ]);

  return (
    <VibeStumpStateContext.Provider value={value}>
      {children}
    </VibeStumpStateContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────

export function useVibeStump(): VibeStumpContextValue {
  const ctx = useContext(VibeStumpStateContext);
  if (!ctx) throw new Error('useVibeStump must be used inside <VibeStumpProvider>');
  return ctx;
}

export default VibeStumpStateContext;
