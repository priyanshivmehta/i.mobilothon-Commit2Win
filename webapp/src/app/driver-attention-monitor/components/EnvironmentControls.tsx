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
  onSettingsChange: (settings: Record<string, boolean>) => void;
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

  useEffect(() => {
    setIsHydrated(true);
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
      }, {} as Record<string, boolean>);
      
      onSettingsChange(settingsMap);
      return updated;
    });
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
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Cog6ToothIcon" size={20} className="text-secondary" />
        <h3 className="text-lg font-semibold text-foreground">Environment Simulation</h3>
      </div>

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

      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-1">
          <Icon name="InformationCircleIcon" size={16} className="text-secondary" />
          <span className="text-xs font-medium text-foreground">Simulation Mode</span>
        </div>
        <p className="text-xs text-muted-foreground">
          These controls simulate various driving conditions for testing attention monitoring accuracy.
        </p>
      </div>
    </div>
  );
};

export default EnvironmentControls;