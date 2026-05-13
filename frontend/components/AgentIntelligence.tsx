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

export default function AgentIntelligence({ analysis }: { analysis: Analysis | null }) {
  const { diversionActive } = useVibeStore();
  const [historianInsight, setHistorianInsight] = useState<string | null>(null);

  useEffect(() => {
    if (analysis?.is_critical_event) {
      fetchHistorian(analysis.event_type, `Event: ${analysis.event_type} during RCB vs KKR`)
        .then((data) => setHistorianInsight(data.insight))
        .catch(() => setHistorianInsight(null));
    } else {
      setHistorianInsight(null);
    }
  }, [analysis?.event_type, analysis?.is_critical_event]);

  if (diversionActive) {
    return <DiversionProtocol />;
  }

  const mood = analysis?.fallback_mood || 'happy';
  const memeUrl = analysis?.meme_url || 'https://media.giphy.com/media/26n6R5HOYPbekK0YE/giphy.gif';

  return (
    <div className="space-y-4">
      {/* Psychologist Monologue */}
      {analysis && (
        <div className="glass glow-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧠</span>
            <span className="text-xs font-bold uppercase tracking-wider glow-text">
              Psychologist
            </span>
          </div>
          <p className="text-sm italic leading-relaxed"
             style={{ color: 'rgba(var(--color-text), 0.85)' }}>
            &ldquo;{analysis.agent_monologue}&rdquo;
          </p>
          <div className="flex gap-3 mt-3">
            <span className="text-xs px-2 py-1 rounded-md"
                  style={{
                    background: analysis.vibe_score > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: analysis.vibe_score > 0 ? '#10B981' : '#EF4444',
                  }}>
              Vibe: {analysis.vibe_score > 0 ? '+' : ''}{analysis.vibe_score}
            </span>
            <span className="text-xs px-2 py-1 rounded-md"
                  style={{
                    background: 'rgba(var(--color-primary), 0.1)',
                    color: 'rgb(var(--color-primary))',
                  }}>
              Tension: {analysis.tension_index}/10
            </span>
          </div>
        </div>
      )}

      {/* Historian */}
      {historianInsight && (
        <div className="glass p-4" style={{ border: '1px solid rgba(var(--color-secondary), 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📚</span>
            <span className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'rgb(var(--color-secondary))' }}>
              Historian
            </span>
          </div>
          <p className="text-sm italic leading-relaxed"
             style={{ color: 'rgba(var(--color-text), 0.85)' }}>
            {historianInsight}
          </p>
        </div>
      )}

      {/* Dynamic Meme */}
      <div className="glass glow-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'rgba(var(--color-muted))' }}>
            🎭 Dynamic Agent Mood: {mood.toUpperCase()}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={memeUrl}
          alt={`Mood: ${mood}`}
          className="w-full rounded-xl shadow-lg"
          style={{ maxHeight: '220px', objectFit: 'cover' }}
        />
      </div>

      {/* Safety Filter */}
      {analysis && analysis.tension_index >= 8 && (
        <div className="glass p-3 text-center" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-sm font-bold text-red-400">
            🚨 HYPE ALERT — Tension through the roof!
          </p>
        </div>
      )}
    </div>
  );
}
