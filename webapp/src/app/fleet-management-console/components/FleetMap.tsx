'use client';

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

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
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsHydrated(true);
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
      
      <div className="relative h-96 bg-slate-800" ref={mapRef}>
        {/* Mock Map Background */}
        <iframe
          width="100%"
          height="100%"
          loading="lazy"
          title="Fleet Management Map"
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps?q=40.7128,-74.0060&z=12&output=embed"
          className="absolute inset-0"
        />
        
        {/* Driver Markers Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {drivers.map((driver, index) => (
            <div
              key={driver.id}
              className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${20 + (index % 4) * 20}%`,
                top: `${20 + Math.floor(index / 4) * 25}%`,
              }}
              onClick={() => handleDriverClick(driver)}
            >
              <div className={`
                w-8 h-8 rounded-full border-2 ${getRiskColor(driver.riskLevel)} ${getRiskBorderColor(driver.riskLevel)}
                flex items-center justify-center shadow-elevation-2 hover:scale-110 transition-component
              `}>
                <Icon name="TruckIcon" size={16} className="text-white" />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-glass px-2 py-1 rounded text-xs font-medium text-foreground whitespace-nowrap">
                {driver.name}
              </div>
            </div>
          ))}
        </div>

        {/* Driver Detail Popover */}
        {selectedDriver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-card border border-border rounded-lg shadow-elevation-3 p-4 max-w-sm w-full mx-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {selectedDriver.name}
                </h3>
                <button
                  onClick={closePopover}
                  className="text-muted-foreground hover:text-foreground transition-micro"
                >
                  <Icon name="XMarkIcon" size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vehicle ID:</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedDriver.vehicleId}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Attention Score:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-foreground">
                      {selectedDriver.attentionScore}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getRiskColor(selectedDriver.riskLevel)}`} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedDriver.speed} mph
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Route:</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedDriver.route}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Alert:</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedDriver.lastAlert}
                  </span>
                </div>
                
                {/* Mini Sparkline */}
                <div className="pt-2">
                  <span className="text-xs text-muted-foreground mb-2 block">
                    Attention Trend (Last 10 minutes)
                  </span>
                  <div className="flex items-end space-x-1 h-8">
                    {selectedDriver.sparklineData.map((value, index) => (
                      <div
                        key={index}
                        className="bg-secondary flex-1 rounded-sm"
                        style={{ height: `${(value / 100) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetMap;