'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConsentHeader from './ConsentHeader';
import ProcessingExplanation from './ProcessingExplanation';
import ConsentSections from './ConsentSections';
import TrustSignals from './TrustSignals';
import ProgressIndicator from './ProgressIndicator';
import ConsentActions from './ConsentActions';

interface ConsentState {
  camera: boolean;
  processing: boolean;
  analytics: boolean;
  alerts: boolean;
}

const PrivacyConsentInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [consents, setConsents] = useState<ConsentState>({
    camera: false,
    processing: false,
    analytics: true,
    alerts: true
  });

  const totalSteps = 4;

  useEffect(() => {
    setIsHydrated(true);
    
    // Load saved consent preferences
    const savedConsents = localStorage.getItem('vw-privacy-consents');
    if (savedConsents) {
      try {
        const parsed = JSON.parse(savedConsents);
        setConsents(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse saved consents:', error);
      }
    }
  }, []);

  const handleConsentChange = (id: string, value: boolean) => {
    if (!isHydrated) return;
    
    setConsents(prev => {
      const updated = { ...prev, [id]: value };
      
      // Save to localStorage
      localStorage.setItem('vw-privacy-consents', JSON.stringify(updated));
      
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (!isHydrated) return;
    
    // Save final consent state
    localStorage.setItem('vw-privacy-consents', JSON.stringify(consents));
    localStorage.setItem('vw-privacy-setup-completed', 'true');
    localStorage.setItem('vw-privacy-setup-date', new Date().toISOString());
    
    // Navigate to driver monitor
    router.push('/driver-attention-monitor');
  };

  const handleSensorOnly = () => {
    if (!isHydrated) return;
    
    // Set sensor-only mode
    const sensorOnlyConsents = {
      camera: false,
      processing: false,
      analytics: false,
      alerts: true
    };
    
    localStorage.setItem('vw-privacy-consents', JSON.stringify(sensorOnlyConsents));
    localStorage.setItem('vw-privacy-setup-completed', 'true');
    localStorage.setItem('vw-privacy-mode', 'sensor-only');
    
    // Navigate to driver monitor
    router.push('/driver-attention-monitor');
  };

  const handleClose = () => {
    router.push('/driver-attention-monitor');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ProcessingExplanation />;
      case 1:
        return (
          <ConsentSections
            consents={consents}
            onConsentChange={handleConsentChange}
          />
        );
      case 2:
        return <TrustSignals />;
      case 3:
        return (
          <div className="space-y-6">
            <ConsentSections
              consents={consents}
              onConsentChange={handleConsentChange}
            />
            <TrustSignals />
          </div>
        );
      default:
        return <ProcessingExplanation />;
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-glass" />
        
        {/* Modal Content */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-elevation-3 overflow-hidden">
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
              <ConsentHeader onClose={handleClose} />
              <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderStepContent()}
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0 p-6 border-t border-border bg-card/50">
              <ConsentActions
                consents={consents}
                currentStep={currentStep}
                totalSteps={totalSteps}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onComplete={handleComplete}
                onSensorOnly={handleSensorOnly}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyConsentInteractive;