'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Icon from '@/components/ui/AppIcon';

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

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

interface FleetMapProps {
  drivers: Driver[];
  onDriverSelect: (driver: Driver) => void;
}

const FleetMap = ({ drivers, onDriverSelect }: FleetMapProps) => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsHydrated(true);
    
    // Fix Leaflet marker icons
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-error';
      case 'medium':
        return 'bg-warning';
      default:
        return 'bg-success';
    }
  };

  const getRiskBorderColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'border-error';
      case 'medium':
        return 'border-warning';
      default:
        return 'border-success';
    }
  };

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver);
    onDriverSelect(driver);
  };

  const closePopover = () => {
    setSelectedDriver(null);
  };

  // Create custom colored markers for different risk levels
  const createCustomIcon = (riskLevel: string) => {
    if (!L) return null;
    
    const color = riskLevel === 'high' ? '#ef4444' : riskLevel === 'medium' ? '#f59e0b' : '#22c55e';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="16" height="16">
            <path d="M3.5 20.5v-17h17v17H3.5zM2 22h20V2H2v20zm2-2h16V4H4v16zm7-9h2v6h-2v-6zm0-4h2v2h-2V7z"/>
          </svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  if (!isHydrated) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 h-96">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-full bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Live Fleet Map</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-error rounded-full"></div>
              <span>High Risk</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative h-96 bg-slate-800">
        {isHydrated && L ? (
          <MapContainer
            center={[21.1702, 72.8311]} // Surat, Gujarat (SVNIT campus area)
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Driver Markers */}
            {drivers.map((driver) => (
              <Marker
                key={driver.id}
                position={[driver.lat, driver.lng]}
                icon={createCustomIcon(driver.riskLevel) as any}
                eventHandlers={{
                  click: () => handleDriverClick(driver),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm">{driver.name}</h3>
                    <p className="text-xs text-gray-600">{driver.vehicleId}</p>
                    <p className="text-xs mt-1">Score: <span className="font-medium">{driver.attentionScore}</span></p>
                    <p className="text-xs">Speed: {driver.speed} km/h</p>
                    <p className="text-xs">Route: {driver.route}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-700">
            <div className="text-white text-sm">Loading map...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetMap;