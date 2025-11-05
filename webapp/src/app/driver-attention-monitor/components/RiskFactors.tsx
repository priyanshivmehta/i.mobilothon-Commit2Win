import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface RiskFactor {
  id: string;
  label: string;
  impact: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface RiskFactorsProps {
  factors: RiskFactor[];
  className?: string;
}

const RiskFactors = ({ factors, className = '' }: RiskFactorsProps) => {
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'bg-error/20 text-error border-error/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'high': return 'ExclamationTriangleIcon';
      case 'medium': return 'ExclamationCircleIcon';
      case 'low': return 'InformationCircleIcon';
      default: return 'QuestionMarkCircleIcon';
    }
  };

  return (
    <div className={`${className}`}>
      <div className="space-y-2">
        {factors.slice(0, 4).map((factor) => (
          <div key={factor.id} className={`p-3 rounded-lg border transition-all ${getSeverityColor(factor.severity)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon 
                  name={getSeverityIcon(factor.severity)} 
                  size={16} 
                  className={factor.severity === 'high' ? 'text-error' : factor.severity === 'medium' ? 'text-warning' : 'text-success'}
                />
                <span className="text-sm font-semibold text-foreground">{factor.label}</span>
              </div>
              <span className={`text-lg font-bold ${factor.severity === 'high' ? 'text-error' : factor.severity === 'medium' ? 'text-warning' : 'text-success'}`}>
                {factor.impact}%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-muted/30 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  factor.severity === 'high' ? 'bg-error' : 
                  factor.severity === 'medium' ? 'bg-warning' : 'bg-success'
                }`}
                style={{ width: `${Math.min(100, factor.impact)}%` }}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">{factor.description}</p>
          </div>
        ))}
      </div>

      {factors.length === 0 && (
        <div className="text-center py-6">
          <Icon name="CheckCircleIcon" size={40} className="text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">All Clear</p>
          <p className="text-xs text-muted-foreground mt-1">No risk factors detected</p>
        </div>
      )}
    </div>
  );
};

export default RiskFactors;