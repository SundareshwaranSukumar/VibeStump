'use client';

/**
 * ScreenAR.tsx — Immersive AR Arena View (Screen 3).
 *
 * Features:
 * • 3 selectable perspective transforms: longon, midwicket, topdown
 * • Animated IsometricStadium with framer-motion perspective transitions
 * • Jumbotron overlay with live score and scrolling agent marquee
 * • Emoji reaction dock triggering EmojiRain particle bursts
 * • Config modal for team/gender preference on first entry
 */

import EmojiRain from '@/components/EmojiRain';
import type { JumbotronEvent } from '@/components/EmojiRain';
import IsometricStadium from '@/components/IsometricStadium';
import { useVibeStump } from '@/lib/VibeStumpStateContext';
import { TEAM_THEMES } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Settings, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── View modes ────────────────────────────────────────────────────────

type ViewMode = 'longon' | 'midwicket' | 'topdown';

const VIEW_TRANSFORMS: Record<ViewMode, string> = {
  longon: 'perspective(800px) rotateX(25deg) rotateY(-5deg)',
  midwicket: 'perspective(800px) rotateX(15deg) rotateY(20deg)',
  topdown: 'perspective(1200px) rotateX(55deg) rotateY(0deg)',
};

const VIEW_LABELS: Record<ViewMode, string> = {
  longon: 'Long-On Overview',
  midwicket: 'Mid-Wicket Fan Stand',
  topdown: 'Top-Down Blueprints',
};

// ── Emoji reaction config ─────────────────────────────────────────────

const REACTION_BUTTONS: { emoji: string; event: JumbotronEvent }[] = [
  { emoji: '🔥', event: 'six' },
  { emoji: '💥', event: 'six' },
  { emoji: '🙌', event: 'four' },
  { emoji: '😱', event: 'wicket' },
  { emoji: '🏏', event: 'dot' },
  { emoji: '🚀', event: 'six' },
];

// ── Scrolling Marquee ─────────────────────────────────────────────────

function AgentMarquee({ text }: { text: string }) {
  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="whitespace-nowrap text-xs text-white/60 font-medium"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
      >
        {/* Duplicate text for seamless loop */}
        {text}&nbsp;&nbsp;·&nbsp;&nbsp;{text}&nbsp;&nbsp;·&nbsp;&nbsp;
        {text}&nbsp;&nbsp;·&nbsp;&nbsp;{text}
      </motion.div>
    </div>
  );
}

// ── Config Modal ──────────────────────────────────────────────────────

interface ConfigModalProps {
  onClose: () => void;
}

function ConfigModal({ onClose }: ConfigModalProps) {
  const { userProfile, setUserProfile } = useVibeStump();

  const teams: { code: 'CSK' | 'MI'; label: string; color: string }[] = [
    { code: 'CSK', label: 'Chennai Super Kings', color: '#FACC15' },
    { code: 'MI', label: 'Mumbai Indians', color: '#004BA0' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          className="relative w-full max-w-sm rounded-3xl border border-white/10 p-6 sm:p-8"
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 12 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            background: 'rgba(8,12,30,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Title */}
          <h2 className="text-xl font-black text-white mb-1">Customize Your Experience</h2>
          <p className="text-xs text-white/40 mb-6">Choose your team allegiance and viewing preference</p>

          {/* Gender picker */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
              Viewing as
            </p>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setUserProfile({ gender: g })}
                  className="flex-1 py-2 rounded-full text-sm font-bold border capitalize transition-all"
                  style={{
                    borderColor: userProfile.gender === g ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    background: userProfile.gender === g ? 'rgba(99,102,241,0.18)' : 'transparent',
                    color: userProfile.gender === g ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {g === 'male' ? '👨 Male' : '👩 Female'}
                </button>
              ))}
            </div>
          </div>

          {/* Team picker */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
              My Team
            </p>
            <div className="flex flex-col gap-2">
              {teams.map((t) => {
                const theme = TEAM_THEMES[t.code];
                const isSelected = userProfile.favoriteTeam === t.code;
                return (
                  <button
                    key={t.code}
                    onClick={() => setUserProfile({ favoriteTeam: t.code })}
                    className="flex items-center gap-3 rounded-2xl p-3 border transition-all"
                    style={{
                      borderColor: isSelected ? t.color : 'rgba(255,255,255,0.08)',
                      background: isSelected
                        ? `rgba(${theme.glow},0.12)`
                        : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <img
                      src={theme.logo}
                      alt={t.code}
                      className="w-9 h-9 object-contain flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="text-left">
                      <p className="text-sm font-black" style={{ color: isSelected ? t.color : 'rgba(255,255,255,0.6)' }}>
                        {t.code}
                      </p>
                      <p className="text-[10px] text-white/30">{t.label}</p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-xs font-bold" style={{ color: t.color }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enter button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="w-full py-3.5 rounded-full font-black text-white text-base"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 24px rgba(139,92,246,0.3)',
            }}
          >
            Enter Arena 🏟️
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Props ─────────────────────────────────────────────────────────────

interface ScreenARProps {
  onBack: () => void;
}

// ── Main Component ────────────────────────────────────────────────────

export default function ScreenAR({ onBack }: ScreenARProps) {
  const { userProfile, liveScore, currentOver, agentReactionText } = useVibeStump();

  const [viewMode, setViewMode] = useState<ViewMode>('longon');
  const [showConfig, setShowConfig] = useState<boolean>(true);
  const [emojiActive, setEmojiActive] = useState<boolean>(false);
  const [emojiEvent, setEmojiEvent] = useState<JumbotronEvent>('none');
  const emojiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive jersey color from favorite team
  const teamCode = userProfile.favoriteTeam ?? 'CSK';
  const jerseyColor = TEAM_THEMES[teamCode]?.primary ?? '#FCE300';

  // Clear emoji after 3 s
  useEffect(() => {
    return () => {
      if (emojiTimerRef.current) clearTimeout(emojiTimerRef.current);
    };
  }, []);

  function triggerEmoji(event: JumbotronEvent): void {
    if (emojiTimerRef.current) clearTimeout(emojiTimerRef.current);
    setEmojiEvent(event);
    setEmojiActive(true);
    emojiTimerRef.current = setTimeout(() => {
      setEmojiActive(false);
      setEmojiEvent('none');
    }, 3000);
  }

  const perspectiveTransform = VIEW_TRANSFORMS[viewMode];

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, rgba(0,80,40,0.3) 0%, #020617 70%)',
      }}
    >
      {/* ── Config Modal ── */}
      {showConfig && <ConfigModal onClose={() => setShowConfig(false)} />}

      {/* ── Top Bar ── */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3"
        style={{
          background: 'rgba(2,6,23,0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Data Deck</span>
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-sm font-black tracking-widest text-white/80 uppercase">
            AR Immersive Arena
          </h1>
        </div>

        <button
          onClick={() => setShowConfig(true)}
          className="text-white/40 hover:text-white/80 transition-colors p-1"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* ── View Toggle Pills ── */}
      <div className="flex justify-center gap-2 px-4 py-3 flex-wrap">
        {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="rounded-full px-4 py-1.5 text-xs font-bold border transition-all"
            style={{
              borderColor: viewMode === mode ? '#6366f1' : 'rgba(255,255,255,0.1)',
              background: viewMode === mode ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
              color: viewMode === mode ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              boxShadow: viewMode === mode ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
            }}
          >
            {VIEW_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* ── Stadium Container ── */}
      <div className="relative px-4 pb-4" style={{ minHeight: '340px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{
              transform: perspectiveTransform,
              willChange: 'transform, opacity',
              transformOrigin: 'center center',
            }}
            className="relative w-full"
          >
            {/* Emoji rain overlaid on stadium */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
              <EmojiRain event={emojiEvent} isActive={emojiActive} count={20} />
            </div>

            <IsometricStadium jerseyColor={jerseyColor} />
          </motion.div>
        </AnimatePresence>

        {/* ── Jumbotron Overlay ── */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-xs z-10">
          <motion.div
            className="rounded-2xl border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'rgba(4,8,22,0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Score bar */}
            <div className="flex items-center justify-center gap-3 px-4 py-2.5">
              <motion.span
                className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <span
                className="text-2xl font-black tabular-nums"
                style={{ color: '#fff', textShadow: '0 0 16px rgba(255,255,255,0.3)' }}
              >
                {liveScore || '148/6'}
              </span>
              <span className="text-sm text-white/40 font-semibold">
                ({currentOver || '18.2'} ov)
              </span>
            </div>

            {/* Marquee */}
            <div
              className="px-3 py-2 border-t border-white/5"
              style={{ background: 'rgba(99,102,241,0.06)' }}
            >
              <AgentMarquee text={agentReactionText} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Reaction Dock ── */}
      <div
        className="sticky bottom-0 z-30 px-4 py-4"
        style={{
          background: 'rgba(2,6,23,0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <p className="text-[10px] text-white/25 uppercase tracking-widest text-center mb-2">
          React to the action
        </p>
        <div className="flex justify-center gap-3">
          {REACTION_BUTTONS.map(({ emoji, event }, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.25, y: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => triggerEmoji(event)}
              className="text-2xl leading-none p-2 rounded-full border border-white/10 transition-colors hover:border-white/25"
              style={{ background: 'rgba(255,255,255,0.04)', willChange: 'transform' }}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
