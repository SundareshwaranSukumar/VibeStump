/**
 * store.ts — Zustand global state for VibeStump.
 * Manages team selection, vibe history, ball count, and diversion state.
 */
import { create } from 'zustand';

export type TeamName = 'RCB' | 'KKR' | 'CSK' | 'MI' | 'SRH' | 'GT' | 'DC' | 'LSG' | 'PBKS' | 'RR';

export interface TeamColors {
  primary: string;
  secondary: string;
  glow: string;
}

export const TEAM_THEMES: Record<TeamName, TeamColors> = {
  RCB:  { primary: '#E21836', secondary: '#DAB14F', glow: '226, 24, 54' },
  KKR:  { primary: '#3A225D', secondary: '#FFD700', glow: '58, 34, 93' },
  CSK:  { primary: '#FACC15', secondary: '#1E3A8A', glow: '250, 204, 21' },
  MI:   { primary: '#004BA0', secondary: '#DAB14F', glow: '0, 75, 160' },
  SRH:  { primary: '#FF6600', secondary: '#1E1E1E', glow: '255, 102, 0' },
  GT:   { primary: '#39B5E0', secondary: '#1C1C2E', glow: '57, 181, 224' },
  DC:   { primary: '#004C93', secondary: '#EF4444', glow: '0, 76, 147' },
  LSG:  { primary: '#A5F3FC', secondary: '#1E3A5F', glow: '165, 243, 252' },
  PBKS: { primary: '#DD1F2D', secondary: '#D4A843', glow: '221, 31, 45' },
  RR:   { primary: '#E73895', secondary: '#254AA5', glow: '231, 56, 149' },
};

export interface VibeState {
  selectedTeam: TeamName;
  vibeHistory: number[];
  ballCount: number;
  demoMode: boolean;
  diversionActive: boolean;
  diversionMessage: string | null;
  fanPoints: number;
  currentPrediction: string | null;
  setTeam: (team: TeamName) => void;
  addVibe: (score: number) => void;
  nextBall: () => void;
  resetMatch: () => void;
  setDiversion: (active: boolean, msg?: string | null) => void;
  toggleDemo: () => void;
  addPoints: (amount: number) => void;
  setPrediction: (pred: string | null) => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  selectedTeam: 'RCB',
  vibeHistory: [],
  ballCount: 0,
  demoMode: true,
  diversionActive: false,
  diversionMessage: null,
  fanPoints: 0,
  currentPrediction: null,

  setTeam: (team) => set({ selectedTeam: team }),
  addVibe: (score) => set((s) => ({ vibeHistory: [...s.vibeHistory, score] })),
  nextBall: () => set((s) => ({ ballCount: s.ballCount + 1 })),
  resetMatch: () => set({ vibeHistory: [], ballCount: 0, diversionActive: false, diversionMessage: null, fanPoints: 0, currentPrediction: null }),
  setDiversion: (active, msg = null) => set({ diversionActive: active, diversionMessage: msg }),
  toggleDemo: () => set((s) => ({ demoMode: !s.demoMode })),
  addPoints: (amount) => set((s) => ({ fanPoints: s.fanPoints + amount })),
  setPrediction: (pred) => set({ currentPrediction: pred }),
}));
