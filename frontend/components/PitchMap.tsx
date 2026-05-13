'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PITCH_DATA = [
  { length: 4, line: -1, type: 'bouncer', result: 'dot' },
  { length: 8, line: 0, type: 'good', result: 'wicket' },
  { length: 12, line: 1.5, type: 'full', result: 'four' },
  { length: 9, line: -0.5, type: 'good', result: 'dot' },
  { length: 15, line: 0, type: 'yorker', result: 'dot' },
  { length: 7, line: 2, type: 'short', result: 'six' },
];

const COLORS = {
  dot: 'rgba(255, 255, 255, 0.4)',
  four: 'rgb(var(--color-secondary))',
  six: 'rgb(var(--color-primary))',
  wicket: '#EF4444'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass p-2 text-xs" style={{ border: '1px solid rgba(var(--color-text), 0.1)' }}>
        <p className="font-bold uppercase mb-1">{data.result}</p>
        <p style={{ color: 'rgba(var(--color-muted))' }}>Length: {data.length}m</p>
      </div>
    );
  }
  return null;
};

export default function PitchMap() {
  return (
    <div className="relative w-full h-[250px] bg-[#1a2f1c] rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)]" style={{
      backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
      backgroundSize: '30px 30px'
    }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-full bg-[#E5D0A1] opacity-20" />
      
      <div className="absolute top-2 left-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/70">Pitch Map</h3>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="line" domain={[-3, 3]} hide />
          <YAxis type="number" dataKey="length" domain={[0, 20]} reversed hide />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Pitches" data={PITCH_DATA}>
            {PITCH_DATA.map((entry, index) => (
              <circle
                key={index}
                cx="0"
                cy="0"
                r={6}
                fill={COLORS[entry.result as keyof typeof COLORS]}
                style={{ filter: `drop-shadow(0 0 4px ${COLORS[entry.result as keyof typeof COLORS]})` }}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
