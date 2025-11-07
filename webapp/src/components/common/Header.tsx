'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  className?: string;
  userRole?: 'USER' | 'EMPLOYEE' | null;
}

interface NavigationItem {
  id: string;
  label: string;
  path: string;
  role: 'driver' | 'fleet';
  description: string;
}

interface ConnectionStatus {
  camera: boolean;
  websocket: boolean;
  processing: boolean;
}

interface PrivacyStatus {
  consentGiven: boolean;
  cameraEnabled: boolean;
  dataProcessing: boolean;
}

const Header = ({ className = '', userRole = null }: HeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    camera: true,
    websocket: true,
    processing: true,
  });
  const [privacyStatus, setPrivacyStatus] = useState<PrivacyStatus>({
    consentGiven: true,
    cameraEnabled: true,
    dataProcessing: true,
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'driver',
      label: 'Driver Monitor',
      path: '/driver-attention-monitor',
      role: 'driver',
      description: 'Real-time attention assessment interface'
    },
    {
      id: 'fleet',
      label: 'Fleet Console',
      path: '/fleet-management-console',
      role: 'fleet',
      description: 'Comprehensive oversight dashboard'
    }
  ];

  // Filter navigation items based on user role
  const visibleNavigationItems = userRole === 'USER' 
    ? navigationItems.filter(item => item.role === 'driver') 
    : navigationItems; // EMPLOYEE sees both

  const getCurrentRole = (): 'driver' | 'fleet' | null => {
    if (pathname === '/driver-attention-monitor') return 'driver';
    if (pathname === '/fleet-management-console') return 'fleet';
    return null;
  };

  const getConnectionStatusColor = (): string => {
    const { camera, websocket, processing } = connectionStatus;
    if (camera && websocket && processing) return 'text-success';
    if (!camera || !websocket || !processing) return 'text-warning';
    return 'text-error';
  };

  const getPrivacyStatusColor = (): string => {
    const { consentGiven, cameraEnabled, dataProcessing } = privacyStatus;
    if (consentGiven && cameraEnabled && dataProcessing) return 'text-success';
    if (!consentGiven) return 'text-error';
    return 'text-warning';
  };

  const handlePrivacyClick = () => {
    setShowPrivacyModal(true);
  };

  const closePrivacyModal = () => {
    setShowPrivacyModal(false);
  };

  useEffect(() => {
    // Simulate connection monitoring
    const interval = setInterval(() => {
      setConnectionStatus(prev => ({
        ...prev,
        websocket: Math.random() > 0.1, // 90% uptime simulation
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentRole = getCurrentRole();

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-100 bg-background border-b border-border ${className}`}>
        <div className="flex items-center justify-between h-16 px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3 transition-micro hover:opacity-80">
              <div className="w-8 h-8 bg-secondary rounded-sm flex items-center justify-center">
                <span className="text-secondary-foreground font-semibold text-sm">VW</span>
              </div>
              <div className="flex flex-col">
                <span className="text-foreground font-medium text-sm leading-tight">
                  Driver Attention Platform
                </span>
                <span className="text-muted-foreground text-xs">
                  Safety Technology Suite
                </span>
              </div>
            </Link>
          </div>

          {/* Role Toggle Navigation - Only show if user has multiple options */}
          {visibleNavigationItems.length > 1 && (
            <div className="flex items-center space-x-1 bg-card rounded-lg p-1 border border-border">
              {visibleNavigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    // Force full page reload to stop camera and reset state
                    window.location.href = item.path;
                  }}
                  className={`
                    relative px-4 py-2 rounded-md text-sm font-medium transition-component cursor-pointer
                    ${currentRole === item.role
                      ? 'bg-secondary text-secondary-foreground shadow-elevation-1'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  {item.label}
                  {currentRole === item.role && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-secondary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {/* Privacy Status */}
            <button
              onClick={handlePrivacyClick}
              className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-md border transition-micro
                hover:bg-muted/50 ${getPrivacyStatusColor()} border-border
              `}
              title="Privacy Settings"
            >
              <Icon 
                name="ShieldCheckIcon" 
                size={16} 
                className={getPrivacyStatusColor()}
              />
              <span className="text-xs font-medium hidden sm:inline">
                {privacyStatus.consentGiven ? 'Privacy Active' : 'Privacy Setup'}
              </span>
            </button>

            {/* Connection Status */}
            <div 
              className={`
                flex items-center space-x-2 px-3 py-1.5 rounded-md border border-border
                ${getConnectionStatusColor()}
              `}
              title="System Status"
            >
              <Icon 
                name="SignalIcon" 
                size={16} 
                className={getConnectionStatusColor()}
              />
              <span className="text-xs font-medium hidden sm:inline">
                {connectionStatus.camera && connectionStatus.websocket && connectionStatus.processing
                  ? 'Connected' :'Checking...'
                }
              </span>
            </div>

            {/* Current Time */}
            <div className="text-xs font-mono text-muted-foreground hidden md:block">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Privacy Consent Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-glass"
            onClick={closePrivacyModal}
          />
          <div className="relative bg-card border border-border rounded-lg shadow-elevation-3 max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Privacy Settings</h3>
              <button
                onClick={closePrivacyModal}
                className="text-muted-foreground hover:text-foreground transition-micro"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Camera Access</span>
                <div className={`w-3 h-3 rounded-full ${privacyStatus.cameraEnabled ? 'bg-success' : 'bg-error'}`} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Data Processing</span>
                <div className={`w-3 h-3 rounded-full ${privacyStatus.dataProcessing ? 'bg-success' : 'bg-error'}`} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Consent Status</span>
                <div className={`w-3 h-3 rounded-full ${privacyStatus.consentGiven ? 'bg-success' : 'bg-error'}`} />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closePrivacyModal}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-micro"
              >
                Close
              </button>
              <Link
                href="/privacy-consent-setup"
                onClick={closePrivacyModal}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/90 transition-micro"
              >
                Manage Privacy
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;