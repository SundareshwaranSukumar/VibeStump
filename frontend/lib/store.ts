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
  logo: string;
}

export const TEAM_THEMES: Record<TeamName, TeamColors> = {
  RCB: { primary: '#E21836', secondary: '#DAB14F', glow: '226, 24, 54', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/Royal_Challengers_Bengaluru_logo.png/120px-Royal_Challengers_Bengaluru_logo.png' },
  KKR: { primary: '#3A225D', secondary: '#FFD700', glow: '58, 34, 93', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/120px-Kolkata_Knight_Riders_Logo.svg.png' },
  CSK: { primary: '#FACC15', secondary: '#1E3A8A', glow: '250, 204, 21', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/120px-Chennai_Super_Kings_Logo.svg.png' },
  MI: { primary: '#004BA0', secondary: '#DAB14F', glow: '0, 75, 160', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/120px-Mumbai_Indians_Logo.svg.png' },
  SRH: { primary: '#FF6600', secondary: '#1E1E1E', glow: '255, 102, 0', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/81/Sunrisers_Hyderabad.svg/120px-Sunrisers_Hyderabad.svg.png' },
  GT: { primary: '#39B5E0', secondary: '#1C1C2E', glow: '57, 181, 224', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/120px-Gujarat_Titans_Logo.svg.png' },
  DC: { primary: '#004C93', secondary: '#EF4444', glow: '0, 76, 147', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Delhi_Capitals_Logo.svg/120px-Delhi_Capitals_Logo.svg.png' },
  LSG: { primary: '#A5F3FC', secondary: '#1E3A5F', glow: '165, 243, 252', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Lucknow_Super_Giants_IPL_Logo.svg/120px-Lucknow_Super_Giants_IPL_Logo.svg.png' },
  PBKS: { primary: '#DD1F2D', secondary: '#D4A843', glow: '221, 31, 45', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/120px-Punjab_Kings_Logo.svg.png' },
  RR: { primary: '#E73895', secondary: '#254AA5', glow: '231, 56, 149', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/Rajasthan_Royals_Logo.svg/120px-Rajasthan_Royals_Logo.svg.png' },
};

const FULL_NAMES: Record<string, TeamName> = {
  'CHENNAI SUPER KINGS': 'CSK',
  'ROYAL CHALLENGERS BENGALURU': 'RCB',
  'MUMBAI INDIANS': 'MI',
  'KOLKATA KNIGHT RIDERS': 'KKR',
  'SUNRISERS HYDERABAD': 'SRH',
  'DELHI CAPITALS': 'DC',
  'RAJASTHAN ROYALS': 'RR',
  'PUNJAB KINGS': 'PBKS',
  'GUJARAT TITANS': 'GT',
  'LUCKNOW SUPER GIANTS': 'LSG'
};

export function getLogoForTeamName(title: string): string {
  if (!title) return 'https://cdn-icons-png.flaticon.com/512/53/53283.png';
  const t = title.toUpperCase();

  // Check abbreviations
  for (const [key, theme] of Object.entries(TEAM_THEMES)) {
    if (t.includes(key)) return theme.logo;
  }
  // Check full names
  for (const [fullName, key] of Object.entries(FULL_NAMES)) {
    if (t.includes(fullName)) return TEAM_THEMES[key].logo;
  }

  return 'https://cdn-icons-png.flaticon.com/512/53/53283.png';
}

export interface VibeState {
  selectedTeam: TeamName;
  vibeHistory: number[];
  ballCount: number;
  demoMode: boolean;
  diversionActive: boolean;
  diversionMessage: string | null;
  fanPoints: number;
  currentPrediction: string | null;
  selectedMatchId: string | null;
  setTeam: (team: TeamName) => void;
  addVibe: (score: number) => void;
  nextBall: () => void;
  resetMatch: () => void;
  setDiversion: (active: boolean, msg?: string | null) => void;
  toggleDemo: () => void;
  addPoints: (amount: number) => void;
  setPrediction: (pred: string | null) => void;
  setSelectedMatchId: (id: string | null) => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  selectedTeam: 'RCB',
  vibeHistory: [],
  ballCount: 0,
  demoMode: false,
  diversionActive: false,
  diversionMessage: null,
  fanPoints: 0,
  currentPrediction: null,
  selectedMatchId: null,

  setTeam: (team) => set({ selectedTeam: team }),
  addVibe: (score) => set((s) => ({ vibeHistory: [...s.vibeHistory, score] })),
  nextBall: () => set((s) => ({ ballCount: s.ballCount + 1 })),
  resetMatch: () => set({ vibeHistory: [], ballCount: 0, diversionActive: false, diversionMessage: null, fanPoints: 0, currentPrediction: null }),
  setDiversion: (active, msg = null) => set({ diversionActive: active, diversionMessage: msg }),
  toggleDemo: () => set((s) => ({ demoMode: !s.demoMode })),
  addPoints: (amount) => set((s) => ({ fanPoints: s.fanPoints + amount })),
  setPrediction: (pred) => set({ currentPrediction: pred }),
  setSelectedMatchId: (id) => set({ selectedMatchId: id, ballCount: 0, vibeHistory: [] }),
}));
