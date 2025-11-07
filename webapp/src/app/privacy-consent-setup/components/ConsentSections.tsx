import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface ConsentItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  icon: string;
  details: string[];
}

interface ConsentSectionsProps {
  consents: Record<string, boolean>;
  onConsentChange: (id: string, value: boolean) => void;
}

const ConsentSections = ({ consents, onConsentChange }: ConsentSectionsProps) => {
  const consentItems: ConsentItem[] = [
    {
      id: 'camera',
      title: 'Camera Access Permission',
      description: 'Allow access to your device camera for real-time attention monitoring',
      required: true,
      icon: 'VideoCameraIcon',
      details: [
        'Video frames processed locally on your device',
        'No video data stored or transmitted',
        'Camera access can be revoked at any time',
        'Fallback to sensor-only mode available'
      ]
    },
    {
      id: 'processing',
      title: 'Facial Landmark Detection',
      description: 'Enable MediaPipe Face Mesh analysis for attention assessment',
      required: true,
      icon: 'FaceSmileIcon',
      details: [
        'Detects 468 facial landmark points',
        'Calculates blink rate and head position',
        'All computation happens on-device',
        'No biometric data stored permanently'
      ]
    },
    {
      id: 'analytics',
      title: 'Attention Metrics Collection',
      description: 'Generate attention risk scores and trend analysis',
      required: false,
      icon: 'ChartBarIcon',
      details: [
        'Aggregated attention scores for trend analysis',
        'Anonymous usage statistics for safety improvement',
        'Data retained locally for 30 days maximum',
        'Can be disabled without affecting core functionality'
      ]
    },
    {
      id: 'alerts',
      title: 'Safety Alert System',
      description: 'Receive visual and audio alerts for attention risks',
      required: false,
      icon: 'ExclamationTriangleIcon',
      details: [
        'Context-aware alert thresholds',
        'Visual alerts for high-speed scenarios',
        'Audio alerts for low-speed conditions',
        'Alert preferences customizable'
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Consent Preferences</h2>
      
      {consentItems.map((item) => (
        <div key={item.id} className="border border-border rounded-lg p-4 bg-card/30">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex-shrink-0 mt-1">
                <Icon name={item.icon as any} size={20} className="text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  {item.required && (
                    <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <button
                onClick={() => onConsentChange(item.id, !consents[item.id])}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-component
                  ${consents[item.id] ? 'bg-secondary' : 'bg-muted'}
                  focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2
                `}
                aria-label={`Toggle ${item.title}`}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-component
                    ${consents[item.id] ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
          
          <details className="group">
            <summary className="text-xs text-secondary cursor-pointer hover:text-secondary/80 transition-micro mb-2">
              View Details
            </summary>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {item.details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Icon name="CheckIcon" size={12} className="text-success mt-0.5 flex-shrink-0" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ))}
    </div>
  );
};

export default ConsentSections;