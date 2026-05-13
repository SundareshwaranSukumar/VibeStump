'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScorePoint {
  over: number;
  runs: number;
}

export default function ScoreGraph({ data }: { data: ScorePoint[] }) {
  return (
    <div className="w-full h-48 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="over" 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
            itemStyle={{ color: 'rgb(var(--color-primary))' }}
          />
          <Line 
            type="monotone" 
            dataKey="runs" 
            stroke="rgb(var(--color-primary))" 
            strokeWidth={3}
            dot={{ r: 4, fill: 'rgb(var(--color-primary))' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
