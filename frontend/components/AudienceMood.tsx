'use client';

import { useVibeStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ── Mood definitions keyed by event type ─────────────────────────────

const MOODS = {
  WICKET: {
    label: '💀 Wicket! Drama in the Stadium!',
    sub: 'Batting fans heartbroken · Bowlers celebrate',
    bg: 'from-red-600/20 to-red-950/30',
    border: 'border-red-500/40',
    color: '#ef4444',
    bar: 92,
    emojis: ['😱', '💀', '🎉', '😭', '🔥', '😤'],
    idle: '😬 Tense Cricket',
  },
  SIX: {
    label: '🚀 SIX! The Crowd Goes Ballistic!',
    sub: 'Stadium erupts · Pure cricketing bliss',
    bg: 'from-purple-600/20 to-purple-950/30',
    border: 'border-purple-500/40',
    color: '#a855f7',
    bar: 100,
    emojis: ['🔥', '💥', '🎉', '🚀', '🙌', '😍'],
    idle: '🎊 Crowd Hyped',
  },
  FOUR: {
    label: '🏏 FOUR! Beautiful Cricket Shot!',
    sub: 'Fans on their feet · Great batting',
    bg: 'from-green-600/20 to-green-950/30',
    border: 'border-green-500/40',
    color: '#22c55e',
    bar: 78,
    emojis: ['👏', '🎊', '😃', '💪', '✨', '🏏'],
    idle: '😊 Good Vibes',
  },
  RUNS: {
    label: '⚡ Runs Flowing!',
    sub: 'Batters working hard · Match on',
    bg: 'from-amber-600/15 to-amber-950/20',
    border: 'border-amber-500/30',
    color: '#f59e0b',
    bar: 55,
    emojis: ['👏', '🏏', '⚡', '😊', '🎺'],
    idle: '⚡ Building Momentum',
  },
  NONE: {
    label: '🏟️ Stadium Atmosphere',
    sub: 'IPL fans in full voice · Electric crowd',
    bg: 'from-blue-600/10 to-slate-950/20',
    border: 'border-blue-500/20',
    color: '#6366f1',
    bar: 42,
    emojis: ['👏', '🏏', '🎺', '🏟️', '⚡', '🇮🇳'],
    idle: '🏟️ Watching Closely',
  },
};

type MoodKey = keyof typeof MOODS;

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  delay: number;
}

let _emojiId = 0;

export default function AudienceMood() {
  const { activeEvent } = useVibeStore();
  const [memeUrl, setMemeUrl] = useState<string | null>(null);
  const [memeLoading, setMemeLoading] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const prevEventRef = useRef<string>('');

  // Determine current mood
  const eventKey: MoodKey =
    activeEvent && activeEvent in MOODS ? (activeEvent as MoodKey) : 'NONE';
  const mood = MOODS[eventKey];

  // Fetch meme from backend when a meaningful event fires
  useEffect(() => {
    if (!activeEvent || activeEvent === 'NONE' || activeEvent === prevEventRef.current) return;
    prevEventRef.current = activeEvent;

    setMemeLoading(true);
    setMemeUrl(null);

    fetch(`/api/meme?event_type=${encodeURIComponent(activeEvent)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.url) setMemeUrl(d.url);
      })
      .catch(() => {/* stay with emoji fallback */})
      .finally(() => setMemeLoading(false));
  }, [activeEvent]);

  // Spawn floating emojis on event change
  useEffect(() => {
    if (!activeEvent || activeEvent === 'NONE') return;
    const emojiPool = mood.emojis;
    const newOnes: FloatingEmoji[] = Array.from({ length: 8 }, (_, i) => ({
      id: ++_emojiId,
      emoji: emojiPool[i % emojiPool.length],
      x: 5 + Math.random() * 90,
      delay: i * 0.12,
    }));
    setFloatingEmojis((prev) => [...prev.slice(-12), ...newOnes]);

    const timer = setTimeout(() => {
      const ids = new Set(newOnes.map((e) => e.id));
      setFloatingEmojis((prev) => prev.filter((e) => !ids.has(e.id)));
    }, 3200);
    return () => clearTimeout(timer);
  }, [activeEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`glass rounded-2xl border transition-colors duration-500 overflow-hidden relative ${mood.border} bg-gradient-to-br ${mood.bg}`}
    >
      {/* Floating emoji particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((e) => (
            <motion.span
              key={e.id}
              initial={{ y: '110%', x: `${e.x}%`, opacity: 1, scale: 0.8 }}
              animate={{ y: '-15%', opacity: 0, scale: 1.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: 'easeOut', delay: e.delay }}
              className="absolute text-xl select-none"
            >
              {e.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[rgb(var(--color-muted))] uppercase tracking-wider">
            Audience Mood
          </h3>
          <span className="text-[10px] text-[rgb(var(--color-muted))] opacity-70">
            {mood.idle}
          </span>
        </div>

        {/* Mood label with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={eventKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-sm font-bold mb-0.5" style={{ color: mood.color }}>
              {mood.label}
            </p>
            <p className="text-[11px] text-[rgb(var(--color-muted))] mb-3">
              {mood.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Crowd energy bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-[rgb(var(--color-muted))] mb-1.5">
            <span>Crowd Energy</span>
            <span style={{ color: mood.color }}>{mood.bar}%</span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(var(--color-surface),0.6)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${mood.color}99, ${mood.color})` }}
              initial={{ width: '10%' }}
              animate={{ width: `${mood.bar}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Emoji crowd row */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {mood.emojis.map((emoji, i) => (
            <motion.span
              key={`${eventKey}-${i}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300 }}
              className="text-xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>

        {/* Meme image (Tenor API — online only) */}
        <AnimatePresence mode="wait">
          {memeLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-6"
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: `${mood.color}66`, borderTopColor: 'transparent' }}
              />
            </motion.div>
          )}

          {memeUrl && !memeLoading && (
            <motion.div
              key="meme"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: `${mood.color}33` }}
            >
              {/* eslint-disable @next/next/no-img-element */}
              <img
                src={memeUrl}
                alt="Crowd reaction meme"
                className="w-full object-cover max-h-52"
                onError={() => setMemeUrl(null)}
              />
              <p className="text-[10px] text-center text-[rgb(var(--color-muted))] py-1 opacity-60">
                Powered by Tenor
              </p>
            </motion.div>
          )}

          {/* Offline emoji fallback — shown when no meme and an event is active */}
          {!memeUrl && !memeLoading && eventKey !== 'NONE' && (
            <motion.div
              key={`emoji-fallback-${eventKey}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-4 py-5 rounded-xl"
              style={{ background: `${mood.color}12` }}
            >
              {mood.emojis.slice(0, 3).map((e, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: 2 }}
                  className="text-5xl"
                >
                  {e}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
