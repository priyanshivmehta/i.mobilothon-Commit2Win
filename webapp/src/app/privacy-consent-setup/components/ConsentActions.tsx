'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface ConsentActionsProps {
  consents: Record<string, boolean>;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSensorOnly: () => void;
}

const ConsentActions = ({
  consents,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  onSensorOnly
}: ConsentActionsProps) => {
  const requiredConsentsGiven = consents.camera && consents.processing;
  const isLastStep = currentStep >= totalSteps - 1;

  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isLastStep ? (
          <>
            <Link
              href="/driver-attention-monitor"
              onClick={onComplete}
              className={`
                flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg
                font-medium transition-component
                ${requiredConsentsGiven
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
                }
              `}
              aria-disabled={!requiredConsentsGiven}
            >
              <Icon name="CheckIcon" size={18} />
              <span>Complete Setup</span>
            </Link>
            <Link
              href="/driver-attention-monitor"
              onClick={onSensorOnly}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg border border-border text-foreground hover:bg-muted/50 font-medium transition-component"
            >
              <Icon name="CogIcon" size={18} />
              <span>Sensor-Only Mode</span>
            </Link>
          </>
        ) : (
          <>
            <button
              onClick={onNext}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-component"
            >
              <span>Continue</span>
              <Icon name="ArrowRightIcon" size={18} />
            </button>
            {currentStep > 0 && (
              <button
                onClick={onPrevious}
                className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted/50 transition-component"
              >
                Previous
              </button>
            )}
          </>
        )}
      </div>

      {/* Alternative Options */}
      <div className="flex flex-col sm:flex-row gap-2 text-sm">
        <Link
          href="/fleet-management-console"
          className="flex items-center justify-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-micro"
        >
          <Icon name="BuildingOfficeIcon" size={16} />
          <span>Fleet Console</span>
        </Link>
        <div className="hidden sm:block text-muted-foreground">•</div>
        <button className="flex items-center justify-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-micro">
          <Icon name="QuestionMarkCircleIcon" size={16} />
          <span>Privacy Help</span>
        </button>
        <div className="hidden sm:block text-muted-foreground">•</div>
        <button className="flex items-center justify-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-micro">
          <Icon name="DocumentTextIcon" size={16} />
          <span>Privacy Policy</span>
        </button>
      </div>

      {/* Status Messages */}
      {!requiredConsentsGiven && isLastStep && (
        <div className="flex items-start space-x-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <Icon name="ExclamationTriangleIcon" size={16} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning">Camera permissions required</p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable camera access and facial detection to use full attention monitoring features.
            </p>
          </div>
        </div>
      )}

      {requiredConsentsGiven && isLastStep && (
        <div className="flex items-start space-x-2 p-3 bg-success/10 border border-success/20 rounded-lg">
          <Icon name="CheckCircleIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-success">Setup ready to complete</p>
            <p className="text-xs text-muted-foreground mt-1">
              All required permissions granted. You can now access full attention monitoring features.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentActions;