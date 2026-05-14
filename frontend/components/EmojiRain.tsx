'use client';

/**
 * EmojiRain.tsx — Dynamic emoji particle engine for VibeStump Jumbotron.
 * Spawns animated emoji particles based on match events.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export type JumbotronEvent = 'six' | 'four' | 'wicket' | 'noball' | 'dot' | 'none' | 'timeout';

interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  scale: number;
  fromTop: boolean; // wickets fall from top
  shakeX?: number;  // noball horizontal shake
}

const EVENT_EMOJIS: Record<JumbotronEvent, { pool: string[]; fromTop: boolean; isShake?: boolean }> = {
  six:     { pool: ['🔥', '🙌', '🚀', '💥', '🎆', '😍', '⚡', '🏏'], fromTop: false },
  four:    { pool: ['👏', '🎊', '😃', '💪', '✨', '🏏', '🎯'], fromTop: false },
  wicket:  { pool: ['😱', '😭', '💔', '🎉', '😤', '💀', '🙈'], fromTop: true },
  noball:  { pool: ['😡', '👎', '⚠️', '😤', '🚨', '🤬'], fromTop: false, isShake: true },
  dot:     { pool: ['😐', '🏏', '⏳', '🤐'], fromTop: false },
  timeout: { pool: ['🌭', '🥤', '⏳', '😴', '🍿'], fromTop: false },
  none:    { pool: ['👏', '🏟️', '🎺', '🇮🇳', '⚡'], fromTop: false },
};

let _particleId = 0;

interface EmojiRainProps {
  event: JumbotronEvent;
  isActive: boolean;
  count?: number;
}

export default function EmojiRain({ event, isActive, count = 12 }: EmojiRainProps) {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const prevEventRef = useRef<string>('');

  useEffect(() => {
    if (!isActive || event === 'none') return;
    const cfg = EVENT_EMOJIS[event] ?? EVENT_EMOJIS.none;

    // Only spawn on event change
    const eventKey = `${event}-${Date.now()}`;
    if (eventKey === prevEventRef.current) return;
    prevEventRef.current = eventKey;

    const batch: EmojiParticle[] = Array.from({ length: count }, (_, i) => ({
      id: ++_particleId,
      emoji: cfg.pool[i % cfg.pool.length],
      x: 2 + Math.random() * 96,
      delay: i * 0.08,
      duration: 1.8 + Math.random() * 1.4,
      scale: 0.8 + Math.random() * 0.8,
      fromTop: cfg.fromTop,
      shakeX: cfg.isShake ? (Math.random() > 0.5 ? 8 : -8) : 0,
    }));

    setParticles(prev => [...prev.slice(-20), ...batch]);

    const ids = new Set(batch.map(p => p.id));
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, 4500);
    return () => clearTimeout(timer);
  }, [event, isActive, count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      <AnimatePresence>
        {particles.map(p => (
          <motion.span
            key={p.id}
            className="absolute text-2xl select-none leading-none"
            style={{ left: `${p.x}%`, ...(p.fromTop ? { top: 0 } : { bottom: 0 }) }}
            initial={{
              opacity: 1,
              y: p.fromTop ? '-10%' : '110%',
              scale: p.scale * 0.4,
              x: 0,
            }}
            animate={p.shakeX ? {
              opacity: [1, 1, 0],
              y: [0, -40, -80],
              x: [0, p.shakeX, -p.shakeX!, p.shakeX, 0],
              scale: [p.scale * 0.5, p.scale * 1.2, p.scale],
            } : {
              opacity: [1, 1, 0],
              y: p.fromTop ? ['0%', '50%', '110%'] : ['110%', '50%', '-10%'],
              scale: [p.scale * 0.4, p.scale * 1.3, p.scale],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
              times: [0, 0.6, 1],
            }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
