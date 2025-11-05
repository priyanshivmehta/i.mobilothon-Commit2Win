'use client';

import React from 'react';

interface SteeringPanelProps {
  steeringDeg: number;          // instantaneous deviation, degrees
  laneStability: number;        // 0–100 index (higher is better)
  microsleep: boolean;          // recent spike detected
  className?: string;
}

const statusFromSteering = (deg: number) => {
  const a = Math.abs(deg);
  if (a <= 5) return { label: 'Normal micro-corrections', tone: 'text-foreground' };
  if (a <= 15) return { label: 'Irregular corrections', tone: 'text-amber-400' };
  if (a <= 30) return { label: 'Large corrections', tone: 'text-orange-400' };
  return { label: 'Severe correction amplitude', tone: 'text-red-500' };
};

const SteeringPanel: React.FC<SteeringPanelProps> = ({ steeringDeg, laneStability, microsleep, className = '' }) => {
  const st = statusFromSteering(steeringDeg);

  return (
    <div className={`p-4 bg-card rounded-lg border border-border ${className}`}>
      <h3 className="font-semibold mb-2">Steering Deviation</h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Instantaneous Deviation</div>
          <div className="text-foreground font-medium">{steeringDeg.toFixed(1)}°</div>
        </div>
        <div>
          <div className="text-muted-foreground">Lane Stability Index</div>
          <div className="text-foreground font-medium">{Math.round(laneStability)}/100</div>
        </div>
      </div>

      <div className="mt-3 text-sm">
        <div className="text-muted-foreground">Correction Pattern</div>
        <div className={`font-medium ${st.tone}`}>{st.label}{microsleep ? ' — sudden correction detected' : ''}</div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-muted h-1 rounded">
          <div
            className="h-1 rounded transition-all"
            style={{ width: `${Math.max(0, Math.min(100, laneStability))}%`, backgroundColor: laneStability >= 80 ? '#10B981' : laneStability >= 60 ? '#F59E0B' : laneStability >= 40 ? '#F97316' : '#DC2626' }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Interpretation accounts for normal micro-corrections, increasing amplitude from fatigue, and sudden large corrections consistent with microsleep events.
      </p>
    </div>
  );
};

export default SteeringPanel;
