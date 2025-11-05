'use client';

import React, { useRef, useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface CameraFeedProps {
  isPrivacyMode: boolean;
  onCameraStatus: (status: boolean) => void;
  // env controls are passed down so the camera can include them in requests
  env?: Record<string, any>;
  // callback for receiving model predictions from backend
  onPrediction?: (data: any) => void;
  // whether to display backend preview overlay
  showPreview?: boolean;
  // auto-detected environment flags from backend (night, sunglasses, etc.)
  autoEnv?: { night_detected?: boolean; sunglasses_detected?: boolean; vibration_detected?: boolean } | null;
}

interface FaceLandmark {
  x: number;
  y: number;
}

const CameraFeed = ({ isPrivacyMode, onCameraStatus, env, onPrediction, showPreview = true, autoEnv = null }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const [steeringAngle, setSteeringAngle] = useState<number | null>(null);
  const [accelMag, setAccelMag] = useState<number | null>(null);
  const [vibrationDetected, setVibrationDetected] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [gyroAvailable, setGyroAvailable] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isSimulated, setIsSimulated] = useState(false);

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
        // simulated tick (no overlays drawn in UI)
      }, 1000);

      return () => clearInterval(interval);
    };

    if (!isPrivacyMode) {
      initializeCamera();
    } else {
      setIsSimulated(true);
      startSimulatedFeed();
    }

    // Create capture canvas for sending frames to backend (reduced resolution)
    if (!captureRef.current) {
      const off = document.createElement('canvas');
      // smaller to reduce bandwidth
      off.width = 320;
      off.height = 240;
      captureRef.current = off;
    }

    // Device orientation for steering angle (if available)
    const handleOrientation = (ev: DeviceOrientationEvent) => {
      // Use gamma (left-right tilt) as a rough steering proxy
      if (ev.gamma != null) {
        setSteeringAngle(ev.gamma);
        setGyroAvailable(true);
      }
    };

    // Device motion for vibration / pothole detection
    const handleMotion = (ev: DeviceMotionEvent) => {
      try {
        const a = (ev.acceleration || ev.accelerationIncludingGravity) as any;
        if (!a) return;
        const x = a.x || 0;
        const y = a.y || 0;
        const z = a.z || 0;
        const mag = Math.sqrt(x*x + y*y + z*z);
        setAccelMag(mag);
        // crude threshold for bump/vibration
        setVibrationDetected(mag > 12);
        if (ev.rotationRate) setGyroAvailable(true);
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('deviceorientation', handleOrientation as EventListener);
    window.addEventListener('devicemotion', handleMotion as EventListener);

    // detect mobile heuristically
    const mobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent) || ('ontouchstart' in window);
    setIsMobileDevice(mobile);

    // cleanup
    const cleanupOrientation = () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
      window.removeEventListener('devicemotion', handleMotion as EventListener);
    };

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      cleanupOrientation();
    };
  }, [isHydrated, isPrivacyMode, onCameraStatus]);


  // helper to read env from props (defined before sendFrame to avoid TS warnings)
  const propsEnv = () => (typeof env === 'object' && env ? env : {});

  // Periodically capture a frame and send to backend for prediction
  useEffect(() => {
    let interval: number | undefined;
    const sendFrame = async () => {
      if (isSimulated) return; // skip when simulated
      if (!videoRef.current || !captureRef.current) return;

      try {
        const v = videoRef.current;
        const c = captureRef.current as HTMLCanvasElement;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        // draw current frame (centered crop)
        const sx = Math.max(0, (v.videoWidth - v.videoHeight * (c.width / c.height)) / 2);
        const sy = 0;
        try {
          ctx.drawImage(v, sx, sy, v.videoWidth - sx * 2, v.videoHeight - sy * 2, 0, 0, c.width, c.height);
        } catch (e) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
        }

        const dataUrl = c.toDataURL('image/jpeg', 0.6);

        const payload = {
          frame: dataUrl,
          env: propsEnv(),
          sensors: {
            steeringAngle,
            accel: accelMag ? { magnitude: accelMag } : undefined,
            vibration: vibrationDetected,
            isMobile: isMobileDevice,
            gyroAvailable
          }
        };

        const res = await fetch('http://localhost:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) return;
        const json = await res.json();
        const result = json.result;
        const sensors = json.sensors || {};
        if (onPrediction) onPrediction({ ...result, sensors });

      } catch (e) {
        // ignore network errors for now
      }
    };

    // start interval when camera active
    interval = window.setInterval(sendFrame, 800);
    return () => { if (interval) window.clearInterval(interval); };
  }, [isSimulated, steeringAngle, accelMag, vibrationDetected, isMobileDevice, gyroAvailable, env, onPrediction]);


  if (!isHydrated) {
    return (
      <div className="relative w-full h-80 bg-card rounded-lg border border-border flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading camera...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-80 bg-card rounded-lg border border-border overflow-hidden">
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
          </div>
        </div>
      )}
      {/* No overlays, no text — raw camera feed only */}
    </div>
  );
};

export default CameraFeed;