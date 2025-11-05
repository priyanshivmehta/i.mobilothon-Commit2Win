'use client';

import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';
import AttentionGauge from './AttentionGauge';
import RiskFactors from './RiskFactors';
import TrendChart from './TrendChart';
import EnvironmentControls from './EnvironmentControls';
import AlertSystem from './AlertSystem';
import PrivacyControls from './PrivacyControls';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface RiskFactor {
  id: string;
  label: string;
  impact: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface TrendDataPoint {
  timestamp: string;
  score: number;
  time: number;
}

export default function DriverMonitorInteractive() {
  const [hydrated, setHydrated] = useState(false);

  // vision + main signals
  const [attention, setAttention] = useState(85);
  const [confidence, setConfidence] = useState(92);

  const [speed, setSpeed] = useState(45);
  const [cameraStatus, setCameraStatus] = useState(true);
  const [privacy, setPrivacy] = useState(false);

  // steering
  const [steering, setSteering] = useState(2.5);
  const [stability, setStability] = useState(92);
  const [micro, setMicro] = useState(false);

  const [env, setEnv] = useState<Record<string, boolean>>({});
  const [trend, setTrend] = useState<TrendDataPoint[]>([]);

  // single simulation loop ref
  const simRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated) return;

    // clear stale interval first
    if (simRef.current) clearInterval(simRef.current);

    simRef.current = setInterval(() => {
      /** compute fatigue factor */
      const fatigue = Math.max(0, (80 - attention) / 80);
      const t = Date.now() / 1000;

      /** Steering simulation */
      const base = Math.sin(t) * 2 + Math.sin(t * 0.35) * 1.5;
      const drift = (Math.random() - 0.5) * fatigue * 18;
      const microChance = 0.02 + fatigue * 0.22 + (speed > 60 ? 0.05 : 0);
      const microEvent = Math.random() < microChance;
      const microSpike = microEvent ? (Math.random() - 0.5) * 60 : 0;

      const newSteer = clamp(base + drift + microSpike, -45, 45);
      setSteering(newSteer);
      setMicro(microEvent);

      const stabLoss = Math.max(0, Math.abs(newSteer) - 5) * 1.8 + (microEvent ? 18 : 0);
      setStability(Math.max(0, 100 - stabLoss));

      /** Attention score */
      let newScore = attention + (Math.random() - 0.5) * 8;
      if (env.nightMode) newScore -= 4;
      if (env.drowsiness) newScore -= 12;
      if (env.potholes) newScore -= 6;
      if (env.highway && speed > 60) newScore -= 2;
      if (Math.abs(newSteer) > 15) newScore -= 2;
      if (microEvent) newScore -= 5;

      setAttention(clamp(newScore, 0, 100));

      /** Confidence adjustment */
      setConfidence(c => clamp(c + (Math.random() - 0.5) * 3, 75, 100));

      /** Speed */
      setSpeed(s => clamp(s + (Math.random() - 0.5) * 5, 0, 90));

      /** Trend logging */
      setTrend(prev => [
        ...prev.slice(-25),
        { timestamp: new Date().toISOString(), score: newScore, time: Math.floor((Date.now() % 60000) / 1000) }
      ]);
    }, 700);

    return () => simRef.current && clearInterval(simRef.current);
  }, [hydrated]); // RUN ONCE ✅

  const riskFactors: RiskFactor[] = [
    { id: 'blink', label: 'Blink Rate', impact: 25, severity: 'medium', description: 'Reduced blinking frequency' },
    { id: 'head', label: 'Head Tilt', impact: 12, severity: 'low', description: 'Mild tilt detected' },
    { id: 'eyes', label: 'Eye Closure', impact: 35, severity: 'high', description: 'Extended eyelid closure' },
    { id: 'steer', label: 'Steering', impact: Math.abs(steering) > 20 ? 30 : 10, severity: Math.abs(steering) > 20 ? 'high' : 'medium', description: micro ? 'Correction spike' : 'Stable control' }
  ];

  if (!hydrated) return <div className="text-white p-10">Initializing driver system...</div>;

  return (
    <div className="min-h-screen bg-[#0b1320] pt-16">
      <div className="container mx-auto px-6 py-6">
        
        <h1 className="text-3xl text-white font-semibold mb-2">Driver Attention Monitor</h1>
        <p className="text-gray-400 text-sm mb-6">Real-time fatigue & microsleep monitoring</p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <CameraFeed isPrivacyMode={privacy} onCameraStatus={setCameraStatus} />
          <AttentionGauge score={attention} confidence={confidence} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          {/* Steering */}
          <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Steering & Lane Position</p>
            <div className="relative h-40 bg-white/5 rounded-lg overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-[2px] bg-gray-400/40 -translate-x-1/2" />
              <div className="absolute bottom-3 left-1/2 transition-transform"
                style={{ transform: `translateX(calc(-50% + ${steering * 1.2}px))` }}>
                <div className="w-10 h-5 bg-white rounded" />
              </div>
            </div>
            <div className="text-xs text-gray-300 mt-3 grid grid-cols-3 gap-2">
              <span>Deviation: {steering.toFixed(1)}°</span>
              <span>Stability: {Math.round(stability)}</span>
              <span className={micro ? 'text-red-400' : ''}>{micro ? 'Microsleep' : 'Normal'}</span>
            </div>
          </div>

          {/* Trend */}
          <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Attention Trend</p>
            <TrendChart data={trend} />
          </div>

          {/* Environment span */}
          <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4 row-span-2">
            <p className="text-gray-400 text-sm mb-3">Environment Settings</p>
            <EnvironmentControls onSettingsChange={setEnv} />
          </div>

          {/* Alerts */}
          <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4 md:col-span-2">
            <AlertSystem currentScore={attention} speed={speed} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Key Risk Factors</p>
            <RiskFactors factors={riskFactors} />
          </div>

          <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-3">Privacy Mode</p>
            <PrivacyControls isPrivacyMode={privacy} onPrivacyModeChange={setPrivacy} />
          </div>
        </div>

        <div className="text-xs text-gray-500 border-t border-gray-800 pt-2 flex justify-between">
          <span>Vision: {cameraStatus ? 'Active' : 'Simulated'} • Speed {Math.round(speed)} km/h</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>

      </div>
    </div>
  );
}
