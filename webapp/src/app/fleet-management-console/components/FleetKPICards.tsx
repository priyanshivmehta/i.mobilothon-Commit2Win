import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface KPIMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
  description: string;
}

interface FleetKPICardsProps {
  metrics: KPIMetric[];
}

const FleetKPICards = ({ metrics }: FleetKPICardsProps) => {
  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-error';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return 'ArrowUpIcon';
      case 'negative':
        return 'ArrowDownIcon';
      default:
        return 'MinusIcon';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="bg-card border border-border rounded-lg p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-component"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Icon 
                  name={metric.icon as any} 
                  size={20} 
                  className="text-secondary" 
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </h3>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {metric.value}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {metric.description}
            </p>
            <div className={`flex items-center space-x-1 ${getChangeColor(metric.changeType)}`}>
              <Icon 
                name={getChangeIcon(metric.changeType) as any} 
                size={12} 
              />
              <span className="text-xs font-medium">
                {metric.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FleetKPICards;