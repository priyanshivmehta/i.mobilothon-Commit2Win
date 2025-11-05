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
    <div className={`bg-card rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="ChartBarIcon" size={20} className="text-secondary" />
        <h3 className="text-lg font-semibold text-foreground">Risk Factors</h3>
      </div>

      <div className="space-y-3">
        {factors.slice(0, 3).map((factor, index) => (
          <div key={factor.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{factor.label}</span>
                  <Icon 
                    name={getSeverityIcon(factor.severity)} 
                    size={14} 
                    className={factor.severity === 'high' ? 'text-error' : factor.severity === 'medium' ? 'text-warning' : 'text-success'}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`px-2 py-1 rounded-md border text-xs font-medium ${getSeverityColor(factor.severity)}`}>
                {factor.impact}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {factors.length === 0 && (
        <div className="text-center py-8">
          <Icon name="CheckCircleIcon" size={48} className="text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No significant risk factors detected</p>
          <p className="text-xs text-muted-foreground mt-1">Attention levels are optimal</p>
        </div>
      )}
    </div>
  );
};

export default RiskFactors;