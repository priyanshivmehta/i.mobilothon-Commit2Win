'use client';

import React from 'react';
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

interface DriverDetailsModalProps {
  driver: Driver | null;
  onClose: () => void;
  onEdit?: (driver: Driver) => void;
  onDelete?: (driverId: string) => void;
}

const DriverDetailsModal = ({ driver, onClose, onEdit, onDelete }: DriverDetailsModalProps) => {
  if (!driver) return null;

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
        return 'bg-error/10 border-error';
      case 'medium':
        return 'bg-warning/10 border-warning';
      default:
        return 'bg-success/10 border-success';
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(driver);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove ${driver.name} from the fleet?`)) {
      if (onDelete) {
        onDelete(driver.id);
      }
      onClose();
    }
  };

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-glass"
        onClick={onClose}
      />
      
      <div className="relative bg-card border border-border rounded-lg shadow-elevation-3 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{driver.name}</h2>
            <p className="text-sm text-muted-foreground">{driver.vehicleId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-micro"
          >
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className={`p-4 rounded-lg border ${getRiskBgColor(driver.riskLevel)}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Current Status</h3>
              <span className={`text-sm font-medium ${getRiskColor(driver.riskLevel)} uppercase`}>
                {driver.riskLevel} Risk
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Attention Score</p>
                <p className="text-2xl font-bold text-foreground">{driver.attentionScore}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Speed</p>
                <p className="text-2xl font-bold text-foreground">{driver.speed} <span className="text-sm">km/h</span></p>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Driver Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Driver ID</p>
                <p className="text-sm font-medium text-foreground">{driver.id.substring(0, 8)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Vehicle ID</p>
                <p className="text-sm font-medium text-foreground">{driver.vehicleId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Current Route</p>
                <p className="text-sm font-medium text-foreground">{driver.route}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Alert</p>
                <p className="text-sm font-medium text-foreground">{driver.lastAlert}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Current Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Latitude</p>
                <p className="text-sm font-mono text-foreground">{driver.lat.toFixed(6)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Longitude</p>
                <p className="text-sm font-mono text-foreground">{driver.lng.toFixed(6)}</p>
              </div>
            </div>
          </div>

          {/* Performance Trend */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Performance Trend (Last 10 readings)</h3>
            <div className="flex items-end space-x-1 h-24">
              {driver.sparklineData.map((value, index) => {
                const height = (value / 100) * 100;
                const color = value >= 80 ? 'bg-success' : value >= 65 ? 'bg-warning' : 'bg-error';
                return (
                  <div
                    key={index}
                    className={`flex-1 ${color} rounded-t transition-all`}
                    style={{ height: `${height}%` }}
                    title={`Score: ${value}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Older</span>
              <span>Recent</span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Score Breakdown</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Eye Tracking</span>
                  <span className="text-foreground font-medium">{Math.round(driver.attentionScore + (Math.random() - 0.5) * 10)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${Math.round(driver.attentionScore + (Math.random() - 0.5) * 10)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Head Position</span>
                  <span className="text-foreground font-medium">{Math.round(driver.attentionScore + (Math.random() - 0.5) * 8)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${Math.round(driver.attentionScore + (Math.random() - 0.5) * 8)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Drowsiness Detection</span>
                  <span className="text-foreground font-medium">{Math.round(driver.attentionScore + (Math.random() - 0.5) * 12)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${Math.round(driver.attentionScore + (Math.random() - 0.5) * 12)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-between">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-micro flex items-center space-x-2"
          >
            <Icon name="TrashIcon" size={16} />
            <span>Remove Driver</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-micro"
            >
              Close
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-micro flex items-center space-x-2"
            >
              <Icon name="PencilIcon" size={16} />
              <span>Edit Driver</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDetailsModal;
