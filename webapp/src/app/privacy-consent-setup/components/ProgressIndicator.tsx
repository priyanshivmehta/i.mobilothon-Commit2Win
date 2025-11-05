import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProgressStep {
  id: string;
  title: string;
  completed: boolean;
}

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  const steps: ProgressStep[] = [
    { id: 'explanation', title: 'Understanding', completed: currentStep > 0 },
    { id: 'consent', title: 'Permissions', completed: currentStep > 1 },
    { id: 'trust', title: 'Verification', completed: currentStep > 2 },
    { id: 'complete', title: 'Complete', completed: currentStep >= 3 }
  ];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Setup Progress</span>
        <span className="text-foreground font-medium">
          {currentStep} of {totalSteps} steps
        </span>
      </div>

      <div className="relative">
        <div className="w-full bg-muted/30 rounded-full h-2">
          <div
            className="bg-secondary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              flex flex-col items-center space-y-1 p-2 rounded-lg transition-component
              ${step.completed ? 'bg-secondary/10' : 'bg-muted/20'}
            `}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-component
              ${step.completed 
                ? 'bg-secondary text-secondary-foreground' 
                : currentStep === index 
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-muted text-muted-foreground'
              }
            `}>
              {step.completed ? (
                <Icon name="CheckIcon" size={14} />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`
              text-xs font-medium text-center
              ${step.completed ? 'text-secondary' : 'text-muted-foreground'}
            `}>
              {step.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;