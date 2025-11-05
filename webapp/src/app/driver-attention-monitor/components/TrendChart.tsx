'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface TrendDataPoint {
  timestamp: string;
  score: number;
  time: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  className?: string;
}

const TrendChart = ({ data, className = '' }: TrendChartProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-elevation-2">
          <p className="text-xs text-muted-foreground">{`Time: ${label}s`}</p>
          <p className="text-sm font-medium text-foreground">
            Score: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isHydrated) {
    return (
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Attention Trend</h3>
        <span className="text-xs text-muted-foreground">Last 60 seconds</span>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis 
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#0F766E"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#14B8A6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Real-time monitoring</span>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
};

export default TrendChart;