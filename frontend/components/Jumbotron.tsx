'use client';

/**
 * Jumbotron.tsx — Stadium LED Jumbotron for VibeStump.
 *
 * Features:
 * • LED dot-matrix background (CSS mesh gradient)
 * • High-impact event decision displays (SIX!, FOUR!, WICKET!, etc.)
 * • EmojiRain crowd emotion engine
 * • Strategic Timeout mode with ticking digital clock
 * • 5-second auto-reset back to "Live Vibe Score"
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { useVibeStore } from '@/lib/store';
import EmojiRain, { type JumbotronEvent } from './EmojiRain';
export type { JumbotronEvent };

// ── Event configuration ──────────────────────────────────────────────

const EVENT_CONFIG: Record<
  Exclude<JumbotronEvent, 'none' | 'timeout'>,
  { label: string; subLabel: string; color: string; glow: string; bg: string }
> = {
  six: {
    label: 'S I X  !',
    subLabel: 'MAXIMUM!',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.7)',
    bg: 'from-purple-900/60 via-indigo-950/40 to-black/60',
  },
  four: {
    label: 'F O U R  !',
    subLabel: 'BOUNDARY!',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.7)',
    bg: 'from-green-900/60 via-emerald-950/40 to-black/60',
  },
  wicket: {
    label: 'W I C K E T  !',
    subLabel: 'OUT!',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.7)',
    bg: 'from-red-900/60 via-rose-950/40 to-black/60',
  },
  noball: {
    label: 'N O   B A L L  !',
    subLabel: 'FREE HIT INCOMING!',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.7)',
    bg: 'from-orange-900/60 via-amber-950/40 to-black/60',
  },
  dot: {
    label: 'D O T',
    subLabel: 'Building pressure...',
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.4)',
    bg: 'from-slate-900/60 via-slate-950/40 to-black/60',
  },
};

const EVENT_ICONS: Record<Exclude<JumbotronEvent, 'none' | 'timeout'>, string> = {
  six: '🚀',
  four: '🏏',
  wicket: '💀',
  noball: '🚨',
  dot: '😐',
};

// ── Digital clock display ────────────────────────────────────────────

function DigitalClock({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return (
    <motion.div
      className="font-mono font-black text-center"
      animate={{ opacity: [1, 0.7, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <span
        className="text-6xl sm:text-8xl tracking-[0.2em] tabular-nums"
        style={{ color: '#fbbf24', textShadow: '0 0 40px #fbbf24, 0 0 80px #f59e0b' }}
      >
        {mins}:{secs}
      </span>
    </motion.div>
  );
}

// ── Props ────────────────────────────────────────────────────────────

export interface JumbotronProps {
  currentEvent: JumbotronEvent;
  isTimeout: boolean;
  onTimeoutEnd: () => void;
}

// ── Main Component ───────────────────────────────────────────────────

export default function Jumbotron({ currentEvent, isTimeout, onTimeoutEnd }: JumbotronProps) {
  const { score } = useVibeStore();

  // Auto-reset: clear event display after 5 seconds
  const [displayEvent, setDisplayEvent] = useState<JumbotronEvent>('none');
  const [emojiActive, setEmojiActive] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timeout countdown
  const [timeoutSeconds, setTimeoutSeconds] = useState(150); // 2m 30s
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (currentEvent === 'none') return;

    setDisplayEvent(currentEvent);
    setEmojiActive(true);

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setDisplayEvent('none');
      setEmojiActive(false);
    }, 5000);

    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [currentEvent]);

  useEffect(() => {
    if (isTimeout) {
      setTimeoutSeconds(150);
      setDisplayEvent('timeout');
      timerIntervalRef.current = setInterval(() => {
        setTimeoutSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            onTimeoutEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (displayEvent === 'timeout') setDisplayEvent('none');
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimeout]); // eslint-disable-line react-hooks/exhaustive-deps

  const isEventActive = displayEvent !== 'none' && displayEvent !== 'timeout';
  const cfg = isEventActive ? EVENT_CONFIG[displayEvent as keyof typeof EVENT_CONFIG] : null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl select-none"
      style={{
        // LED dot-matrix background
        background: `
          radial-gradient(circle at 50% 50%, rgba(15,15,30,0.97) 0%, rgba(5,5,15,0.99) 100%)
        `,
        backgroundSize: '100% 100%',
        minHeight: '200px',
      }}
    >
      {/* Dot-matrix overlay pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
        }}
      />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        animate={{ y: ['0%', '100%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          background: 'linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
        }}
      />

      {/* Emoji rain particles */}
      <EmojiRain
        event={isTimeout ? 'timeout' : displayEvent}
        isActive={isTimeout || emojiActive}
        count={isTimeout ? 6 : displayEvent === 'six' || displayEvent === 'wicket' ? 18 : 12}
      />

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center py-6 px-4 min-h-[200px]">

        {/* Timeout Mode */}
        <AnimatePresence mode="wait">
          {isTimeout && (
            <motion.div
              key="timeout"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center w-full"
            >
              <p
                className="text-xs font-black uppercase tracking-[0.4em] mb-3 opacity-60"
                style={{ color: '#fbbf24' }}
              >
                ⏱ STRATEGIC TIMEOUT
              </p>
              <DigitalClock seconds={timeoutSeconds} />
              <p className="text-xs text-white/40 mt-3 tracking-widest uppercase">
                Match resumes shortly
              </p>
            </motion.div>
          )}

          {/* Event Display */}
          {!isTimeout && isEventActive && cfg && (
            <motion.div
              key={displayEvent}
              initial={{ opacity: 0, scale: 0.5, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`w-full text-center bg-gradient-to-b ${cfg.bg} rounded-xl py-4 px-3`}
            >
              {/* Glow halo */}
              <div
                className="absolute inset-0 rounded-xl opacity-30 blur-xl pointer-events-none"
                style={{ background: cfg.glow }}
              />

              {/* Icon */}
              <motion.span
                className="text-5xl block mb-2 drop-shadow-2xl"
                animate={displayEvent === 'wicket'
                  ? { rotate: [0, -15, 15, -8, 8, 0], scale: [1, 1.3, 1] }
                  : { scale: [1, 1.4, 1, 1.2, 1] }
                }
                transition={{ duration: 0.6, repeat: 3 }}
              >
                {EVENT_ICONS[displayEvent as keyof typeof EVENT_ICONS]}
              </motion.span>

              {/* Main label */}
              <motion.p
                className="font-black text-3xl sm:text-5xl tracking-[0.15em] leading-none"
                initial={{ letterSpacing: '0.6em', opacity: 0 }}
                animate={{ letterSpacing: '0.15em', opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  color: cfg.color,
                  textShadow: `0 0 20px ${cfg.glow}, 0 0 60px ${cfg.glow}`,
                  fontFamily: '"Inter", "Roboto Condensed", sans-serif',
                }}
              >
                {cfg.label}
              </motion.p>

              {/* Sub label */}
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xs font-bold tracking-[0.3em] mt-2 uppercase opacity-70"
                style={{ color: cfg.color }}
              >
                {cfg.subLabel}
              </motion.p>
            </motion.div>
          )}

          {/* Default: Live Vibe Score */}
          {!isTimeout && !isEventActive && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center w-full"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">
                Live Score
              </p>

              {score ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-white/50 uppercase tracking-wider font-bold">
                      {score.batting_team?.split(' ').map((w: string) => w[0]).join('') || 'BAT'}
                    </p>
                    <p
                      className="text-4xl sm:text-5xl font-black tabular-nums"
                      style={{ color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
                    >
                      {score.runs}/{score.wickets}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {score.overs && score.overs !== '0.0' ? `(${score.overs} ov)` : 'batting'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-red-500"
                      animate={{ opacity: [1, 0.2, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    />
                    <div className="text-xs text-white/20 font-bold uppercase tracking-wider">vs</div>
                  </div>

                  <div className="text-left">
                    <p className="text-xs text-white/50 uppercase tracking-wider font-bold">
                      {score.bowling_team?.split(' ').map((w: string) => w[0]).join('') || 'BOWL'}
                    </p>
                    {score.target && score.target !== '-' && score.target !== '0' ? (
                      <>
                        <p className="text-4xl sm:text-5xl font-black tabular-nums text-white/50">
                          {score.target}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">target</p>
                      </>
                    ) : (
                      <p className="text-4xl sm:text-5xl font-black text-white/30">—</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-white/20 text-sm tracking-widest uppercase mt-4">
                  Waiting for match data…
                </p>
              )}

              {/* Run rate strip */}
              {score && score.run_rate > 0 && (
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                  <span>CRR {score.run_rate.toFixed(2)}</span>
                  {score.required_rate > 0 && (
                    <>
                      <span className="opacity-30">·</span>
                      <span>RRR {score.required_rate.toFixed(2)}</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom LED strip */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden">
        <motion.div
          className="h-full"
          animate={{
            background: cfg
              ? [`${cfg.color}ff`, `${cfg.color}44`, `${cfg.color}ff`]
              : ['rgba(99,102,241,0.8)', 'rgba(139,92,246,0.8)', 'rgba(99,102,241,0.8)'],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
