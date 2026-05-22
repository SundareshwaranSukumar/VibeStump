'use client';

/**
 * page.tsx — VibeStump 4-Screen SPA root.
 *
 * Navigation controlled by VibeStumpStateContext.activeScreen:
 *   1 = Cinematic Gate (Landing)
 *   2 = Cricket Analyst Metrics Hub (Data Deck)
 *   3 = AR Immersive Arena
 *   4 = Macro Intelligence Hub (Scout Suite)
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

import {
  fetchCommentary, fetchHighlights, fetchInsights,
  fetchLiveScore, fetchMatches, fetchScoreProgression,
} from '@/lib/api';
import { soundManager } from '@/lib/SoundManager';
import { getTeamGlow, useVibeStore } from '@/lib/store';
import { VibeStumpProvider, useVibeStump } from '@/lib/VibeStumpStateContext';

// Screen imports — lazy loaded after context is ready
import ScreenLanding  from '@/components/screens/ScreenLanding';
import ScreenDataDeck from '@/components/screens/ScreenDataDeck';
import ScreenAR       from '@/components/screens/ScreenAR';
import ScreenScout    from '@/components/screens/ScreenScout';

// ── Screen transition variants ────────────────────────────────────────

import type { Variants } from 'framer-motion';

const SLIDE_VARIANTS: Variants = {
  initial:  { opacity: 0, y: 28, scale: 0.97 },
  animate:  { opacity: 1, y: 0,  scale: 1,    transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit:     { opacity: 0, y: -20, scale: 0.96, transition: { duration: 0.22, ease: 'easeIn' } },
};

// ── Data polling engine (inner component, uses both stores) ───────────

function DataPoller() {
  const {
    selectedMatchId, setSelectedMatchId,
    setMatches, setScore, setCommentary, setScoreProgression,
    setHighlights, setInsights, triggerEvent,
  } = useVibeStore();

  const prevCommentaryRef = useRef<string>('');
  const soundInitRef = useRef(false);

  // Init sound on first interaction
  useEffect(() => {
    if (soundInitRef.current) return;
    const init = () => { soundManager.init(); soundInitRef.current = true; };
    window.addEventListener('click', init, { once: true });
    return () => window.removeEventListener('click', init);
  }, []);

  // Fetch matches on mount, auto-select first LIVE match
  useEffect(() => {
    const load = async () => {
      try {
        const ms = await fetchMatches();
        setMatches(ms);
        if (ms.length > 0 && !selectedMatchId) {
          const live = ms.find((m: { status: string }) => m.status === 'LIVE');
          setSelectedMatchId(live ? live.id : ms[0].id);
        }
      } catch (e) {
        console.error('[Matches]', e);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll live match data every 5 seconds
  const poll = useCallback(async () => {
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

      // Detect new events → trigger glow + sound
      if (Array.isArray(commentary) && commentary.length > 0) {
        const latest = commentary[0];
        const key = `${latest.created_at}-${latest.text}`;
        if (
          key !== prevCommentaryRef.current &&
          latest.event_type !== 'NONE' &&
          latest.event_type !== 'RUNS'
        ) {
          prevCommentaryRef.current = key;
          triggerEvent(latest.event_type, getTeamGlow(latest.text));
          if (latest.event_type === 'WICKET')   soundManager.play('wicket');
          else if (latest.event_type === 'SIX') soundManager.play('six');
          else if (latest.event_type === 'FOUR')soundManager.play('boundary');
        }
      }
    } catch (e) {
      console.error('[Poll]', e);
    }
  }, [selectedMatchId, setScore, setCommentary, setScoreProgression, setInsights, triggerEvent]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [poll]);

  // Fetch highlights every 2 minutes
  useEffect(() => {
    const load = async () => {
      try {
        const hl = await fetchHighlights();
        if (Array.isArray(hl)) setHighlights(hl);
      } catch (e) {
        console.error('[Highlights]', e);
      }
    };
    load();
    const interval = setInterval(load, 120_000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // Pure side-effect component
}

// ── 4-Screen router ───────────────────────────────────────────────────

function AppScreens() {
  const { activeScreen, setActiveScreen } = useVibeStump();

  return (
    <div className="relative min-h-screen overflow-hidden hw-accel" style={{ willChange: 'contents' }}>
      <AnimatePresence mode="wait">

        {activeScreen === 1 && (
          <motion.div key="screen-1" {...SLIDE_VARIANTS} className="min-h-screen">
            <ScreenLanding onEnter={() => setActiveScreen(2)} />
          </motion.div>
        )}

        {activeScreen === 2 && (
          <motion.div key="screen-2" {...SLIDE_VARIANTS} className="min-h-screen">
            <ScreenDataDeck onGoLive={() => setActiveScreen(3)} />
          </motion.div>
        )}

        {activeScreen === 3 && (
          <motion.div key="screen-3" {...SLIDE_VARIANTS} className="min-h-screen">
            <ScreenAR onBack={() => setActiveScreen(2)} />
          </motion.div>
        )}

        {activeScreen === 4 && (
          <motion.div key="screen-4" {...SLIDE_VARIANTS} className="min-h-screen">
            <ScreenScout />
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Global bottom nav (screens 2, 3, 4) ─────────────────── */}
      {activeScreen !== 1 && (
        <motion.nav
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pb-safe"
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex gap-1 mb-3 glass border border-white/10 rounded-2xl px-2 py-1.5 shadow-2xl md-surface-3">
            {[
              { screen: 2 as const, emoji: '📊', label: 'Data Deck' },
              { screen: 3 as const, emoji: '🏟️', label: 'AR Arena' },
              { screen: 4 as const, emoji: '🔍', label: 'Scout' },
            ].map(({ screen, emoji, label }) => {
              const active = activeScreen === screen;
              return (
                <button
                  key={screen}
                  onClick={() => setActiveScreen(screen)}
                  className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl text-[10px] font-bold transition-all ${
                    active
                      ? 'text-white bg-white/10 scale-105'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                  style={active ? { willChange: 'transform' } : {}}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="tracking-wide">{label}</span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </div>
  );
}

// ── Root page — wraps with provider ──────────────────────────────────

export default function Home() {
  return (
    <VibeStumpProvider>
      <DataPoller />
      <AppScreens />
    </VibeStumpProvider>
  );
}
