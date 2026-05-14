'use client';

import {
  fetchCommentary, fetchHighlights, fetchInsights,
  fetchLiveScore, fetchMatches, fetchScoreProgression,
} from '@/lib/api';
import { soundManager } from '@/lib/SoundManager';
import { getTeamGlow, useVibeStore } from '@/lib/store';
import { BarChart2, Calendar, Radio, Trophy, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import AgentCommentary from '@/components/AgentCommentary';
import Commentary from '@/components/Commentary';
import Header from '@/components/Header';
import Highlights from '@/components/Highlights';
import Jumbotron, { type JumbotronEvent } from '@/components/Jumbotron';
import MatchSelector from '@/components/MatchSelector';
import PointsTable from '@/components/PointsTable';
import PreviousMatches from '@/components/PreviousMatches';
import RunsGraph from '@/components/RunsGraph';
import Scoreboard from '@/components/Scoreboard';
import TeamsGrid from '@/components/TeamsGrid';
import UpcomingMatches from '@/components/UpcomingMatches';

// ── Tab definitions ────────────────────────────────────────────────

const TABS = [
  { id: 'live', label: 'Live Match', Icon: Radio, dot: true },
  { id: 'results', label: 'Results', Icon: BarChart2, dot: false },
  { id: 'schedule', label: 'Schedule', Icon: Calendar, dot: false },
  { id: 'standings', label: 'Standings', Icon: Trophy, dot: false },
  { id: 'teams', label: 'Teams', Icon: Users, dot: false },
] as const;
type TabId = (typeof TABS)[number]['id'];

function SectionHeading({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-6">
      <span className="text-2xl">{emoji}</span>
      <div>
        <h2 className="text-xl font-black tracking-tight text-[rgb(var(--color-text))]">{title}</h2>
        {sub && <p className="text-xs text-[rgb(var(--color-muted))] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// Map store event types → JumbotronEvent
function toJumbotronEvent(activeEvent: string | null): JumbotronEvent {
  if (!activeEvent) return 'none';
  const map: Record<string, JumbotronEvent> = {
    'SIX': 'six', 'FOUR': 'four', 'WICKET': 'wicket',
    'NOBALL': 'noball', 'RUNS': 'dot', 'NONE': 'none',
  };
  return map[activeEvent] ?? 'none';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const [isTimeout, setIsTimeout] = useState(false);

  const {
    selectedMatchId, setSelectedMatchId,
    setMatches, setScore, setCommentary, setScoreProgression,
    setHighlights, setInsights, triggerEvent, activeEvent,
  } = useVibeStore();

  const prevCommentaryRef = useRef<string>('');
  const soundInitRef = useRef(false);
  const jumbotronEvent = toJumbotronEvent(activeEvent);

  // Init sound on first interaction
  useEffect(() => {
    if (soundInitRef.current) return;
    const init = () => { soundManager.init(); soundInitRef.current = true; };
    window.addEventListener('click', init, { once: true });
    return () => window.removeEventListener('click', init);
  }, []);

  // Fetch matches on mount, auto-select first match
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matches = await fetchMatches();
        setMatches(matches);
        if (matches.length > 0 && !selectedMatchId) {
          // Prefer a LIVE match, otherwise pick the first
          const live = matches.find((m: { status: string }) => m.status === 'LIVE');
          setSelectedMatchId(live ? live.id : matches[0].id);
        }
      } catch (e) {
        console.error('[Matches]', e);
      }
    };
    loadMatches();
    const interval = setInterval(loadMatches, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll live data for the selected match
  const pollMatchData = useCallback(async () => {
    if (!selectedMatchId) return;
    try {
      const [score, commentary, progression, insights] = await Promise.all([
        fetchLiveScore(selectedMatchId),
        fetchCommentary(selectedMatchId),
        fetchScoreProgression(selectedMatchId),
        fetchInsights(selectedMatchId),
      ]);

      if (score && !score.error) setScore(score);
      if (Array.isArray(commentary)) setCommentary(commentary);
      if (Array.isArray(progression)) setScoreProgression(progression);
      if (Array.isArray(insights)) setInsights(insights);

      // Detect new events for glow + sound
      if (Array.isArray(commentary) && commentary.length > 0) {
        const latest = commentary[0];
        const latestKey = `${latest.created_at}-${latest.text}`;
        if (latestKey !== prevCommentaryRef.current && latest.event_type !== 'NONE' && latest.event_type !== 'RUNS') {
          prevCommentaryRef.current = latestKey;
          const glowColor = getTeamGlow(latest.text);
          triggerEvent(latest.event_type, glowColor);

          // Play sound effect
          if (latest.event_type === 'WICKET') soundManager.play('wicket');
          else if (latest.event_type === 'SIX') soundManager.play('six');
          else if (latest.event_type === 'FOUR') soundManager.play('boundary');
        }
      }
    } catch (e) {
      console.error('[Poll]', e);
    }
  }, [selectedMatchId, setScore, setCommentary, setScoreProgression, setInsights, triggerEvent]);

  useEffect(() => {
    pollMatchData();
    const interval = setInterval(pollMatchData, 5000);
    return () => clearInterval(interval);
  }, [pollMatchData]);

  // Fetch highlights periodically
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const hl = await fetchHighlights();
        if (Array.isArray(hl)) setHighlights(hl);
      } catch (e) {
        console.error('[Highlights]', e);
      }
    };
    loadHighlights();
    const interval = setInterval(loadHighlights, 120000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-[rgb(var(--color-bg))]">

      {/* Sticky: Header + tab navigation */}
      <div className="sticky top-0 z-50">
        <Header />

        <nav className="glass border-b border-[rgba(var(--color-border),0.3)] shadow-sm">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
            <div
              className="flex items-center gap-0.5 overflow-x-auto py-1.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              {TABS.map(({ id, label, Icon, dot }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${active
                      ? 'bg-[rgba(var(--color-primary),0.14)] text-[rgb(var(--color-primary))] border border-[rgba(var(--color-primary),0.28)]'
                      : 'text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-text))] hover:bg-[rgba(var(--color-surface),0.5)] border border-transparent'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{label}</span>
                    {dot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <main className="flex-1">

        {/* LIVE */}
        {activeTab === 'live' && (
          <div>
            <MatchSelector />
            <Scoreboard />
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-10 pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 flex flex-col gap-5">
                  <RunsGraph />
                  <Commentary />
                  <Highlights />
                </div>
                <div className="flex flex-col gap-5">
                  <Jumbotron
                    currentEvent={jumbotronEvent}
                    isTimeout={isTimeout}
                    onTimeoutEnd={() => setIsTimeout(false)}
                  />
                  <AgentCommentary />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {activeTab === 'results' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <SectionHeading
              emoji="📊"
              title="Recent Match Results"
              sub="IPL 2026 — completed matches with scorecards and key performers"
            />
            <PreviousMatches />
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <SectionHeading
              emoji="🗓️"
              title="Upcoming Fixtures"
              sub="IPL 2026 — confirmed match dates, venues and teams"
            />
            <UpcomingMatches fullPage />
          </div>
        )}

        {/* STANDINGS */}
        {activeTab === 'standings' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <SectionHeading
              emoji="🏆"
              title="IPL 2026 Points Table"
              sub="Current standings — top 4 teams qualify for playoffs"
            />
            <PointsTable fullPage />
          </div>
        )}

        {/* TEAMS */}
        {activeTab === 'teams' && (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
            <SectionHeading
              emoji="🏏"
              title="IPL 2026 Franchises"
              sub="All 10 teams — tap any team to view squad, form and upcoming fixtures"
            />
            <TeamsGrid />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[rgb(var(--color-muted))] py-5 border-t border-[rgba(var(--color-border),0.15)]">
        <p className="opacity-70 tracking-wide">
          Made with ❤️ by{' '}
          <span className="font-semibold text-[rgb(var(--color-text))]">Sundareshwaran Sukumar</span>
          {' '}· VibeStump — Agentic Premier League
        </p>
        <p className="opacity-30 text-[10px] mt-1 tracking-widest">© 2026 VibeStump. All rights reserved.</p>
      </footer>
    </div>
  );
}
