'use client';

import React, { useState, useEffect } from 'react';
import FleetKPICards from './FleetKPICards';
import FleetMap from './FleetMap';
import RouteRiskAnalytics from './RouteRiskAnalytics';

interface Driver {
  id: string;
  name: string;
  vehicleId: string;
  lat: number;
  lng: number;
  attentionScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastAlert: string;
  speed: number;
  route: string;
  sparklineData: number[];
}

interface KPIMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
}

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

const FleetConsoleInteractive = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const mockDrivers: Driver[] = [
    {
      id: 'D001',
      name: 'Michael Chen',
      vehicleId: 'VW-2024-001',
      lat: 40.7128,
      lng: -74.0060,
      attentionScore: 85,
      riskLevel: 'low',
      lastAlert: '2 hours ago',
      speed: 45,
      route: 'Route A-12',
      sparklineData: [78, 82, 85, 88, 85, 83, 86, 89, 85, 87]
    },
    {
      id: 'D002',
      name: 'Sarah Johnson',
      vehicleId: 'VW-2024-002',
      lat: 40.7589,
      lng: -73.9851,
      attentionScore: 72,
      riskLevel: 'medium',
      lastAlert: '15 minutes ago',
      speed: 38,
      route: 'Route B-7',
      sparklineData: [75, 73, 70, 68, 72, 74, 71, 69, 72, 75]
    },
    {
      id: 'D003',
      name: 'David Rodriguez',
      vehicleId: 'VW-2024-003',
      lat: 40.7282,
      lng: -73.7949,
      attentionScore: 58,
      riskLevel: 'high',
      lastAlert: '3 minutes ago',
      speed: 52,
      route: 'Route C-15',
      sparklineData: [65, 62, 58, 55, 60, 58, 56, 59, 58, 61]
    },
    {
      id: 'D004',
      name: 'Emily Davis',
      vehicleId: 'VW-2024-004',
      lat: 40.6892,
      lng: -74.0445,
      attentionScore: 91,
      riskLevel: 'low',
      lastAlert: '4 hours ago',
      speed: 42,
      route: 'Route D-3',
      sparklineData: [88, 90, 91, 89, 92, 91, 90, 93, 91, 89]
    },
    {
      id: 'D005',
      name: 'James Wilson',
      vehicleId: 'VW-2024-005',
      lat: 40.7505,
      lng: -73.9934,
      attentionScore: 76,
      riskLevel: 'medium',
      lastAlert: '45 minutes ago',
      speed: 35,
      route: 'Route E-9',
      sparklineData: [74, 76, 78, 75, 77, 76, 74, 78, 76, 79]
    },
    {
      id: 'D006',
      name: 'Lisa Anderson',
      vehicleId: 'VW-2024-006',
      lat: 40.7614,
      lng: -73.9776,
      attentionScore: 83,
      riskLevel: 'low',
      lastAlert: '1 hour ago',
      speed: 48,
      route: 'Route F-11',
      sparklineData: [80, 82, 83, 85, 84, 83, 81, 84, 83, 85]
    },
    {
      id: 'D007',
      name: 'Robert Brown',
      vehicleId: 'VW-2024-007',
      lat: 40.7831,
      lng: -73.9712,
      attentionScore: 67,
      riskLevel: 'medium',
      lastAlert: '25 minutes ago',
      speed: 41,
      route: 'Route G-6',
      sparklineData: [70, 68, 67, 65, 69, 67, 66, 68, 67, 70]
    },
    {
      id: 'D008',
      name: 'Jennifer Taylor',
      vehicleId: 'VW-2024-008',
      lat: 40.7484,
      lng: -73.9857,
      attentionScore: 89,
      riskLevel: 'low',
      lastAlert: '3 hours ago',
      speed: 44,
      route: 'Route H-14',
      sparklineData: [86, 88, 89, 87, 90, 89, 88, 91, 89, 87]
    }
  ];

  const mockKPIMetrics: KPIMetric[] = [
    {
      id: 'avg-score',
      title: 'Average Attention Score',
      value: '78.9',
      change: '+2.3',
      changeType: 'positive',
      icon: 'EyeIcon',
      description: 'Fleet-wide attention level'
    },
    {
      id: 'high-risk',
      title: 'High-Risk Drivers',
      value: '1',
      change: '-2',
      changeType: 'positive',
      icon: 'ExclamationTriangleIcon',
      description: 'Drivers requiring attention'
    },
    {
      id: 'hotspots',
      title: 'Active Hotspots',
      value: '3',
      change: '0',
      changeType: 'neutral',
      icon: 'MapPinIcon',
      description: 'Risk concentration areas'
    }
  ];

  const mockTimeRiskData: TimeRiskData[] = [
    { hour: '06:00', riskScore: 45, incidents: 2 },
    { hour: '08:00', riskScore: 62, incidents: 5 },
    { hour: '10:00', riskScore: 38, incidents: 1 },
    { hour: '12:00', riskScore: 55, incidents: 3 },
    { hour: '14:00', riskScore: 48, incidents: 2 },
    { hour: '16:00', riskScore: 71, incidents: 7 },
    { hour: '18:00', riskScore: 84, incidents: 12 },
    { hour: '20:00', riskScore: 67, incidents: 6 },
    { hour: '22:00', riskScore: 52, incidents: 4 }
  ];

  const mockRouteHotspots: RouteHotspot[] = [
    {
      id: 'H001',
      routeName: 'I-95 North (Mile 45-52)',
      riskLevel: 'high',
      incidentCount: 12,
      avgScore: 58
    },
    {
      id: 'H002',
      routeName: 'Route 287 Junction',
      riskLevel: 'medium',
      incidentCount: 7,
      avgScore: 67
    },
    {
      id: 'H003',
      routeName: 'Downtown Loop (5th-8th Ave)',
      riskLevel: 'medium',
      incidentCount: 5,
      avgScore: 72
    },
    {
      id: 'H004',
      routeName: 'Highway 1 Corridor',
      riskLevel: 'low',
      incidentCount: 2,
      avgScore: 85
    }
  ];

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* KPI Cards */}
          <FleetKPICards metrics={mockKPIMetrics} />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fleet Map - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <FleetMap 
                drivers={mockDrivers} 
                onDriverSelect={handleDriverSelect}
              />
            </div>
            
            {/* Route Risk Analytics - Takes 1 column */}
            <div className="lg:col-span-1">
              <RouteRiskAnalytics 
                timeData={mockTimeRiskData}
                hotspots={mockRouteHotspots}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetConsoleInteractive;