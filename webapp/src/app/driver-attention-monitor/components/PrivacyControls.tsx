'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Portal from '@/components/ui/Portal';

interface PrivacyControlsProps {
  isPrivacyMode: boolean;
  onPrivacyModeChange: (enabled: boolean) => void;
  className?: string;
}

const PrivacyControls = ({ isPrivacyMode, onPrivacyModeChange, className = '' }: PrivacyControlsProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handlePrivacyToggle = () => {
    if (!isHydrated) return;
    onPrivacyModeChange(!isPrivacyMode);
  };

  const openConsentModal = () => {
    if (!isHydrated) return;
    setShowConsentModal(true);
  };

  const closeConsentModal = () => {
    setShowConsentModal(false);
  };

  if (!isHydrated) {
    return (
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="ShieldCheckIcon" size={20} className="text-secondary" />
          <h3 className="text-lg font-semibold text-foreground">Privacy Controls</h3>
        </div>

        <div className="space-y-4">
          {/* Privacy Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center space-x-3">
              <Icon 
                name="EyeSlashIcon" 
                size={20} 
                className={isPrivacyMode ? 'text-secondary' : 'text-muted-foreground'}
              />
              <div>
                <div className="text-sm font-medium text-foreground">Privacy Mode</div>
                <div className="text-xs text-muted-foreground">
                  {isPrivacyMode ? 'Sensor-only operation active' : 'Full monitoring enabled'}
                </div>
              </div>
            </div>

            <button
              onClick={handlePrivacyToggle}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${isPrivacyMode ? 'bg-secondary' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isPrivacyMode ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Processing Information */}
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="CpuChipIcon" size={16} className="text-secondary" />
              <span className="text-sm font-medium text-foreground">On-Device Processing</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All face mesh analysis happens locally on your device. No video data is transmitted or stored externally.
            </p>
          </div>

          {/* Consent Management */}
          <div className="flex items-center justify-between">
            <button
              onClick={openConsentModal}
              className="text-sm text-secondary hover:text-secondary/80 transition-micro underline"
            >
              View Privacy Details
            </button>
            <Link
              href="/privacy-consent-setup"
              className="text-sm text-secondary hover:text-secondary/80 transition-micro underline"
            >
              Manage Consent
            </Link>
          </div>
        </div>
      </div>

      {/* Privacy Consent Modal */}
      {showConsentModal && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-glass"
              onClick={closeConsentModal}
            />
            <div className="relative z-[100000] bg-card border border-border rounded-lg shadow-elevation-3 max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Privacy & Data Processing</h3>
              <button
                onClick={closeConsentModal}
                className="text-muted-foreground hover:text-foreground transition-micro"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon name="ShieldCheckIcon" size={20} className="text-success" />
                  <span className="font-medium text-foreground">Local Processing Only</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your camera feed is processed entirely on your device using MediaPipe Face Mesh technology. 
                  No video frames leave your browser or device.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Camera Access</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Granted</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Face Mesh Detection</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Data Transmission</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <span className="text-xs text-muted-foreground">Disabled</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Privacy Mode:</strong> When enabled, only basic sensor data (accelerometer, gyroscope) 
                  is used for attention assessment. Camera processing is completely disabled.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeConsentModal}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-micro"
              >
                Close
              </button>
              <Link
                href="/privacy-consent-setup"
                onClick={closeConsentModal}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-micro"
              >
                Manage Settings
              </Link>
            </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default PrivacyControls;