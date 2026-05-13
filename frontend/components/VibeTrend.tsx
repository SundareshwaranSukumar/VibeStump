'use client';

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { useVibeStore } from '@/lib/store';

export default function VibeTrend() {
  const { vibeHistory } = useVibeStore();

  const data = vibeHistory.map((v, i) => ({ ball: i + 1, vibe: v }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]"
           style={{ color: 'rgba(var(--color-muted))' }}>
        <p className="text-sm">Awaiting vibe data...</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="vibeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="rgb(var(--color-primary))" stopOpacity={0.4} />
            <stop offset="95%" stopColor="rgb(var(--color-primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="ball" tick={{ fill: 'rgb(var(--color-muted))', fontSize: 10 }} />
        <YAxis domain={[-10, 10]} tick={{ fill: 'rgb(var(--color-muted))', fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(var(--color-primary),0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '12px',
          }}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
        <ReferenceLine y={-7} stroke="#EF4444" strokeDasharray="3 3" label="" />
        <Area
          type="monotone"
          dataKey="vibe"
          stroke="rgb(var(--color-primary))"
          strokeWidth={2}
          fill="url(#vibeGrad)"
          dot={{ r: 3, fill: 'rgb(var(--color-primary))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
