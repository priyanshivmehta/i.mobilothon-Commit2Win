import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface TrustBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  verified: boolean;
}

const TrustSignals = () => {
  const trustBadges: TrustBadge[] = [
    {
      id: 'volkswagen',
      title: 'Volkswagen Certified',
      description: 'Official VW safety technology platform',
      icon: 'ShieldCheckIcon',
      verified: true
    },
    {
      id: 'ondevice',
      title: 'On-Device Processing',
      description: 'Zero data transmission guarantee',
      icon: 'DevicePhoneMobileIcon',
      verified: true
    },
    {
      id: 'opensource',
      title: 'Open Source Components',
      description: 'MediaPipe and WebRTC transparency',
      icon: 'CodeBracketIcon',
      verified: true
    },
    {
      id: 'privacy',
      title: 'Privacy by Design',
      description: 'GDPR compliant architecture',
      icon: 'LockClosedIcon',
      verified: true
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">Trust & Security</h2>
        <p className="text-sm text-muted-foreground">
          Industry-leading privacy protection with transparent technology
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {trustBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center space-x-3 p-3 bg-card/50 rounded-lg border border-border"
          >
            <div className="flex-shrink-0">
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                ${badge.verified ? 'bg-success/20' : 'bg-muted/50'}
              `}>
                <Icon 
                  name={badge.icon as any} 
                  size={16} 
                  className={badge.verified ? 'text-success' : 'text-muted-foreground'} 
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-foreground">{badge.title}</h3>
                {badge.verified && (
                  <Icon name="CheckBadgeIcon" size={14} className="text-success" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Icon name="InformationCircleIcon" size={20} className="text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Data Processing Guarantee</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This application processes all video data locally on your device using WebGL and MediaPipe. 
              No video frames, facial data, or biometric information is transmitted to external servers. 
              Only aggregated, anonymous attention metrics may be shared for safety research purposes 
              with your explicit consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;