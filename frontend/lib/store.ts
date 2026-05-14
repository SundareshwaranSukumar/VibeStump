/**
 * store.ts — Zustand global state for VibeStump.
 */
import { create } from 'zustand';

export type TeamCode = 'RCB' | 'KKR' | 'CSK' | 'MI' | 'SRH' | 'GT' | 'DC' | 'LSG' | 'PBKS' | 'RR';
export type Theme = 'light' | 'dark';

export interface TeamColors {
  primary: string;
  secondary: string;
  glow: string;
  logo: string;
}

export const TEAM_THEMES: Record<TeamCode, TeamColors> = {
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

const FULL_NAMES: Record<string, TeamCode> = {
  'CHENNAI SUPER KINGS': 'CSK',
  'ROYAL CHALLENGERS BENGALURU': 'RCB',
  'ROYAL CHALLENGERS BANGALORE': 'RCB',
  'MUMBAI INDIANS': 'MI',
  'KOLKATA KNIGHT RIDERS': 'KKR',
  'SUNRISERS HYDERABAD': 'SRH',
  'DELHI CAPITALS': 'DC',
  'RAJASTHAN ROYALS': 'RR',
  'PUNJAB KINGS': 'PBKS',
  'GUJARAT TITANS': 'GT',
  'LUCKNOW SUPER GIANTS': 'LSG',
};

export function resolveTeamCode(name: string): TeamCode | null {
  if (!name) return null;
  const upper = name.toUpperCase().trim();
  if (upper in TEAM_THEMES) return upper as TeamCode;
  for (const [fullName, code] of Object.entries(FULL_NAMES)) {
    if (upper.includes(fullName)) return code;
  }
  for (const code of Object.keys(TEAM_THEMES)) {
    if (upper.includes(code)) return code as TeamCode;
  }
  return null;
}

export function getTeamLogo(name: string): string {
  const code = resolveTeamCode(name);
  if (code) return TEAM_THEMES[code].logo;
  return '';
}

export function getTeamGlow(name: string): string {
  const code = resolveTeamCode(name);
  if (code) return TEAM_THEMES[code].glow;
  return '100, 100, 100';
}

export interface LiveScore {
  match_id: string;
  batting_team: string;
  bowling_team: string;
  runs: number;
  wickets: number;
  overs: string;
  target: string;
  run_rate: number;
  required_rate: number;
  match_status: string;
  raw_title: string;
}

export interface Match {
  id: string;
  title: string;
  status: string;
  team1: string;
  team2: string;
}

export interface CommentaryItem {
  text: string;
  event_type: string;
  created_at: string;
}

export interface VibeState {
  theme: Theme;
  selectedMatchId: string | null;
  matches: Match[];
  score: LiveScore | null;
  commentary: CommentaryItem[];
  scoreProgression: { overs: string; runs: number; wickets: number; batting_team?: string }[];
  highlights: { title: string; video_id: string; thumbnail: string }[];
  insights: { text: string; event_type: string; created_at: string }[];
  activeEvent: string | null;
  activeEventGlow: string;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSelectedMatchId: (id: string | null) => void;
  setMatches: (matches: Match[]) => void;
  setScore: (score: LiveScore | null) => void;
  setCommentary: (commentary: CommentaryItem[]) => void;
  setScoreProgression: (data: { overs: string; runs: number; wickets: number; batting_team?: string }[]) => void;
  setHighlights: (highlights: { title: string; video_id: string; thumbnail: string }[]) => void;
  setInsights: (insights: { text: string; event_type: string; created_at: string }[]) => void;
  triggerEvent: (eventType: string, glowColor: string) => void;
  clearEvent: () => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  theme: 'light',
  selectedMatchId: null,
  matches: [],
  score: null,
  commentary: [],
  scoreProgression: [],
  highlights: [],
  insights: [],
  activeEvent: null,
  activeEventGlow: '',

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setSelectedMatchId: (id) => set({ selectedMatchId: id, commentary: [], scoreProgression: [], insights: [] }),
  setMatches: (matches) => set({ matches }),
  setScore: (score) => set({ score }),
  setCommentary: (commentary) => set({ commentary }),
  setScoreProgression: (data) => set({ scoreProgression: data }),
  setHighlights: (highlights) => set({ highlights }),
  setInsights: (insights) => set({ insights }),
  triggerEvent: (eventType, glowColor) => set({ activeEvent: eventType, activeEventGlow: glowColor }),
  clearEvent: () => set({ activeEvent: null, activeEventGlow: '' }),
}));
