import React from 'react';
import Icon from '@/components/ui/AppIcon';
import LogoutButton from '@/components/common/LogoutButton';

interface ConsentHeaderProps {
  onClose: () => void;
}

const ConsentHeader = ({ onClose }: ConsentHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
          <Icon name="ShieldCheckIcon" size={24} className="text-secondary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Privacy Consent Setup</h1>
          <p className="text-sm text-muted-foreground">Configure your data processing preferences</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <LogoutButton className="text-sm px-3 py-1.5" />
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-muted/50 transition-micro text-muted-foreground hover:text-foreground"
          aria-label="Close privacy setup"
        >
          <Icon name="XMarkIcon" size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConsentHeader;