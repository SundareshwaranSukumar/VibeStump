'use client';

/**
 * Scoreboard — TV broadcast-style live match panel.
 *
 * Features:
 * • Wide horizontal score bar (team logos + score + overs) like Star Sports
 * • Crowd emotion meter with animated waveform + energy bar
 * • Full-width TV graphic overlay for WICKET / SIX / FOUR / NO-BALL
 * • Ball-by-ball tracker (last 6 deliveries from commentary)
 * • NO-BALL detection from commentary text + Web Audio alarm buzz
 * • Seamless Framer Motion animations throughout
 */

import {
    getTeamLogo, resolveTeamCode, TEAM_THEMES,
    useVibeStore,
    type CommentaryItem, type LiveScore, type TeamCode,
} from '@/lib/store';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// Event configuration — one entry per event type
// ─────────────────────────────────────────────────────────────────────────

const EVENT_CFG = {
  WICKET: {
    label: 'W I C K E T !', icon: '💀',
    accent: '#ef4444', grad: 'linear-gradient(135deg,#7f1d1d 0%,#3f0808 100%)',
    border: '#dc2626', crowdText: 'Stunned silence… then a ROAR!', energy: 95,
    emojis: ['😱', '💀', '😭', '🔥', '😤', '💔'],
  },
  SIX: {
    label: 'S I X !', icon: '🚀',
    accent: '#a855f7', grad: 'linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)',
    border: '#9333ea', crowdText: 'Stadium ERUPTS — pure cricket bliss!', energy: 100,
    emojis: ['🔥', '💥', '🎆', '🙌', '🚀', '😍'],
  },
  FOUR: {
    label: 'F O U R !', icon: '🏏',
    accent: '#22c55e', grad: 'linear-gradient(135deg,#14532d 0%,#052e16 100%)',
    border: '#16a34a', crowdText: 'Beautiful shot! Crowd on their feet!', energy: 78,
    emojis: ['👏', '🎊', '😃', '💪', '🏏', '✨'],
  },
  NOBALL: {
    label: 'N O   B A L L !', icon: '🚨',
    accent: '#f97316', grad: 'linear-gradient(135deg,#7c2d12 0%,#431407 100%)',
    border: '#ea580c', crowdText: 'FREE HIT! Crowd buzzing with excitement!', energy: 70,
    emojis: ['⚠️', '😮', '🎉', '🏏', '⚡', '😤'],
  },
  RUNS: {
    label: 'R U N S', icon: '⚡',
    accent: '#f59e0b', grad: 'linear-gradient(135deg,#78350f 0%,#1c1917 100%)',
    border: '#d97706', crowdText: 'Building momentum…', energy: 55,
    emojis: ['👏', '⚡', '😊', '🏏', '🎺', '🙌'],
  },
  NONE: {
    label: '', icon: '',
    accent: '#6366f1', grad: 'linear-gradient(135deg,#1e1b4b 0%,#0f0a1e 100%)',
    border: '#4338ca', crowdText: 'IPL fans in full voice…', energy: 42,
    emojis: ['👏', '🏏', '🎺', '🏟️', '⚡', '🇮🇳'],
  },
} as const;

type EventKey = keyof typeof EVENT_CFG;

// ─────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────

function resolveEventKey(activeEvent: string | null, commText: string): EventKey {
  const t = commText.toLowerCase();
  const isNoBall = t.includes('no ball') || t.includes('no-ball') || t.includes('free hit');
  if (isNoBall) return 'NOBALL';
  if (!activeEvent || activeEvent === 'NONE') return 'NONE';
  if (activeEvent in EVENT_CFG) return activeEvent as EventKey;
  return 'NONE';
}

interface InningsInfo { team: string; score: string; overs: string }

function parseInnings(raw: string): InningsInfo[] {
  if (!raw) return [];
  try {
    const part = raw.split('—')[0].trim();
    return part.split(/ v (?=[A-Z])/g).map((seg) => {
      const m = seg.trim().match(/^([A-Z]+)\s+([\d/\-]+)\s*\(([^)]+)\)/);
      if (m) return { team: m[1], score: m[2], overs: m[3] };
      const s = seg.trim().match(/^([A-Z]+)\s+([\d/]+)/);
      if (s) return { team: s[1], score: s[2], overs: '' };
      return { team: seg.trim().slice(0, 5), score: '', overs: '' };
    });
  } catch { return []; }
}

function needsText(s: LiveScore): string {
  if (!s.target || s.target === '-' || s.target === '0') return '';
  const needed = parseInt(s.target) - s.runs;
  if (needed <= 0) return '';
  const overs = parseFloat(s.overs);
  const bowled = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
  const left = 120 - bowled;
  if (left <= 0) return '';
  return `Need ${needed} from ${left} ball${left !== 1 ? 's' : ''}`;
}

function deriveBall(c: CommentaryItem): { label: string; cls: string } {
  const t = c.text.toLowerCase();
  const et = c.event_type;
  if (et === 'WICKET' || t.includes('wicket') || t.includes(' out '))
    return { label: 'W', cls: 'bg-red-500 text-white font-black' };
  if (et === 'SIX' || t.includes(' six') || t.includes('maximum'))
    return { label: '6', cls: 'bg-purple-500 text-white font-black' };
  if (et === 'FOUR' || t.includes(' four') || t.includes('boundary'))
    return { label: '4', cls: 'bg-green-500 text-white font-black' };
  if (t.includes('no ball') || t.includes('no-ball'))
    return { label: 'NB', cls: 'bg-orange-400 text-black font-black' };
  if (t.includes('wide'))
    return { label: 'Wd', cls: 'bg-yellow-400 text-black font-black' };
  if (t.includes('dot') || t.includes('defend') || t.includes('block'))
    return { label: '•', cls: 'bg-[rgba(var(--color-border),0.4)] text-[rgb(var(--color-muted))]' };
  const run = t.match(/\b([1-9])\s*run/)?.[1];
  return run
    ? { label: run, cls: 'bg-[rgba(var(--color-surface),0.7)] text-[rgb(var(--color-text))]' }
    : { label: '·', cls: 'bg-[rgba(var(--color-border),0.3)] text-[rgb(var(--color-muted))]' };
}

// Web-Audio alarm buzz for NO-BALL (no MP3 file needed)
function playNoBallAlarm() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch { /* silent fail */ }
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

// ── Emoji particle rain ──────────────────────────────────────────────────

interface Particle { id: number; emoji: string; x: number; delay: number }
let _pid = 0;

function ParticleRain({ cfg, active }: { cfg: typeof EVENT_CFG[EventKey]; active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  useEffect(() => {
    if (!active) return;
    const batch: Particle[] = Array.from({ length: 12 }, (_, i) => ({
      id: ++_pid,
      emoji: cfg.emojis[i % cfg.emojis.length],
      x: 2 + Math.random() * 96,
      delay: i * 0.07,
    }));
    setParticles(prev => [...prev.slice(-16), ...batch]);
    const ids = new Set(batch.map(b => b.id));
    const t = setTimeout(() => setParticles(prev => prev.filter(p => !ids.has(p.id))), 3800);
    return () => clearTimeout(t);
  }, [active, cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl z-20">
      {particles.map(p => (
        <motion.span key={p.id}
          initial={{ opacity: 1, y: '105%', scale: 0.4 }}
          animate={{ opacity: 0, y: '-15%', scale: 1.6 }}
          transition={{ duration: 2.6, delay: p.delay, ease: 'easeOut' }}
          className="absolute text-xl select-none leading-none"
          style={{ left: `${p.x}%`, bottom: 0 }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── Full-width TV graphic overlay ────────────────────────────────────────

function TVGraphic({ eventKey, commText, show }: { eventKey: EventKey; commText: string; show: boolean }) {
  const cfg = EVENT_CFG[eventKey];
  if (eventKey === 'NONE' || eventKey === 'RUNS') return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={eventKey + commText.slice(0, 10)}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '110%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="absolute inset-x-0 bottom-0 z-30 rounded-b-2xl overflow-hidden"
          style={{ background: cfg.grad }}
        >
          {/* Shimmer sweep */}
          <motion.div
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            className="absolute top-0 left-0 h-full w-1/3 opacity-20"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)` }}
          />

          <div className="relative flex items-center gap-4 px-5 py-4">
            {/* Pulsing icon */}
            <motion.span
              animate={eventKey === 'WICKET'
                ? { rotate: [0, -20, 20, -10, 10, 0], scale: [1, 1.3, 1] }
                : { scale: [1, 1.25, 1] }}
              transition={{ duration: 0.5, repeat: 4 }}
              className="text-5xl sm:text-6xl flex-shrink-0 drop-shadow-lg"
            >
              {cfg.icon}
            </motion.span>

            {/* Label + commentary */}
            <div className="flex-1 min-w-0">
              <motion.p
                initial={{ letterSpacing: '0.6em', opacity: 0 }}
                animate={{ letterSpacing: '0.15em', opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="font-black text-xl sm:text-3xl tracking-widest drop-shadow"
                style={{ color: cfg.accent, textShadow: `0 0 30px ${cfg.accent}99` }}
              >
                {cfg.label}
              </motion.p>
              {commText && (
                <p className="text-xs sm:text-sm text-white/80 mt-1 leading-snug line-clamp-2">
                  {commText.slice(0, 120)}
                </p>
              )}
              <p className="text-[11px] font-semibold mt-1.5" style={{ color: `${cfg.accent}cc` }}>
                {cfg.crowdText}
              </p>
            </div>

            {/* Energy pill */}
            <div className="flex-shrink-0 text-right hidden sm:flex flex-col items-end gap-1">
              <span className="text-[9px] uppercase tracking-widest text-white/50">Crowd Energy</span>
              <div className="w-24 h-2 rounded-full overflow-hidden bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cfg.energy}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: cfg.accent, boxShadow: `0 0 8px ${cfg.accent}` }}
                />
              </div>
              <span className="text-lg font-black" style={{ color: cfg.accent }}>{cfg.energy}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Crowd emotion strip ──────────────────────────────────────────────────

function CrowdStrip({ eventKey }: { eventKey: EventKey }) {
  const cfg = EVENT_CFG[eventKey];
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-t border-[rgba(var(--color-border),0.08)]"
      style={{ background: `${cfg.accent}07` }}
    >
      {/* Audio waveform bars */}
      <div className="flex items-end gap-px h-4 flex-shrink-0" aria-hidden>
        {[0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.95, 0.6, 1, 0.45].map((h, i) => (
          <motion.div
            key={i}
            animate={eventKey !== 'NONE'
              ? { scaleY: [h, 0.15, 1, 0.45, h] }
              : { scaleY: [h, h * 0.8, h] }}
            transition={{ duration: eventKey !== 'NONE' ? 0.55 : 2, delay: i * 0.06, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[3px] rounded-full origin-bottom"
            style={{ height: '100%', background: cfg.accent, opacity: 0.75 }}
          />
        ))}
      </div>

      {/* Crowd text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={eventKey}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.25 }}
          className="text-[11px] font-semibold flex-1 truncate"
          style={{ color: cfg.accent }}
        >
          {cfg.crowdText}
        </motion.p>
      </AnimatePresence>

      {/* Energy meter */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[9px] text-[rgb(var(--color-muted))] uppercase tracking-wide">Energy</span>
        <div className="w-14 h-1.5 rounded-full bg-[rgba(var(--color-border),0.3)] overflow-hidden">
          <motion.div
            animate={{ width: `${cfg.energy}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: cfg.accent }}
          />
        </div>
        <motion.span
          key={cfg.energy}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-[11px] font-black w-7 text-right"
          style={{ color: cfg.accent }}
        >
          {cfg.energy}%
        </motion.span>
      </div>
    </div>
  );
}

// ── Ball-by-ball tracker ─────────────────────────────────────────────────

function BallTracker({ items }: { items: CommentaryItem[] }) {
  const balls = items.slice(0, 6).reverse();
  if (balls.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2 border-t border-[rgba(var(--color-border),0.08)]">
      <span className="text-[9px] font-bold text-[rgb(var(--color-muted))] uppercase tracking-widest flex-shrink-0">
        Last {balls.length}
      </span>
      <div className="flex items-center gap-1.5">
        {balls.map((c, i) => {
          const b = deriveBall(c);
          return (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 450, damping: 20 }}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] ${b.cls}`}
            >
              {b.label}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

// ── Individual team score row ────────────────────────────────────────────

function TeamRow({
  name, code, runsDisplay, overs, isBatting, innings1Done, isCompleted,
}: {
  name: string; code: TeamCode | null; runsDisplay: string;
  overs: string; isBatting: boolean; innings1Done: boolean; isCompleted: boolean;
}) {
  const theme = code ? TEAM_THEMES[code] : null;
  const logo = getTeamLogo(name);
  const accent = theme?.primary ?? 'rgb(var(--color-text))';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 transition-all duration-500"
      style={isBatting && !isCompleted ? { background: `${accent}0a` } : {}}
    >
      {/* Logo with live pulse */}
      <div className="relative flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="w-11 h-11 object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {isBatting && !isCompleted && (
          <motion.span
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[rgb(var(--color-bg))]"
          />
        )}
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm sm:text-base font-black leading-tight" style={{ color: accent }}>
            {code ?? name}
          </span>
          <span className="text-[10px] text-[rgb(var(--color-muted))] hidden sm:inline truncate max-w-[140px]">
            {name}
          </span>
          {isBatting && !isCompleted && (
            <span className="text-[8px] font-black text-green-400 bg-green-400/10 border border-green-400/30 px-1.5 py-px rounded-full tracking-wide">
              BAT ▲
            </span>
          )}
          {innings1Done && (
            <span className="text-[8px] font-medium text-[rgb(var(--color-muted))] bg-[rgba(var(--color-surface),0.6)] border border-[rgba(var(--color-border),0.3)] px-1.5 py-px rounded-full">
              1st INN
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      <div className="text-right flex-shrink-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={runsDisplay}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`font-black text-[rgb(var(--color-text))] ${isBatting ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}
          >
            {runsDisplay}
          </motion.p>
        </AnimatePresence>
        <p className="text-[11px] text-[rgb(var(--color-muted))]">({overs} ov)</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main Scoreboard
// ─────────────────────────────────────────────────────────────────────────

export default function Scoreboard() {
  const { score, commentary, activeEvent, clearEvent } = useVibeStore();

  const [eventKey, setEventKey] = useState<EventKey>('NONE');
  const [showOverlay, setShowOverlay] = useState(false);
  const [borderPulse, setBorderPulse] = useState(false);
  const prevEventKeyRef = useRef<string>('');
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controls = useAnimation();

  const latestComm = commentary?.[0];
  const latestText = latestComm?.text ?? '';

  // Detect event changes → animate + overlay
  useEffect(() => {
    const key = resolveEventKey(activeEvent, latestText);
    const eventStr = key + latestText.slice(0, 12);
    if (key === 'NONE' || eventStr === prevEventKeyRef.current) {
      if (!activeEvent) { setEventKey('NONE'); setShowOverlay(false); }
      return;
    }
    prevEventKeyRef.current = eventStr;
    setEventKey(key);
    setShowOverlay(true);
    setBorderPulse(true);

    if (key === 'NOBALL') playNoBallAlarm();

    const accent = EVENT_CFG[key].accent;
    controls.start({
      boxShadow: [
        `0 0 0 0px ${accent}00`,
        `0 0 0 14px ${accent}55`,
        `0 0 0 6px ${accent}30`,
        `0 0 0 0px ${accent}00`,
      ],
      transition: { duration: 1.3, times: [0, 0.25, 0.65, 1] },
    });

    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlay(false);
      setBorderPulse(false);
      clearEvent();
    }, 4200);
    return () => { if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current); };
  }, [activeEvent, latestText]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Skeleton ────────────────────────────────────────────────────────────

  if (!score) {
    return (
      <section className="px-3 sm:px-5 pb-1 pt-2">
        <div className="max-w-[1600px] mx-auto">
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-14 rounded-full" />
            </div>
            <div className="skeleton h-14 rounded-xl" />
            <div className="skeleton h-14 rounded-xl" />
            <div className="skeleton h-5 w-2/3 rounded-lg" />
          </div>
        </div>
      </section>
    );
  }

  const battingCode = resolveTeamCode(score.batting_team) as TeamCode | null;
  const innings = parseInnings(score.raw_title ?? '');
  const need = needsText(score);
  const isCompleted = /won|draw|tie/i.test(score.match_status ?? '');
  const cfgNow = EVENT_CFG[eventKey];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <section className="px-3 sm:px-5 pb-1 pt-2">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          animate={controls}
          className="relative glass rounded-2xl overflow-hidden"
          style={borderPulse ? { outline: `2px solid ${cfgNow.border}55` } : {}}
        >
          {/* Particle rain */}
          <ParticleRain cfg={cfgNow} active={showOverlay} />

          {/* ── Header bar ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[rgba(var(--color-surface),0.5)] border-b border-[rgba(var(--color-border),0.12)]">
            {isCompleted ? (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[rgba(var(--color-surface),0.8)] text-[rgb(var(--color-muted))] border border-[rgba(var(--color-border),0.3)]">
                COMPLETED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/12 text-red-400 border border-red-500/30">
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"
                />
                LIVE
              </span>
            )}

            <span className="text-[11px] text-[rgb(var(--color-muted))] flex-1 truncate">
              IPL 2026{isCompleted && score.match_status
                ? <span className="ml-2 text-green-400 font-semibold"> · {score.match_status}</span>
                : null}
            </span>

            {/* Event badge */}
            <AnimatePresence>
              {showOverlay && eventKey !== 'NONE' && (
                <motion.span
                  key={eventKey}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: [0.4, 1.2, 1], opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full border flex-shrink-0"
                  style={{
                    background: `${cfgNow.accent}20`,
                    color: cfgNow.accent,
                    borderColor: `${cfgNow.accent}55`,
                  }}
                >
                  {cfgNow.icon} {cfgNow.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ── Score rows ────────────────────────────────────────── */}
          <div className="divide-y divide-[rgba(var(--color-border),0.07)]">
            {innings.length >= 2 ? (
              innings.map((inn, i) => {
                const code = resolveTeamCode(inn.team) as TeamCode | null;
                const isBatting = code === battingCode;
                const done = !isBatting && i === 0 && innings.length === 2;
                const runsDisplay = isBatting
                  ? `${score.runs}/${score.wickets}`
                  : inn.score;
                const overs = isBatting ? score.overs : inn.overs;
                return (
                  <TeamRow
                    key={inn.team}
                    name={inn.team}
                    code={code}
                    runsDisplay={runsDisplay}
                    overs={overs || '—'}
                    isBatting={isBatting}
                    innings1Done={done}
                    isCompleted={isCompleted}
                  />
                );
              })
            ) : (
              <>
                <TeamRow
                  name={score.batting_team} code={battingCode}
                  runsDisplay={`${score.runs}/${score.wickets}`}
                  overs={score.overs}
                  isBatting innings1Done={false} isCompleted={isCompleted}
                />
                <TeamRow
                  name={score.bowling_team} code={resolveTeamCode(score.bowling_team) as TeamCode | null}
                  runsDisplay="—" overs="—"
                  isBatting={false} innings1Done={false} isCompleted={isCompleted}
                />
              </>
            )}
          </div>

          {/* ── Stats bar ─────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 bg-[rgba(var(--color-surface),0.28)] border-t border-[rgba(var(--color-border),0.08)]">
            {need && !isCompleted && (
              <motion.span key={need} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs font-bold text-amber-400">
                ⚡ {need}
              </motion.span>
            )}
            {score.run_rate > 0 && (
              <span className="text-[11px] text-[rgb(var(--color-muted))]">
                CRR <span className="text-[rgb(var(--color-text))] font-semibold">{score.run_rate.toFixed(2)}</span>
              </span>
            )}
            {score.target && score.target !== '-' && score.target !== '0' && (
              <span className="text-[11px] text-[rgb(var(--color-muted))]">
                Target <span className="text-[rgb(var(--color-text))] font-semibold">{score.target}</span>
              </span>
            )}
            {score.required_rate > 0 && !isCompleted && (
              <span className="text-[11px] text-[rgb(var(--color-muted))]">
                RRR <span className="text-amber-400 font-semibold">{score.required_rate.toFixed(2)}</span>
              </span>
            )}
          </div>

          {/* ── Crowd emotion strip ───────────────────────────────── */}
          <CrowdStrip eventKey={eventKey} />

          {/* ── Ball tracker ─────────────────────────────────────── */}
          <BallTracker items={commentary ?? []} />

          {/* ── TV graphic overlay (slides up from bottom) ────────── */}
          <TVGraphic eventKey={eventKey} commText={latestText} show={showOverlay} />
        </motion.div>
      </div>
    </section>
  );
}

// (end of file)
