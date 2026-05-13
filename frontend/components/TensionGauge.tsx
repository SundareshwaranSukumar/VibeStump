'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

export default function TensionGauge({ value }: { value: number }) {
  const color = value >= 8 ? '#EF4444' : value >= 5 ? '#F59E0B' : '#10B981';
  const data = [{ name: 'Tension', value: value * 10, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          startAngle={180}
          endAngle={0}
          data={data}
          barSize={12}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{ fill: 'rgba(255,255,255,0.05)' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center -mt-12">
        <p className="text-4xl font-extrabold" style={{ color }}>
          {value}
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgba(var(--color-muted))' }}>
          {value >= 8 ? '🔥 EXTREME' : value >= 5 ? '⚡ HIGH' : '😌 CALM'}
        </p>
      </div>
    </div>
  );
}
