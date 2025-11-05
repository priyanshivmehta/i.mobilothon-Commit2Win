'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Alert {
  id: string;
  type: 'visual' | 'voice';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  speed: number;
}

interface AlertSystemProps {
  currentScore: number;
  speed: number;
  className?: string;
}

const AlertSystem = ({ currentScore, speed, className = '' }: AlertSystemProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Context-gated alert system
    if (currentScore < 40) {
      const alertType = speed > 50 ? 'visual' : 'voice';
      const severity = currentScore < 20 ? 'high' : currentScore < 30 ? 'medium' : 'low';
      
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        type: alertType,
        severity,
        message: getAlertMessage(severity, alertType),
        timestamp: new Date(),
        speed
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
      setShowAlert(true);

      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentScore, speed, isHydrated]);

  const getAlertMessage = (severity: string, type: string): string => {
    const messages = {
      high: {
        visual: 'CRITICAL: Pull over safely when possible',
        voice: 'Attention level critically low - find safe place to rest'
      },
      medium: {
        visual: 'WARNING: Attention decreasing',
        voice: 'Please focus on the road ahead'
      },
      low: {
        visual: 'NOTICE: Monitor attention levels',
        voice: 'Stay alert and focused'
      }
    };

    return messages[severity as keyof typeof messages][type as keyof typeof messages.high];
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'bg-error border-error text-error-foreground';
      case 'medium': return 'bg-warning border-warning text-warning-foreground';
      case 'low': return 'bg-secondary border-secondary text-secondary-foreground';
      default: return 'bg-muted border-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'high': return 'ExclamationTriangleIcon';
      case 'medium': return 'ExclamationCircleIcon';
      case 'low': return 'InformationCircleIcon';
      default: return 'BellIcon';
    }
  };

  if (!isHydrated) {
    return (
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="h-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="BellIcon" size={20} className="text-secondary" />
        <h3 className="text-lg font-semibold text-foreground">Alert System</h3>
        <div className="flex items-center space-x-1 ml-auto">
          <div className={`w-2 h-2 rounded-full ${currentScore < 40 ? 'bg-error animate-pulse' : 'bg-success'}`} />
          <span className="text-xs text-muted-foreground">
            {currentScore < 40 ? 'Active' : 'Monitoring'}
          </span>
        </div>
      </div>

      {/* Active Alert Banner */}
      {showAlert && alerts.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${getSeverityColor(alerts[0].severity)} animate-pulse`}>
          <div className="flex items-center space-x-2">
            <Icon name={getSeverityIcon(alerts[0].severity) as any} size={20} />
            <div className="flex-1">
              <div className="font-medium text-sm">{alerts[0].message}</div>
              <div className="text-xs opacity-80">
                Speed: {alerts[0].speed} mph | {alerts[0].type === 'visual' ? 'Visual Alert' : 'Voice Alert'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert History */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
              <div className="flex items-center space-x-2">
                <Icon 
                  name={alert.type === 'visual' ? 'EyeIcon' : 'SpeakerWaveIcon'} 
                  size={14} 
                  className="text-muted-foreground"
                />
                <span className="text-xs text-foreground">{alert.message}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {alert.timestamp.toLocaleTimeString('en-US', { 
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Icon name="CheckCircleIcon" size={32} className="text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alerts triggered</p>
            <p className="text-xs text-muted-foreground">Attention levels are good</p>
          </div>
        )}
      </div>

      {/* Alert Configuration */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Alert Thresholds:</span>
          <div className="flex items-center space-x-4">
            <span className="text-error">Critical &lt;20</span>
            <span className="text-warning">Warning &lt;40</span>
            <span className="text-success">Good &gt;60</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;