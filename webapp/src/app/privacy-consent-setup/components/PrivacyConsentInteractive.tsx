'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  [key: string]: boolean;
}

const PrivacyConsentInteractive = () => {
  const router = useRouter();
  const supabase = createClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [consents, setConsents] = useState<ConsentState>({
    camera: false,
    processing: false,
    analytics: true,
    alerts: true
  });
  const [userId, setUserId] = useState<string | null>(null);

  const totalSteps = 4;

  useEffect(() => {
    setIsHydrated(true);
    
    // Get current user and load consent preferences from database
    const loadUserConsents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          
          // Load from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('camera_consent, processing_consent, analytics_consent')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            setConsents({
              camera: profile.camera_consent || false,
              processing: profile.processing_consent || false,
              analytics: profile.analytics_consent !== false, // Default to true
              alerts: true
            });
          }
        }
      } catch (error) {
        console.error('Error loading user consents:', error);
        // Continue with default values
      }
    };
    
    loadUserConsents();
  }, [supabase]);

  const handleConsentChange = (id: string, value: boolean) => {
    if (!isHydrated) return;
    
    console.log(`Consent change: ${id} = ${value}`);
    
    setConsents(prev => {
      const updated = { ...prev, [id]: value };
      
      // Save to localStorage with error handling
      try {
        localStorage.setItem('vw-privacy-consents', JSON.stringify(updated));
        console.log('Updated consents:', updated);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        // Continue anyway - we'll save to database on completion
      }
      
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

  const handleComplete = async () => {
    if (!isHydrated || !userId) {
      alert('Please wait for the page to fully load before completing setup.');
      return;
    }
    
    try {
      // Save consent state to database
      const { error } = await supabase
        .from('profiles')
        .update({
          camera_consent: consents.camera,
          processing_consent: consents.processing,
          analytics_consent: consents.analytics,
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Failed to save consents:', error);
        alert('Failed to save consent preferences. Please try again.');
        return;
      }
      
      // Save to localStorage as backup (with error handling)
      try {
        localStorage.setItem('vw-privacy-consents', JSON.stringify(consents));
        localStorage.setItem('vw-privacy-setup-completed', 'true');
        localStorage.setItem('vw-privacy-setup-date', new Date().toISOString());
      } catch (localError) {
        console.error('localStorage error (non-critical):', localError);
        // Continue anyway since database save succeeded
      }
      
      // Get user role to determine redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      // Navigate based on role
      if (profile?.role === 'EMPLOYEE') {
        router.push('/fleet-management-console');
      } else {
        router.push('/driver-attention-monitor');
      }
      
      router.refresh();
    } catch (err: any) {
      console.error('Complete error:', err);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSensorOnly = async () => {
    if (!isHydrated || !userId) {
      alert('Please wait for the page to fully load before completing setup.');
      return;
    }
    
    try {
      // Set sensor-only mode in database
      const { error } = await supabase
        .from('profiles')
        .update({
          camera_consent: false,
          processing_consent: false,
          analytics_consent: false,
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Failed to save sensor-only mode:', error);
        alert('Failed to save preferences. Please try again.');
        return;
      }
      
      // Save to localStorage (with error handling)
      try {
        const sensorOnlyConsents = {
          camera: false,
          processing: false,
          analytics: false,
          alerts: true
        };
        
        localStorage.setItem('vw-privacy-consents', JSON.stringify(sensorOnlyConsents));
        localStorage.setItem('vw-privacy-setup-completed', 'true');
        localStorage.setItem('vw-privacy-mode', 'sensor-only');
      } catch (localError) {
        console.error('localStorage error (non-critical):', localError);
        // Continue anyway since database save succeeded
      }
      
      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      // Navigate based on role
      if (profile?.role === 'EMPLOYEE') {
        router.push('/fleet-management-console');
      } else {
        router.push('/driver-attention-monitor');
      }
      
      router.refresh();
    } catch (err: any) {
      console.error('Sensor-only error:', err);
      alert('An error occurred. Please try again.');
    }
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-glass" />
        
        {/* Modal Content */}
          <div className="relative z-[10000] w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-elevation-3 overflow-hidden">
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