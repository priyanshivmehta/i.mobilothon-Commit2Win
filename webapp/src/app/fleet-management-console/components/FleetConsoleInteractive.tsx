'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from '@/components/common/LogoutButton';
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
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch real users from database
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        // Get all USER role profiles (actual drivers)
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('role', 'USER');

        if (error) {
          console.error('Error fetching drivers:', error);
          return;
        }

        // Convert profiles to driver format with simulated data
        // Surat, Gujarat coordinates - actual road routes
        const routes = [
          { 
            name: 'Ring Road North', 
            path: [
              { lat: 21.1702, lng: 72.8311 }, // SVNIT area
              { lat: 21.1725, lng: 72.8340 },
              { lat: 21.1755, lng: 72.8365 },
              { lat: 21.1780, lng: 72.8390 },
              { lat: 21.1810, lng: 72.8420 },
              { lat: 21.1840, lng: 72.8445 },
              { lat: 21.1870, lng: 72.8470 },
              { lat: 21.1900, lng: 72.8500 }, // End point
            ]
          },
          { 
            name: 'Dumas Road', 
            path: [
              { lat: 21.1702, lng: 72.8311 },
              { lat: 21.1675, lng: 72.8285 },
              { lat: 21.1645, lng: 72.8255 },
              { lat: 21.1615, lng: 72.8225 },
              { lat: 21.1580, lng: 72.8190 },
              { lat: 21.1545, lng: 72.8155 },
              { lat: 21.1510, lng: 72.8120 },
              { lat: 21.1475, lng: 72.8085 },
            ]
          },
          { 
            name: 'VR Mall Route', 
            path: [
              { lat: 21.1702, lng: 72.8311 },
              { lat: 21.1710, lng: 72.8325 },
              { lat: 21.1720, lng: 72.8340 },
              { lat: 21.1735, lng: 72.8355 },
              { lat: 21.1750, lng: 72.8370 },
              { lat: 21.1770, lng: 72.8385 },
              { lat: 21.1790, lng: 72.8400 },
              { lat: 21.1805, lng: 72.8415 },
            ]
          },
          { 
            name: 'City Light Route', 
            path: [
              { lat: 21.1702, lng: 72.8311 },
              { lat: 21.1712, lng: 72.8330 },
              { lat: 21.1725, lng: 72.8350 },
              { lat: 21.1740, lng: 72.8375 },
              { lat: 21.1755, lng: 72.8400 },
              { lat: 21.1772, lng: 72.8430 },
              { lat: 21.1788, lng: 72.8460 },
              { lat: 21.1800, lng: 72.8485 },
            ]
          },
          { 
            name: 'Athwa Gate Circle', 
            path: [
              { lat: 21.1702, lng: 72.8311 },
              { lat: 21.1690, lng: 72.8330 },
              { lat: 21.1675, lng: 72.8350 },
              { lat: 21.1658, lng: 72.8370 },
              { lat: 21.1640, lng: 72.8390 },
              { lat: 21.1622, lng: 72.8410 },
              { lat: 21.1605, lng: 72.8430 },
              { lat: 21.1588, lng: 72.8450 },
            ]
          },
        ];

        const driverData: Driver[] = (profiles || []).map((profile, index) => {
          const baseScore = 60 + Math.random() * 35; // 60-95
          const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
            if (score >= 80) return 'low';
            if (score >= 65) return 'medium';
            return 'high';
          };

          // Assign route to driver
          const route = routes[index % routes.length];
          
          // Much slower movement - complete route in ~5 minutes (300 seconds)
          // Progress: 0 to 1 over 300 seconds, offset by driver index for variety
          const timeOffset = index * 20; // Each driver starts 20 seconds apart
          const routeProgress = ((Date.now() / 1000 + timeOffset) % 300) / 300;
          
          // Calculate position along the path
          const totalSegments = route.path.length - 1;
          const currentSegment = routeProgress * totalSegments;
          const pathIndex = Math.floor(currentSegment);
          const nextPathIndex = Math.min(pathIndex + 1, totalSegments);
          const segmentProgress = currentSegment - pathIndex;
          
          // Smooth interpolation between waypoints
          const currentPos = route.path[pathIndex];
          const nextPos = route.path[nextPathIndex];
          const lat = currentPos.lat + (nextPos.lat - currentPos.lat) * segmentProgress;
          const lng = currentPos.lng + (nextPos.lng - currentPos.lng) * segmentProgress;

          return {
            id: profile.id,
            name: profile.name || 'Driver ' + (index + 1),
            vehicleId: `VW-2024-${String(index + 1).padStart(3, '0')}`,
            lat: lat,
            lng: lng,
            attentionScore: Math.round(baseScore),
            riskLevel: getRiskLevel(baseScore),
            lastAlert: getRandomLastAlert(),
            speed: Math.round(40 + Math.random() * 20), // 40-60 km/h (realistic city driving)
            route: route.name,
            sparklineData: generateSparkline(baseScore)
          };
        });

        setDrivers(driverData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch drivers:', err);
        setLoading(false);
      }
    };

    fetchDrivers();

    // Refresh driver data every 2 seconds for smooth movement
    const interval = setInterval(fetchDrivers, 2000);
    return () => clearInterval(interval);
  }, []);

  // Helper functions
  const getRandomLastAlert = () => {
    const minutes = Math.floor(Math.random() * 240); // 0-4 hours
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  const generateSparkline = (baseScore: number): number[] => {
    return Array.from({ length: 10 }, () => 
      Math.round(baseScore + (Math.random() - 0.5) * 15)
    );
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const mockKPIMetrics: KPIMetric[] = [
    {
      id: 'avg-score',
      title: 'Average Attention Score',
      value: drivers.length > 0 
        ? (drivers.reduce((sum, d) => sum + d.attentionScore, 0) / drivers.length).toFixed(1)
        : '0',
      change: '+2.3',
      changeType: 'positive',
      icon: 'EyeIcon',
      description: 'Fleet-wide attention level'
    },
    {
      id: 'high-risk',
      title: 'High-Risk Drivers',
      value: String(drivers.filter(d => d.riskLevel === 'high').length),
      change: '-2',
      changeType: 'positive',
      icon: 'ExclamationTriangleIcon',
      description: 'Drivers requiring attention'
    },
    {
      id: 'active-drivers',
      title: 'Active Drivers',
      value: String(drivers.length),
      change: '0',
      changeType: 'neutral',
      icon: 'MapPinIcon',
      description: 'Drivers currently on the road'
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

  if (!isHydrated || loading) {
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
          {/* Header with Logout */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fleet Management Console</h1>
              <p className="text-muted-foreground mt-1">Monitor and manage your driver fleet in real-time</p>
            </div>
            <LogoutButton className="text-sm px-4 py-2" />
          </div>

          {/* KPI Cards */}
          <FleetKPICards metrics={mockKPIMetrics} />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fleet Map - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <FleetMap 
                drivers={drivers} 
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