'use client';

import { useEffect, useState, useCallback } from 'react';
import { useVibeStore, TEAM_THEMES } from '@/lib/store';
import { fetchScore, fetchCommentary, analyzeVibe } from '@/lib/api';
import { fetchOracle, useOracle } from '@/lib/useOracle';
import { soundManager } from '@/lib/SoundManager';

import LiveScoreTicker from '@/components/LiveScoreTicker';
import TournamentHub from '@/components/TournamentHub';
import MatchFeed from '@/components/MatchFeed';
import AgentIntelligence from '@/components/AgentIntelligence';
import TeamSelector from '@/components/TeamSelector';
import BackgroundAmbience from '@/components/BackgroundAmbience';
import LiveMatchPlayer from '@/components/LiveMatchPlayer';
import BroadcastOverlay from '@/components/BroadcastOverlay';
import OracleChat from '@/components/OracleChat';

export default function Home() {
  const {
    selectedTeam, ballCount, demoMode, diversionActive,
    vibeHistory, nextBall, addVibe, setDiversion,
  } = useVibeStore();

  const [score, setScore] = useState<any>(null);
  const [commentary, setCommentary] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [oracleResult, setOracleResult] = useState<{ eventType: string, reaction: string }>({ eventType: 'none', reaction: '' });

  const theme = TEAM_THEMES[selectedTeam];
  const { handleOracleResult } = useOracle();

  // Apply CSS variables for dynamic team theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.glow);
    root.style.setProperty('--color-secondary',
      theme.secondary.startsWith('#') ? hexToRgb(theme.secondary) : theme.secondary
    );
  }, [selectedTeam, theme]);

  // Init SoundManager on first click
  useEffect(() => {
    const initSound = () => soundManager.init();
    window.addEventListener('click', initSound, { once: true });
    return () => window.removeEventListener('click', initSound);
  }, []);

  // Agentic Loop
  const runAgentLoop = useCallback(async () => {
    if (diversionActive) return;
    try {
      const [scoreData, commData] = await Promise.all([
        fetchScore(ballCount, demoMode),
        fetchCommentary(ballCount, demoMode),
      ]);
      
      // If live mode and commentary hasn't changed, do not process Oracle or animations
      if (!demoMode && commentary === commData.commentary) {
        return; // Wait for the next poll
      }

      setScore(scoreData);
      setCommentary(commData.commentary);

      const [vibeRes, oracleRes] = await Promise.all([
        analyzeVibe(commData.commentary),
        fetchOracle(commData.commentary, selectedTeam)
      ]);
      
      setAnalysis(vibeRes);
      addVibe(vibeRes.vibe_score);
      
      setOracleResult({ eventType: oracleRes.eventType, reaction: oracleRes.reaction });
      handleOracleResult(oracleRes);

      // Diversion check
      const vh = [...vibeHistory, vibeRes.vibe_score];
      if (vh.length >= 2 && vh[vh.length - 1] < -7 && vh[vh.length - 2] < -7) {
        setDiversion(true);
        return;
      }
      nextBall();
    } catch (e) {
      console.error('[AgenticLoop]', e);
    }
  }, [ballCount, demoMode, diversionActive, vibeHistory, addVibe, nextBall, setDiversion, selectedTeam, handleOracleResult, commentary]);

  useEffect(() => {
    runAgentLoop();
    if (diversionActive) return;
    // Aggressive polling for live updates
    const interval = setInterval(runAgentLoop, demoMode ? 8000 : 5000);
    return () => clearInterval(interval);
  }, [runAgentLoop, demoMode, diversionActive]);

  return (
    <div className="min-h-screen flex flex-col relative text-white">
      <BackgroundAmbience />
      <BroadcastOverlay eventType={oracleResult.eventType} reaction={oracleResult.reaction} />

      <LiveScoreTicker score={score} />
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_360px] gap-6 p-6">
        {/* Left Sidebar: Tournament & Gamification */}
        <aside className="hidden lg:flex flex-col gap-4">
          <TournamentHub />
        </aside>

        {/* Center: Live Stream & Match Feed */}
        <main className="flex flex-col gap-6">
          <LiveMatchPlayer />
          <MatchFeed commentary={commentary} analysis={analysis} />
        </main>

        {/* Right Sidebar: Agentic Intelligence */}
        <aside className="flex flex-col gap-4">
          <AgentIntelligence analysis={analysis} />
        </aside>
      </div>

      <OracleChat />
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
