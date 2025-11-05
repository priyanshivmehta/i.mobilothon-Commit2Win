'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Icon from '@/components/ui/AppIcon';

interface TimeRiskData {
  hour: string;
  riskScore: number;
  incidents: number;
}

interface RouteHotspot {
  id: string;
  routeName: string;
  riskLevel: 'low' | 'medium' | 'high';
  incidentCount: number;
  avgScore: number;
}

interface RouteRiskAnalyticsProps {
  timeData: TimeRiskData[];
  hotspots: RouteHotspot[];
}

const RouteRiskAnalytics = ({ timeData, hotspots }: RouteRiskAnalyticsProps) => {
  const [activeTab, setActiveTab] = useState<'time' | 'hotspots'>('time');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-error/20';
      case 'medium':
        return 'bg-warning/20';
      default:
        return 'bg-success/20';
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Route Risk Analytics</h2>
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('time')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-component
                ${activeTab === 'time' ?'bg-secondary text-secondary-foreground' :'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Time Analysis
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-component
                ${activeTab === 'hotspots' ?'bg-secondary text-secondary-foreground' :'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              Route Hotspots
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'time' ? (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground mb-2">
                Risk Score by Time of Day
              </h3>
              <p className="text-xs text-muted-foreground">
                Average attention risk scores across all active drivers
              </p>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#94A3B8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94A3B8"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="riskScore" 
                    stroke="#0F766E" 
                    strokeWidth={2}
                    dot={{ fill: '#0F766E', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#0F766E', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground mb-2">
                High-Risk Route Segments
              </h3>
              <p className="text-xs text-muted-foreground">
                Routes with elevated attention risk patterns
              </p>
            </div>
            
            <div className="space-y-3">
              {hotspots.map((hotspot) => (
                <div
                  key={hotspot.id}
                  className={`
                    p-4 rounded-lg border transition-component hover:shadow-elevation-1
                    ${getRiskBgColor(hotspot.riskLevel)} border-border
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Icon 
                        name="MapPinIcon" 
                        size={16} 
                        className={getRiskColor(hotspot.riskLevel)}
                      />
                      <span className="font-medium text-foreground">
                        {hotspot.routeName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {hotspot.avgScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg Score
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {hotspot.incidentCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Incidents
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`
                      text-xs font-medium px-2 py-1 rounded-full
                      ${getRiskColor(hotspot.riskLevel)} ${getRiskBgColor(hotspot.riskLevel)}
                    `}>
                      {hotspot.riskLevel.toUpperCase()} RISK
                    </span>
                    <button className="text-xs text-secondary hover:text-secondary/80 transition-micro">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteRiskAnalytics;