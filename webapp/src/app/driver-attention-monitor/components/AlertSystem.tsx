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
  // New structured inputs from backend
  inference?: any;
  fusion?: any;
  audioMode?: 'beep' | 'voice' | 'off';
  onAudioModeChange?: (mode: 'beep' | 'voice' | 'off') => void;
}

const normalizeScore = (v: any) => {
  if (typeof v === 'number') return Math.round(Math.max(0, Math.min(100, v)));
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (!Number.isNaN(n)) return Math.round(Math.max(0, Math.min(100, n)));
  }
  return 0;
};

const AlertSystem = ({ currentScore, speed, className = '', inference, fusion, audioMode = 'voice', onAudioModeChange }: AlertSystemProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Priority 1: fusion-driven alert (explicit level or very low alertness)
    try {
      if (fusion) {
        const level = fusion.alert_level || fusion.level || null;
        const score = normalizeScore(fusion.alertness_score ?? fusion.score);
        const recommendation = fusion.recommendation || fusion.recommendations || null;

        if (level === 'critical' || score < 20) {
          const newAlert: Alert = {
            id: `fusion-alert-${Date.now()}`,
            type: 'voice',
            severity: 'high',
            message: recommendation || 'Critical alert: attention severely reduced',
            timestamp: new Date(),
            speed
          };
          setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
          setShowAlert(true);
          const timer = setTimeout(() => setShowAlert(false), 5000);
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      // ignore fusion parsing errors and fall through
    }

    // Priority 2: inference-driven alerts (drowsiness/distraction/voice cues)
    try {
      if (inference) {
        const d = inference.drowsiness;
        const dis = inference.distraction;
        const v = inference.voice;

        // Drowsiness: confidence-based
        if (d && typeof d.confidence === 'number' && d.confidence > 0.6) {
          const sev: Alert['severity'] = d.confidence > 0.85 ? 'high' : d.confidence > 0.7 ? 'medium' : 'low';
          const newAlert: Alert = {
            id: `drowsy-${Date.now()}`,
            type: 'visual',
            severity: sev,
            message: d.label || 'Drowsiness detected',
            timestamp: new Date(),
            speed
          };
          setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
          setShowAlert(true);
          const timer = setTimeout(() => setShowAlert(false), 4000);
          return () => clearTimeout(timer);
        }

        // Distraction
        if (dis && typeof dis.confidence === 'number' && dis.confidence > 0.6) {
          const sev: Alert['severity'] = dis.confidence > 0.85 ? 'high' : dis.confidence > 0.7 ? 'medium' : 'low';
          const newAlert: Alert = {
            id: `distr-${Date.now()}`,
            type: 'visual',
            severity: sev,
            message: dis.label || 'Distraction detected',
            timestamp: new Date(),
            speed
          };
          setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
          setShowAlert(true);
          const timer = setTimeout(() => setShowAlert(false), 4000);
          return () => clearTimeout(timer);
        }

        // Voice cues (e.g., heavy breathing, yawns) -> voice alerts
        if (v && typeof v.confidence === 'number' && v.confidence > 0.6) {
          const sev: Alert['severity'] = v.confidence > 0.85 ? 'high' : v.confidence > 0.7 ? 'medium' : 'low';
          const newAlert: Alert = {
            id: `voice-${Date.now()}`,
            type: 'voice',
            severity: sev,
            message: v.label || 'Vocal fatigue cues detected',
            timestamp: new Date(),
            speed
          };
          setAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
          setShowAlert(true);
          const timer = setTimeout(() => setShowAlert(false), 4000);
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      // ignore
    }

    // Fallback: threshold-based alert using currentScore
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
  }, [currentScore, speed, isHydrated, inference, fusion]);

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
    <div className={`${className}`}>
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${currentScore < 40 ? 'bg-error animate-pulse' : 'bg-success'}`} />
          <span className="text-xs text-muted-foreground">
            {currentScore < 40 ? 'Active' : 'Monitoring'}
          </span>
        </div>
      </div>

      {/* Audio Mode Selector */}
      {onAudioModeChange && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <label className="text-xs font-medium text-foreground block mb-2">Audio Alert Mode</label>
          <select 
            value={audioMode} 
            onChange={(e) => onAudioModeChange(e.target.value as any)} 
            className="w-full bg-card border border-border text-sm text-foreground rounded px-3 py-2"
          >
            <option value="beep">🔔 Beep Sound Only</option>
            <option value="voice">🗣️ Voice Alert Only</option>
            <option value="off">🔇 Silent (No Audio)</option>
          </select>
        </div>
      )}

      {/* Active Alert Banner */}
      {showAlert && alerts.length > 0 && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${getSeverityColor(alerts[0].severity)} animate-pulse relative`}>
          <div className="flex items-start gap-2">
            <Icon name={getSeverityIcon(alerts[0].severity) as any} size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 overflow-hidden">
              <div className="font-medium text-sm leading-tight mb-1">{alerts[0].message}</div>
              <div className="text-xs opacity-80 leading-tight">
                Speed: {alerts[0].speed} mph | {alerts[0].type === 'visual' ? 'Visual' : 'Voice'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert History */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
              <Icon 
                name={alert.type === 'visual' ? 'EyeIcon' : 'SpeakerWaveIcon'} 
                size={14} 
                className="text-muted-foreground flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 overflow-hidden">
                <span className="text-xs text-foreground block leading-tight">{alert.message}</span>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
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