'use client';

import { useVibeStore } from '@/lib/store';
import { diversionFood, diversionNetflix } from '@/lib/api';
import { useState } from 'react';

export default function DiversionProtocol() {
  const { setDiversion, diversionMessage } = useVibeStore();
  const [loading, setLoading] = useState(false);

  const handleFood = async () => {
    setLoading(true);
    const data = await diversionFood();
    setDiversion(true, data.message);
    setLoading(false);
  };

  const handleNetflix = async () => {
    setLoading(true);
    const data = await diversionNetflix();
    setDiversion(true, data.message);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="glass p-6 text-center" style={{ border: '2px solid #EF4444' }}>
        <p className="text-3xl mb-2">🚨</p>
        <h3 className="text-lg font-bold text-red-400 mb-2">DIVERSION PROTOCOL</h3>
        <p className="text-sm" style={{ color: 'rgba(var(--color-text), 0.8)' }}>
          Your team is collapsing. <strong>Need a distraction?</strong>
        </p>
      </div>
      <button onClick={handleFood} disabled={loading}
        className="w-full glass glow-border p-4 text-left disabled:opacity-50">
        <p className="text-lg mb-1">🍕 Order Comfort Food</p>
        <p className="text-xs" style={{ color: 'rgba(var(--color-muted))' }}>Swiggy from Bengaluru</p>
      </button>
      <button onClick={handleNetflix} disabled={loading}
        className="w-full glass glow-border p-4 text-left disabled:opacity-50">
        <p className="text-lg mb-1">📺 Switch to Netflix</p>
        <p className="text-xs" style={{ color: 'rgba(var(--color-muted))' }}>Take a break</p>
      </button>
      {diversionMessage && (
        <div className="glass p-4" style={{ border: '1px solid #10B981' }}>
          <p className="text-sm text-green-400">{diversionMessage}</p>
        </div>
      )}
      <button onClick={() => setDiversion(false, null)}
        className="w-full py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10"
        style={{ color: 'rgb(var(--color-primary))' }}>
        ⬅️ Back to Match
      </button>
    </div>
  );
}
