'use client';

import { useEffect, useState, useCallback } from 'react';
import { useVibeStore, TEAM_THEMES } from '@/lib/store';
import { fetchScore, fetchCommentary, analyzeVibe } from '@/lib/api';
import LiveScoreTicker from '@/components/LiveScoreTicker';
import TournamentHub from '@/components/TournamentHub';
import MatchFeed from '@/components/MatchFeed';
import AgentIntelligence from '@/components/AgentIntelligence';
import TeamSelector from '@/components/TeamSelector';

export default function Home() {
  const {
    selectedTeam, ballCount, demoMode, diversionActive,
    vibeHistory, nextBall, addVibe, setDiversion,
  } = useVibeStore();

  const [score, setScore] = useState<any>(null);
  const [commentary, setCommentary] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  const theme = TEAM_THEMES[selectedTeam];

  // Apply CSS variables for dynamic team theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.glow);
    root.style.setProperty('--color-secondary',
      theme.secondary.startsWith('#') ? hexToRgb(theme.secondary) : theme.secondary
    );
  }, [selectedTeam, theme]);

  // Agentic Loop
  const runAgentLoop = useCallback(async () => {
    if (diversionActive) return;
    try {
      const [scoreData, commData] = await Promise.all([
        fetchScore(ballCount, demoMode),
        fetchCommentary(ballCount, demoMode),
      ]);
      setScore(scoreData);
      setCommentary(commData.commentary);

      const result = await analyzeVibe(commData.commentary);
      setAnalysis(result);
      addVibe(result.vibe_score);

      // Diversion check
      const vh = [...vibeHistory, result.vibe_score];
      if (vh.length >= 2 && vh[vh.length - 1] < -7 && vh[vh.length - 2] < -7) {
        setDiversion(true);
        return;
      }
      nextBall();
    } catch (e) {
      console.error('[AgenticLoop]', e);
    }
  }, [ballCount, demoMode, diversionActive, vibeHistory, addVibe, nextBall, setDiversion]);

  useEffect(() => {
    runAgentLoop();
    if (diversionActive) return;
    const interval = setInterval(runAgentLoop, demoMode ? 8000 : 30000);
    return () => clearInterval(interval);
  }, [runAgentLoop, demoMode, diversionActive]);

  return (
    <div className="min-h-screen flex flex-col">
      <LiveScoreTicker score={score} />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_380px] gap-4 p-4">
        <aside className="hidden lg:block"><TournamentHub /></aside>
        <main><MatchFeed commentary={commentary} analysis={analysis} /></main>
        <aside><AgentIntelligence analysis={analysis} /></aside>
      </div>
      <TeamSelector />
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
