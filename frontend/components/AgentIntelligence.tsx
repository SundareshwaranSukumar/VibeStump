'use client';

import { useState, useEffect } from 'react';
import { useVibeStore } from '@/lib/store';
import { fetchHistorian } from '@/lib/api';
import DiversionProtocol from './DiversionProtocol';

interface Analysis {
  vibe_score: number;
  tension_index: number;
  fallback_mood: string;
  meme_search_query: string;
  is_critical_event: boolean;
  event_type: string;
  agent_monologue: string;
  meme_url: string;
}

export default function AgentIntelligence({ analysis, matchContext }: { analysis: Analysis | null, matchContext?: string }) {
  const { diversionActive, selectedTeam } = useVibeStore();
  const [historianInsight, setHistorianInsight] = useState<string | null>(null);

  useEffect(() => {
    if (analysis?.is_critical_event) {
      const contextStr = matchContext || `Event for ${selectedTeam}`;
      fetchHistorian(analysis.event_type, `Event: ${analysis.event_type} during ${contextStr}`)
        .then((data) => setHistorianInsight(data.insight))
        .catch(() => setHistorianInsight(null));
    } else {
      setHistorianInsight(null);
    }
  }, [analysis?.event_type, analysis?.is_critical_event, matchContext, selectedTeam]);

  if (diversionActive) {
    return <DiversionProtocol />;
  }

  const mood = analysis?.fallback_mood || 'happy';
  const memeUrl = analysis?.meme_url || 'https://media.giphy.com/media/26n6R5HOYPbekK0YE/giphy.gif';

  const getPersona = () => {
    if (mood === 'hype') return { emoji: '🚀', title: 'The Hype Man', color: '#FCD34D' };
    if (mood === 'tense') return { emoji: '😰', title: 'Nervous Fan', color: '#FB923C' };
    if (mood === 'sad') return { emoji: '📉', title: 'The Doomer', color: '#EF4444' };
    if (mood === 'angry') return { emoji: '🤬', title: 'The Critic', color: '#F87171' };
    return { emoji: '😎', title: 'Cool Analyst', color: '#34D399' };
  };

  const persona = getPersona();

  return (
    <div className="space-y-4">
      {/* Dynamic Agent Persona (Replaces Psychologist) */}
      {analysis && (
        <div className="glass glow-border p-4" style={{ borderLeft: `4px solid ${persona.color}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{persona.emoji}</span>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: persona.color }}>
                {persona.title}
              </span>
            </div>
            <div className="flex gap-1">
              {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/20" />)}
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed text-white/90 italic">
            &ldquo;{analysis.agent_monologue}&rdquo;
          </p>
          
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/30 uppercase font-bold">Vibe</span>
              <span className={`text-xs font-bold ${analysis.vibe_score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {analysis.vibe_score >= 0 ? '📈' : '📉'} {analysis.vibe_score}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] text-white/30 uppercase font-bold">Tension</span>
              <span className="text-xs font-bold text-[rgb(var(--color-primary))]">
                🔥 {analysis.tension_index}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Historian Insight */}
      {historianInsight && (
        <div className="glass p-4 border-l-4 border-[rgb(var(--color-secondary))]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📜</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--color-secondary))]">
              Historian Insight
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            {historianInsight}
          </p>
        </div>
      )}

      {/* Dynamic Agent Mood & Meme */}
      <div className="glass glow-border p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Visual Emotion Feed
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-tighter">
            {mood}
          </span>
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={memeUrl}
            alt={`Mood: ${mood}`}
            className="w-full h-auto object-cover min-h-[180px]"
          />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/60">Live Reaction</span>
             </div>
          </div>
        </div>
      </div>

      {/* Critical Event Banner */}
      {analysis && analysis.tension_index >= 8 && (
        <div className="glass p-3 text-center border-2 border-red-500/30 bg-red-500/10 animate-pulse">
          <p className="text-xs font-black text-red-400 uppercase tracking-tighter">
            🚨 EXTREME TENSION DETECTED 🚨
          </p>
        </div>
      )}
    </div>
  );
}
