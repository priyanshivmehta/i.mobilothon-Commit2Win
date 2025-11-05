'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface EnvironmentSetting {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface EnvironmentControlsProps {
  onSettingsChange: (settings: Record<string, any>) => void;
  className?: string;
}

const EnvironmentControls = ({ onSettingsChange, className = '' }: EnvironmentControlsProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [settings, setSettings] = useState<EnvironmentSetting[]>([
    {
      id: 'nightMode',
      label: 'Night Mode',
      description: 'Simulate low-light driving conditions',
      icon: 'MoonIcon',
      enabled: false
    },
    {
      id: 'glasses',
      label: 'Glasses Detection',
      description: 'Test with eyewear recognition',
      icon: 'EyeIcon',
      enabled: false
    },
    {
      id: 'potholes',
      label: 'Road Vibration',
      description: 'Simulate rough road conditions',
      icon: 'ExclamationTriangleIcon',
      enabled: false
    },
    {
      id: 'highway',
      label: 'Highway Mode',
      description: 'High-speed driving simulation',
      icon: 'TruckIcon',
      enabled: false
    },
    {
      id: 'drowsiness',
      label: 'Fatigue Test',
      description: 'Simulate drowsiness detection',
      icon: 'FaceSmileIcon',
      enabled: false
    }
  ]);
  const [speed, setSpeed] = useState<number>(45);
  const [steeringAngle, setSteeringAngle] = useState<number>(0);
  const [laneDeviation, setLaneDeviation] = useState<number>(0);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // On mount, report initial settings (so parent has initial speed + toggles)
  useEffect(() => {
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.id] = setting.enabled;
      return acc;
    }, {} as Record<string, any>);
    settingsMap['speed'] = speed;
    settingsMap['steeringAngle'] = steeringAngle;
    settingsMap['laneDeviation'] = laneDeviation;
    onSettingsChange(settingsMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSetting = (id: string) => {
    if (!isHydrated) return;

    setSettings(prev => {
      const updated = prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      );
      
      const settingsMap = updated.reduce((acc, setting) => {
        acc[setting.id] = setting.enabled;
        return acc;
      }, {} as Record<string, any>);

      // include numeric controls like speed
      settingsMap['speed'] = speed;
      settingsMap['steeringAngle'] = steeringAngle;
      settingsMap['laneDeviation'] = laneDeviation;

      onSettingsChange(settingsMap);
      return updated;
    });
  };

  // handle speed slider change
  const handleSpeedChange = (v: number) => {
    setSpeed(v);
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.id] = setting.enabled;
      return acc;
    }, {} as Record<string, any>);
    settingsMap['speed'] = v;
    settingsMap['steeringAngle'] = steeringAngle;
    settingsMap['laneDeviation'] = laneDeviation;
    onSettingsChange(settingsMap);
  };

  const handleSteeringChange = (v: number) => {
    setSteeringAngle(v);
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.id] = setting.enabled;
      return acc;
    }, {} as Record<string, any>);
    settingsMap['speed'] = speed;
    settingsMap['steeringAngle'] = v;
    settingsMap['laneDeviation'] = laneDeviation;
    onSettingsChange(settingsMap);
  };

  const handleLaneDeviationChange = (v: number) => {
    setLaneDeviation(v);
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.id] = setting.enabled;
      return acc;
    }, {} as Record<string, any>);
    settingsMap['speed'] = speed;
    settingsMap['steeringAngle'] = steeringAngle;
    settingsMap['laneDeviation'] = v;
    onSettingsChange(settingsMap);
  };

  if (!isHydrated) {
    return (
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="space-y-3">
        {settings.map((setting) => (
          <div key={setting.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-micro">
            <div className="flex items-center space-x-3">
              <Icon 
                name={setting.icon as any} 
                size={20} 
                className={setting.enabled ? 'text-secondary' : 'text-muted-foreground'}
              />
              <div>
                <div className="text-sm font-medium text-foreground">{setting.label}</div>
                <div className="text-xs text-muted-foreground">{setting.description}</div>
              </div>
            </div>

            <button
              onClick={() => toggleSetting(setting.id)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${setting.enabled ? 'bg-secondary' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${setting.enabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Sliders - Each in its own row with better styling */}
      <div className="mt-4 space-y-4">
        <div className="p-3 bg-card/50 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Speed</label>
            <span className={`text-lg font-bold ${speed > 100 ? 'text-red-500' : speed > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
              {speed} km/h
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={140}
            value={speed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0</span>
            <span>70</span>
            <span>140</span>
          </div>
        </div>

        <div className="p-3 bg-card/50 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Steering Angle</label>
            <span className={`text-lg font-bold ${Math.abs(steeringAngle) > 30 ? 'text-red-500' : Math.abs(steeringAngle) > 15 ? 'text-yellow-500' : 'text-green-500'}`}>
              {steeringAngle > 0 ? '+' : ''}{steeringAngle}°
            </span>
          </div>
          <input
            type="range"
            min={-45}
            max={45}
            value={steeringAngle}
            onChange={(e) => handleSteeringChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>← 45°</span>
            <span>0°</span>
            <span>45° →</span>
          </div>
        </div>

        <div className="p-3 bg-card/50 rounded-lg border border-border">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Lane Deviation</label>
            <span className={`text-lg font-bold ${Math.abs(laneDeviation) > 1.5 ? 'text-red-500' : Math.abs(laneDeviation) > 0.8 ? 'text-yellow-500' : 'text-green-500'}`}>
              {laneDeviation > 0 ? '+' : ''}{laneDeviation.toFixed(1)}m
            </span>
          </div>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={laneDeviation}
            onChange={(e) => handleLaneDeviationChange(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>← 2m</span>
            <span>Center</span>
            <span>2m →</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-1">
          <Icon name="InformationCircleIcon" size={16} className="text-secondary" />
          <span className="text-xs font-medium text-foreground">Simulation Mode</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          These controls simulate various driving conditions for testing attention monitoring accuracy.
        </p>
        
        {/* Status Summary - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card/50 p-2 rounded border border-border text-center">
            <div className="text-[10px] text-muted-foreground">Active Tests</div>
            <div className="text-base font-bold text-foreground">
              {settings.filter(s => s.enabled).length}/{settings.length}
            </div>
          </div>
          <div className="bg-card/50 p-2 rounded border border-border text-center">
            <div className="text-[10px] text-muted-foreground">Risk Level</div>
            <div className={`text-base font-bold ${
              settings.filter(s => s.enabled).length > 2 ? 'text-red-500' : 
              settings.filter(s => s.enabled).length > 0 ? 'text-yellow-500' : 
              'text-green-500'
            }`}>
              {settings.filter(s => s.enabled).length > 2 ? 'High' : 
               settings.filter(s => s.enabled).length > 0 ? 'Med' : 
               'Low'}
            </div>
          </div>
        </div>
        
        {/* Active Settings List */}
        {settings.filter(s => s.enabled).length > 0 && (
          <div className="mt-3 p-2 bg-secondary/10 rounded border border-secondary/30">
            <div className="text-[10px] text-secondary font-semibold mb-1">Active:</div>
            <div className="flex flex-wrap gap-1">
              {settings.filter(s => s.enabled).map(s => (
                <span key={s.id} className="text-[9px] px-2 py-0.5 bg-secondary/20 text-secondary rounded-full whitespace-nowrap">
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentControls;