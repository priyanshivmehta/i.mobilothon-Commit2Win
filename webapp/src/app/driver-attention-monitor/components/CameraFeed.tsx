'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CameraFeedProps {
  isPrivacyMode: boolean;
  onCameraStatus: (status: boolean) => void;
}

interface FaceLandmark {
  x: number;
  y: number;
}

const CameraFeed = ({ isPrivacyMode, onCameraStatus }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isSimulated, setIsSimulated] = useState(false);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmark[]>([]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraPermission('granted');
          setIsSimulated(false);
          onCameraStatus(true);
        }
      } catch (error) {
        console.log('Camera access denied, using simulated feed');
        setCameraPermission('denied');
        setIsSimulated(true);
        onCameraStatus(false);
        startSimulatedFeed();
      }
    };

    const startSimulatedFeed = () => {
      // Simulate face landmarks for demo
      const interval = setInterval(() => {
        const mockLandmarks: FaceLandmark[] = Array.from({ length: 468 }, (_, i) => ({
          x: 200 + Math.sin(Date.now() / 1000 + i) * 100,
          y: 150 + Math.cos(Date.now() / 1000 + i) * 80,
        }));
        setFaceLandmarks(mockLandmarks);
      }, 100);

      return () => clearInterval(interval);
    };

    if (!isPrivacyMode) {
      initializeCamera();
    } else {
      setIsSimulated(true);
      startSimulatedFeed();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isHydrated, isPrivacyMode, onCameraStatus]);

  const drawFaceMesh = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw face landmarks
    ctx.fillStyle = '#0F766E';
    ctx.strokeStyle = '#14B8A6';
    ctx.lineWidth = 1;

    faceLandmarks.forEach((landmark, index) => {
      if (index % 3 === 0) { // Draw every 3rd landmark for performance
        ctx.beginPath();
        ctx.arc(landmark.x, landmark.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Draw face outline
    if (faceLandmarks.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#14B8A6';
      ctx.lineWidth = 2;
      ctx.strokeRect(150, 100, 200, 250);
    }
  };

  useEffect(() => {
    if (faceLandmarks.length > 0) {
      drawFaceMesh();
    }
  }, [faceLandmarks]);

  if (!isHydrated) {
    return (
      <div className="relative w-full h-80 bg-card rounded-lg border border-border flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading camera...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 bg-card rounded-lg border border-border overflow-hidden">
      {/* Camera Status Indicator */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2 bg-background/80 backdrop-blur-glass rounded-md px-2 py-1">
        <div className={`w-2 h-2 rounded-full ${cameraPermission === 'granted' ? 'bg-success' : 'bg-warning'}`} />
        <span className="text-xs font-medium text-foreground">
          {isSimulated ? 'Simulated' : 'Live'}
        </span>
      </div>

      {/* Privacy Mode Indicator */}
      {isPrivacyMode && (
        <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-glass rounded-md px-2 py-1">
          <div className="flex items-center space-x-1">
            <Icon name="ShieldCheckIcon" size={14} className="text-secondary" />
            <span className="text-xs font-medium text-foreground">Privacy Mode</span>
          </div>
        </div>
      )}

      {/* Video Feed */}
      {!isSimulated ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Icon name="VideoCameraIcon" size={48} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Simulated Camera Feed</p>
            <p className="text-xs text-muted-foreground mt-1">Face mesh detection active</p>
          </div>
        </div>
      )}

      {/* Face Mesh Overlay Canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Processing Indicator */}
      <div className="absolute bottom-3 left-3 z-10 bg-background/80 backdrop-blur-glass rounded-md px-2 py-1">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
          <span className="text-xs font-medium text-foreground">Processing</span>
        </div>
      </div>
    </div>
  );
};

export default CameraFeed;