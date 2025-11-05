import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  technical: string;
}

const ProcessingExplanation = () => {
  const processingSteps: ProcessingStep[] = [
    {
      id: 'capture',
      title: 'Camera Access',
      description: 'Your device camera captures video frames for real-time analysis',
      icon: 'VideoCameraIcon',
      technical: 'WebRTC MediaStream API with getUserMedia() for local video capture'
    },
    {
      id: 'detection',
      title: 'Face Mesh Detection',
      description: 'MediaPipe processes facial landmarks entirely on your device',
      icon: 'FaceSmileIcon',
      technical: 'Google MediaPipe Face Mesh with 468 3D facial landmark points'
    },
    {
      id: 'analysis',
      title: 'Attention Analysis',
      description: 'Blink patterns and head position calculate attention metrics locally',
      icon: 'EyeIcon',
      technical: 'PERCLOS calculation, head pose estimation, and blink rate analysis'
    },
    {
      id: 'privacy',
      title: 'No Data Transmission',
      description: 'All processing happens locally - no video data leaves your device',
      icon: 'LockClosedIcon',
      technical: 'Client-side WebGL processing with zero network transmission'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">How On-Device Processing Works</h2>
        <p className="text-sm text-muted-foreground">
          Your privacy is protected through local computation without external data transmission
        </p>
      </div>

      <div className="grid gap-4">
        {processingSteps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className="flex items-start space-x-4 p-4 bg-card/50 rounded-lg border border-border">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Icon name={step.icon as any} size={20} className="text-secondary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-secondary bg-secondary/20 px-2 py-1 rounded">
                    Step {index + 1}
                  </span>
                  <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                <details className="group">
                  <summary className="text-xs text-secondary cursor-pointer hover:text-secondary/80 transition-micro">
                    Technical Details
                  </summary>
                  <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/30 p-2 rounded">
                    {step.technical}
                  </p>
                </details>
              </div>
            </div>
            {index < processingSteps.length - 1 && (
              <div className="absolute left-9 top-16 w-0.5 h-4 bg-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessingExplanation;