'use client';

 import React, { useState, useEffect, useRef } from 'react';
 import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
 import 'leaflet/dist/leaflet.css';
 import Icon from '@/components/ui/AppIcon';
 import CameraFeed from './CameraFeed';
 import AttentionGauge from './AttentionGauge';
 import EnvironmentControls from './EnvironmentControls';
 import TrendChart from './TrendChart';
 import AlertSystem from './AlertSystem';
 import RiskFactors from './RiskFactors';
 import PrivacyControls from './PrivacyControls';

 type RiskFactor = { id: string; label: string; impact: number; severity: 'low' | 'medium' | 'high'; description: string };

 const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

 export default function DriverMonitorInteractive() {
   const [hydrated, setHydrated] = useState(false);
   const [attention, setAttention] = useState(95);
   const [confidence, setConfidence] = useState(88);
   const [trend, setTrend] = useState<Array<{ timestamp: string; score: number; time: number }>>([]);
   const [speed, setSpeed] = useState(40);
   const [steering, setSteering] = useState(0);
   const [stability, setStability] = useState(100);
   const [micro, setMicro] = useState(false);
   const [privacy, setPrivacy] = useState(false);
     const [audioMode, setAudioMode] = useState<'beep' | 'voice' | 'off'>('voice');
   const [lastPrediction, setLastPrediction] = useState<any>(null);
   const [cameraStatus, setCameraStatus] = useState(false);

   const [env, setEnv] = useState<any>({ nightMode: false, drowsiness: false, potholes: false, highway: false, speed: 40 });

   // Map positions: Mumbai (source) -> Surat (current) -> Ahmedabad (destination)
   const [sourcePos] = useState<{ lat: number; lng: number }>({ lat: 19.0760, lng: 72.8777 }); // Mumbai
   const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>({ lat: 21.1702, lng: 72.8311 }); // Surat
   const [destPos] = useState<{ lat: number; lng: number }>({ lat: 23.0225, lng: 72.5714 }); // Ahmedabad

   const simRef = useRef<any>(null);
   const lastSpeedRef = useRef<number>(speed);
   const lastSteerRef = useRef<number>(steering);
   const lastAlertRef = useRef<number>(0);
   const lastSpeechRef = useRef<number>(0);

   useEffect(() => {
     setHydrated(true);
   }, []);

   // Simulation / fusion-friendly loop: applies immediate penalties based on sudden deltas
   useEffect(() => {
     // clear stale interval first
     if (simRef.current) clearInterval(simRef.current);

     simRef.current = setInterval(() => {
       const fatigue = Math.max(0, (80 - attention) / 80);
       const t = Date.now() / 1000;

       // Determine steering: prefer env control override, then device/backend sensors
       let newSteer = steering;
       let microEvent = micro;

       // First priority: user-controlled steering angle from env controls
       if (env && typeof env.steeringAngle === 'number') {
         newSteer = clamp(env.steeringAngle + (Math.random() - 0.5) * 2, -45, 45);
         microEvent = false;
       } else if (lastPrediction && lastPrediction.sensors && typeof lastPrediction.sensors.steeringAngle === 'number') {
         const deviceSteer = lastPrediction.sensors.steeringAngle as number;
         newSteer = clamp(deviceSteer + (Math.random() - 0.5) * 1.5, -45, 45);
         microEvent = false;
       } else {
         // fallback simulated steering
         const base = Math.sin(t) * 2 + Math.sin(t * 0.35) * 1.5;
         const drift = (Math.random() - 0.5) * fatigue * 18;
         const microChance = 0.02 + fatigue * 0.22 + (speed > 60 ? 0.05 : 0);
         microEvent = Math.random() < microChance;
         const microSpike = microEvent ? (Math.random() - 0.5) * 60 : 0;
         newSteer = clamp(base + drift + microSpike, -45, 45);
       }

       setSteering(newSteer);
       setMicro(microEvent);

       const stabLoss = Math.max(0, Math.abs(newSteer) - 5) * 1.8 + (microEvent ? 18 : 0);
       setStability(Math.max(0, 100 - stabLoss));

       // Compute attention: prefer backend fusion if available
       // immediate influence from speed/steering/lane deviations
       let newScore = attention + (Math.random() - 0.5) * 6;
       
       // Night mode detection: prefer backend auto_env, else use toggle
       let isNightDetected = env.nightMode;
       if (lastPrediction?.auto_env?.night_detected) {
         isNightDetected = true;
       }
       if (isNightDetected) {
         // Night driving reduces visibility and increases fatigue
         const nightPenalty = 8 + (speed > 80 ? 4 : 0); // Higher speed at night = more penalty
         newScore -= nightPenalty;
       }
       
       // Drowsiness detection: prefer backend inference/fusion, else use toggle
       let isDrowsy = env.drowsiness;
       if (lastPrediction?.inference?.drowsiness?.confidence > 0.6) {
         isDrowsy = true;
         const drowsinessLevel = lastPrediction.inference.drowsiness.confidence;
         newScore -= drowsinessLevel * 25; // 0.6 confidence = -15, 1.0 = -25
       } else if (lastPrediction?.fusion?.signal_scores?.drowsiness > 0.5) {
         isDrowsy = true;
         newScore -= lastPrediction.fusion.signal_scores.drowsiness * 20;
       } else if (isDrowsy) {
         // Fallback toggle mode
         newScore -= 15;
       }
       
       // Potholes/vibration: prefer backend auto_env vibration detection
       let hasVibration = env.potholes;
       if (lastPrediction?.auto_env?.vibration_detected) {
         hasVibration = true;
       }
       if (hasVibration) {
         // Road vibration increases physical fatigue over time
         const vibrationPenalty = 6 + (speed > 60 ? 3 : 0);
         newScore -= vibrationPenalty;
       }
       
       // Highway mode: long-distance monotony effect
       if (env.highway && speed > 60) {
         const highwayPenalty = 3 + Math.min(8, (speed - 60) / 10); // Increases with speed
         newScore -= highwayPenalty;
       }
       
       // Glasses detection
       if (env.glasses || lastPrediction?.auto_env?.sunglasses_detected) {
         newScore -= 2;
       }
       
       // Steering influence: greater steering deviations reduce attention
       const steerPenalty = (Math.abs(newSteer) / 45) * 12; // up to -12
       newScore -= steerPenalty;
       
       // Speed influence: higher speed slightly reduces margin
       const currentSpeed = (env && typeof env.speed === 'number') ? env.speed : speed;
       const speedPenalty = (Math.min(currentSpeed, 140) / 140) * 12; // up to -12
       newScore -= speedPenalty;
       
       // Sudden speed change penalty
       const speedDelta = Math.abs(currentSpeed - (lastSpeedRef.current || 0));
       if (speedDelta > 8) {
         newScore -= Math.min(20, speedDelta * 1.8);
       }
       
       // Sudden steering change penalty
       const steerDelta = Math.abs(newSteer - (lastSteerRef.current || 0));
       if (steerDelta > 10) {
         newScore -= Math.min(18, steerDelta * 0.9);
       }
       
       // Lane departure penalty from backend signal if present, or from env control
       let laneScore = lastPrediction?.fusion?.signal_scores?.lane_departure ?? lastPrediction?.fusion?.signal_scores?.lane ?? 0;
       // Override with env laneDeviation if present
       if (env && typeof env.laneDeviation === 'number') {
         laneScore = Math.abs(env.laneDeviation) / 2; // normalize -2 to 2 -> 0 to 1
       }
       if (typeof laneScore === 'number' && laneScore > 0.05) {
         newScore -= Math.min(25, laneScore * 100 * 0.18);
       }
       if (microEvent) newScore -= 5;

       if (lastPrediction && lastPrediction.fusion && typeof lastPrediction.fusion.alertness_score === 'number') {
         const backendScore = clamp(lastPrediction.fusion.alertness_score, 0, 100);
         newScore = backendScore * 0.92 + newScore * 0.08;
       }

       const clamped = clamp(newScore, 0, 100);
       setAttention(clamped);

       // Audio alert logic
       try {
         const now = Date.now();
         
         // Beep sound logic
         if (audioMode === 'beep' && clamped < 75 && now - lastAlertRef.current > 6000) {
           const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
           const o = ctx.createOscillator();
           const g = ctx.createGain();
           o.type = 'sine';
           o.frequency.value = clamped < 40 ? 1200 : 880; // Higher pitch for critical
           g.gain.value = 0.003;
           o.connect(g);
           g.connect(ctx.destination);
           o.start();
           setTimeout(() => { o.stop(); ctx.close(); }, clamped < 40 ? 400 : 250);
           lastAlertRef.current = now;
         }

         // Spoken alert logic (only if voice is selected)
         if (audioMode === 'voice' && clamped < 70 && now - lastSpeechRef.current > 12000 && 'speechSynthesis' in window) {
           const message = clamped < 40 ? 'Critical attention level. Pull over safely.' : 'Attention reduced. Stay focused.';
           const utter = new SpeechSynthesisUtterance(message);
           utter.lang = 'en-IN';
           utter.rate = 1.0;
           utter.volume = 0.9;
           window.speechSynthesis.cancel();
           window.speechSynthesis.speak(utter);
           lastSpeechRef.current = now;
         }
       } catch (e) {
         // ignore audio/speech failures
       }

       // Confidence and speed noise
       setConfidence(c => clamp(c + (Math.random() - 0.5) * 3, 50, 100));
       
       // Update speed: use env.speed if available, otherwise add small noise
       if (currentSpeed !== speed) {
         setSpeed(currentSpeed);
       } else {
         setSpeed(s => clamp(s + (Math.random() - 0.5) * 1, 0, 140));
       }

       lastSpeedRef.current = currentSpeed;
       lastSteerRef.current = newSteer;

       // Trend logging
       setTrend(prev => [
         ...prev.slice(-25),
         { timestamp: new Date().toISOString(), score: clamped, time: Math.floor((Date.now() % 60000) / 1000) }
       ]);
     }, 700);

     return () => {
       if (simRef.current) clearInterval(simRef.current);
     };
   }, [hydrated, lastPrediction, attention, env, speed, steering, micro, audioMode]);

   // Customize map markers with React icons after they render
   useEffect(() => {
     if (!hydrated) return;
     
     const timer = setTimeout(() => {
       const markers = document.querySelectorAll('.leaflet-marker-icon');
       markers.forEach((marker, index) => {
         if (marker.innerHTML.includes('svg')) return; // Already customized
         
         const iconHTML = index === 0 ? 
           `<div class="custom-marker-pin marker-pin-source"><svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg></div>` :
           index === 1 ?
           `<div class="custom-marker-pin marker-pin-current"><svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px;height:24px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg></div>` :
           `<div class="custom-marker-pin marker-pin-dest"><svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg></div>`;
         
         marker.innerHTML = iconHTML;
       });
     }, 500);
     
     return () => clearTimeout(timer);
   }, [hydrated]);

   const riskFactors: RiskFactor[] = React.useMemo(() => {
     try {
       if (lastPrediction && lastPrediction.fusion && lastPrediction.fusion.signal_scores) {
         const s = lastPrediction.fusion.signal_scores as Record<string, number>;
         const toPct = (v: number | undefined) => Math.round(clamp((v ?? 0) * 100, 0, 100));
         return [
           { id: 'drowsiness', label: 'Drowsiness', impact: toPct(s.drowsiness || s.sleepiness), severity: (toPct(s.drowsiness || s.sleepiness) > 60 ? 'high' : (toPct(s.drowsiness || s.sleepiness) > 30 ? 'medium' : 'low')), description: 'Eyes/pose indicate sleepiness' },
           { id: 'distraction', label: 'Distraction', impact: toPct(s.distraction), severity: (toPct(s.distraction) > 60 ? 'high' : (toPct(s.distraction) > 30 ? 'medium' : 'low')), description: 'Head/gaze away from road' },
           { id: 'lane', label: 'Lane Deviation', impact: toPct(s.lane_departure || s.lane), severity: (toPct(s.lane_departure || s.lane) > 50 ? 'high' : 'medium'), description: 'Vehicle drifting detected' },
           { id: 'fatigue', label: 'Fatigue', impact: toPct(s.fatigue), severity: (toPct(s.fatigue) > 60 ? 'high' : 'medium'), description: 'Long-term reduced alertness trend' }
         ];
       }
     } catch (e) {
       // fall back
     }

     // Dynamic simulated factors based on current state
     const factors: RiskFactor[] = [];
     
     // Attention Level (inverse - lower attention = higher risk)
     const attentionImpact = Math.max(0, 100 - attention);
     factors.push({ 
       id: 'attention', 
       label: 'Attention Level', 
       impact: Math.round(attentionImpact), 
       severity: (attentionImpact > 60 ? 'high' : (attentionImpact > 30 ? 'medium' : 'low')), 
       description: attention < 40 ? 'Critical - Immediate rest needed' : attention < 70 ? 'Reduced alertness detected' : 'Maintaining focus'
     });
     
     // Steering deviation
     const steerImpact = Math.abs(steering) > 20 ? Math.min(85, Math.abs(steering) * 1.8) : Math.round(Math.abs(steering) * 1.2);
     if (steerImpact > 10 || micro) {
       factors.push({ 
         id: 'steer', 
         label: 'Steering Control', 
         impact: Math.round(steerImpact), 
         severity: steerImpact > 50 ? 'high' : (steerImpact > 25 ? 'medium' : 'low'), 
         description: micro ? '⚠ Microsleep correction detected' : `${Math.abs(steering).toFixed(1)}° deviation from center`
       });
     }
     
     // Lane position - ALWAYS show if deviation exists (even small)
     const laneDevVal = env?.laneDeviation ?? 0;
     const laneImpact = Math.min(95, Math.abs(laneDevVal) * 45);
     if (Math.abs(laneDevVal) > 0) {  // Show any non-zero deviation
       factors.push({ 
         id: 'lane', 
         label: 'Lane Position', 
         impact: Math.max(1, Math.round(laneImpact)), // Minimum 1% to show it's active
         severity: laneImpact > 60 ? 'high' : (laneImpact > 30 ? 'medium' : 'low'), 
         description: `${Math.abs(laneDevVal).toFixed(2)}m from lane center`
       });
     }
     
     // Speed factor
     const speedImpact = speed > 100 ? Math.min(75, (speed - 60) * 0.9) : Math.max(5, speed * 0.2);
     if (speed > 80) {
       factors.push({ 
         id: 'speed', 
         label: 'High Speed', 
         impact: Math.round(speedImpact), 
         severity: speedImpact > 55 ? 'high' : (speedImpact > 30 ? 'medium' : 'low'), 
         description: `${Math.round(speed)} km/h - Increased reaction time needed`
       });
     }
     
     // Drowsiness from backend inference (HIGHEST PRIORITY - show from camera feed)
     const backendDrowsinessConf = lastPrediction?.inference?.drowsiness?.confidence || 0;
     if (backendDrowsinessConf > 0.5) {
       const drowsyImpact = Math.round(backendDrowsinessConf * 100);
       factors.push({ 
         id: 'backend_drowsy', 
         label: 'Drowsiness (Camera)', 
         impact: drowsyImpact, 
         severity: drowsyImpact > 75 ? 'high' : (drowsyImpact > 60 ? 'medium' : 'low'), 
         description: `Detected from video: ${(backendDrowsinessConf * 100).toFixed(0)}% confidence`
       });
     }
     
     // Distraction based on multiple factors (eye movement, lane deviation, steering erratic behavior)
     let distractionImpact = 0;
     const backendDistractionConf = lastPrediction?.inference?.distraction?.confidence || 0;
     
     if (backendDistractionConf > 0.5) {
       // Use backend distraction detection from camera
       distractionImpact = Math.round(backendDistractionConf * 100);
     } else {
       // Calculate distraction from behavior patterns
       let distractionScore = 0;
       
       // Erratic steering (sudden changes)
       if (Math.abs(steering) > 15 && Math.abs(steering - (lastSteerRef.current || 0)) > 5) {
         distractionScore += 30;
       }
       
       // Lane wandering
       if (Math.abs(laneDevVal) > 0.5) {
         distractionScore += Math.min(40, Math.abs(laneDevVal) * 25);
       }
       
       // Low attention correlation
       if (attention < 70) {
         distractionScore += (70 - attention) * 0.5;
       }
       
       distractionImpact = Math.min(95, distractionScore);
     }
     
     if (distractionImpact > 40) {
       factors.push({ 
         id: 'distraction', 
         label: 'Distraction', 
         impact: Math.round(distractionImpact), 
         severity: distractionImpact > 70 ? 'high' : (distractionImpact > 50 ? 'medium' : 'low'), 
         description: backendDistractionConf > 0.5 ? 
           `Head/gaze off road: ${(backendDistractionConf * 100).toFixed(0)}%` : 
           'Erratic driving behavior detected'
       });
     }
     
     // Fatigue from video analysis AND toggle
     const backendFatigueConf = lastPrediction?.fusion?.signal_scores?.fatigue || 0;
     if (backendFatigueConf > 0.4 || env?.drowsiness) {
       const fatigueImpact = env?.drowsiness ? 
         Math.max(75, Math.round(backendFatigueConf * 100)) : 
         Math.round(backendFatigueConf * 100);
       
       factors.push({ 
         id: 'fatigue', 
         label: env?.drowsiness ? 'Fatigue Simulation' : 'Fatigue', 
         impact: fatigueImpact, 
         severity: fatigueImpact > 70 ? 'high' : (fatigueImpact > 50 ? 'medium' : 'low'), 
         description: env?.drowsiness ? 
           'Simulated drowsiness active' : 
           `Long-term alertness decline: ${(backendFatigueConf * 100).toFixed(0)}%`
       });
     }
     
     // Environment factors
     if (env?.nightMode) {
       factors.push({ 
         id: 'night', 
         label: 'Night Driving', 
         impact: 45, 
         severity: 'medium', 
         description: 'Reduced visibility conditions'
       });
     }
     
     if (env?.potholes) {
       factors.push({ 
         id: 'vibration', 
         label: 'Road Vibration', 
         impact: 40, 
         severity: 'medium', 
         description: 'Rough road increases fatigue'
       });
     }
     
     if (env?.highway && speed > 80) {
       factors.push({ 
         id: 'highway', 
         label: 'Highway Monotony', 
         impact: 35, 
         severity: 'medium', 
         description: 'Long-distance highway fatigue'
       });
     }

     // Sort by impact (highest first) and return top 4
     return factors.sort((a, b) => b.impact - a.impact).slice(0, 4);
   }, [
     lastPrediction, 
     steering, 
     micro, 
     speed, 
     attention, 
     env?.laneDeviation, 
     env?.drowsiness, 
     env?.nightMode, 
     env?.potholes, 
     env?.highway,
     env?.glasses,
     env?.speed,
     env?.steeringAngle
   ]);

   if (!hydrated) return <div className="text-white p-10">Initializing driver system...</div>;

   return (
     <div className="min-h-screen bg-[#0b1320] pt-16">
       <div className="container mx-auto px-6 py-6">
         <h1 className="text-3xl text-white font-semibold mb-2">Driver Attention Monitor</h1>
         <p className="text-gray-400 text-sm mb-6">Real-time fatigue & microsleep monitoring</p>

         {/* Camera + Attention Row */}
         <div className="grid md:grid-cols-2 gap-6 mb-6">
           <CameraFeed isPrivacyMode={privacy} onCameraStatus={setCameraStatus} env={env} onPrediction={setLastPrediction} autoEnv={lastPrediction?.auto_env ?? null} />
           <AttentionGauge score={attention} confidence={confidence} />
         </div>

         {/* 3x3 Grid Layout Below Camera */}
         <div className="grid md:grid-cols-3 gap-6 mb-6">
           
           {/* R1C1: Steering & Lane Position */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
             <p className="text-gray-400 text-sm mb-3 font-semibold">Steering & Lane Position</p>
             <div className="relative h-40 bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden mb-3 border border-gray-700">
               {/* Road lane markers */}
               <div className="absolute inset-y-0 left-1/2 w-[2px] bg-yellow-400/50 -translate-x-1/2">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-yellow-400 -mt-4">CENTER</div>
               </div>
               <div className="absolute inset-y-0 left-[25%] w-[1px] bg-yellow-500/40" />
               <div className="absolute inset-y-0 left-[75%] w-[1px] bg-yellow-500/40" />
               
               {/* Lane deviation indicator */}
               {env?.laneDeviation && Math.abs(env.laneDeviation) > 0.3 && (
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-[10px] px-2 py-1 rounded animate-pulse whitespace-nowrap z-10">
                   LANE DRIFT
                 </div>
               )}
               
               {/* Vehicle position - moves with steering and lane deviation */}
               <div 
                 className="absolute bottom-3 left-1/2 transition-all duration-300"
                 style={{ 
                   transform: `translateX(calc(-50% + ${steering * 1.2 + (env?.laneDeviation || 0) * 20}px))` 
                 }}
               >
                 <div className={`flex items-center justify-center p-2 rounded-lg shadow-xl ${micro ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
                   {/* Car icon using React Icon */}
                   <Icon name="TruckIcon" size={32} className="text-white" />
                 </div>
               </div>
             </div>
             <div className="text-xs text-gray-300 space-y-1">
               <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                 <span className="text-gray-500">Steering Angle:</span> 
                 <span className={`font-bold ${Math.abs(steering) > 25 ? 'text-red-400' : Math.abs(steering) > 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                   {steering > 0 ? '→ ' : steering < 0 ? '← ' : '↑ '}{Math.abs(steering).toFixed(1)}°
                 </span>
               </div>
               <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                 <span className="text-gray-500">Lane Position:</span> 
                 <span className={`font-bold ${Math.abs(env?.laneDeviation || 0) > 1 ? 'text-red-400' : Math.abs(env?.laneDeviation || 0) > 0.5 ? 'text-yellow-400' : 'text-green-400'}`}>
                   {(env?.laneDeviation || 0) > 0.05 ? 'Right ' : (env?.laneDeviation || 0) < -0.05 ? 'Left ' : 'Center '}{Math.abs(env?.laneDeviation || 0).toFixed(1)}m
                 </span>
               </div>
               <div className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                 <span className="text-gray-500">Control Stability:</span> 
                 <span className={`font-bold ${stability < 60 ? 'text-red-400' : stability < 80 ? 'text-yellow-400' : 'text-green-400'}`}>
                   {Math.round(stability)}%
                 </span>
               </div>
               <div className={`text-center p-2 rounded font-semibold text-xs ${micro ? 'bg-red-900/50 text-red-300 animate-pulse' : 'bg-green-900/30 text-green-400'}`}>
                 {micro ? '⚠ MICROSLEEP DETECTED' : '✓ Normal Operation'}
               </div>
             </div>
           </div>

           {/* R1C2: Attention Trend */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4 relative">
             <p className="text-gray-400 text-sm font-semibold absolute top-4 left-4 z-10">Attention Trend</p>
             <div className="absolute inset-0 pt-12">
                <TrendChart data={trend} />
             </div>
           </div>

           {/* R1C3 + R2C3: Environment Controls (row-span-2) */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4 row-span-2">
             <p className="text-gray-400 text-sm mb-3">Environment Simulation</p>
             <EnvironmentControls onSettingsChange={setEnv} />
           </div>

           {/* R2C1: Alert System */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
             <div className="flex items-center space-x-2 mb-3">
               <Icon name="BellIcon" size={18} className="text-secondary" />
               <p className="text-gray-400 text-sm font-semibold">Alert System</p>
             </div>
             <AlertSystem 
               currentScore={attention} 
               speed={speed} 
               inference={lastPrediction?.inference} 
               fusion={lastPrediction?.fusion}
               audioMode={audioMode}
               onAudioModeChange={setAudioMode}
             />
           </div>

           {/* R2C2: Risk Factors */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
             <div className="flex items-center space-x-2 mb-3">
               <Icon name="ChartBarIcon" size={18} className="text-secondary" />
               <p className="text-gray-400 text-sm font-semibold">Key Risk Factors</p>
             </div>
             <RiskFactors factors={riskFactors} />
           </div>

           {/* Environment Controls spans R1C3 + R2C3 (already defined above) */}
         </div>

         {/* Row 3: Map (col-span-2) + Privacy */}
         <div className="grid md:grid-cols-3 gap-6 mb-6">
           {/* R3C1 + R3C2: Map */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4 md:col-span-2">
             <p className="text-gray-400 text-sm mb-3">Route & Location</p>
             <div style={{ height: 280, position: 'relative' }}>
               <style jsx global>{`
                 .leaflet-marker-icon {
                   background: transparent !important;
                   border: none !important;
                   width: 40px !important;
                   height: 40px !important;
                 }
                 .leaflet-marker-shadow {
                   display: none !important;
                 }
                 .custom-marker-pin {
                   width: 40px;
                   height: 40px;
                   display: flex;
                   align-items: center;
                   justify-content: center;
                   border-radius: 50% 50% 50% 0;
                   transform: rotate(-45deg);
                   border: 3px solid white;
                   box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                 }
                 .custom-marker-pin svg {
                   transform: rotate(45deg);
                 }
                 .marker-pin-source {
                   background: linear-gradient(135deg, #10b981, #059669);
                 }
                 .marker-pin-current {
                   background: linear-gradient(135deg, #3b82f6, #2563eb);
                   width: 48px;
                   height: 48px;
                   animation: marker-pulse 2s infinite;
                 }
                 .marker-pin-dest {
                   background: linear-gradient(135deg, #ef4444, #dc2626);
                 }
                 @keyframes marker-pulse {
                   0%, 100% { transform: rotate(-45deg) scale(1); }
                   50% { transform: rotate(-45deg) scale(1.1); }
                 }
               `}</style>
               <MapContainer 
                 {...({ center: [21.5, 72.8] } as any)} 
                 zoom={7} 
                 style={{ height: '100%', width: '100%' }}
               >
                 <TileLayer 
                   url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 />
                 
                 {/* Source: Mumbai (green) - Using custom marker HTML */}
                 <Marker position={[sourcePos.lat, sourcePos.lng] as any}>
                   <Popup>
                     <div className="text-sm flex items-center gap-2">
                       <Icon name="FlagIcon" size={20} className="text-green-600" />
                       <div>
                         <strong className="text-green-600">Source</strong><br/>
                         <strong>Mumbai</strong>, Maharashtra<br/>
                         Start point
                       </div>
                     </div>
                   </Popup>
                 </Marker>
                 
                 {/* Current Location: Surat (blue, pulsing) */}
                 <Marker position={[currentPos?.lat || 21.1702, currentPos?.lng || 72.8311] as any}>
                   <Popup>
                     <div className="text-sm flex items-center gap-2">
                       <Icon name="MapPinIcon" size={20} className="text-blue-600" />
                       <div>
                         <strong className="text-blue-600">Current Location</strong><br/>
                         <strong>Surat</strong>, Gujarat<br/>
                         Speed: {Math.round(speed)} km/h
                       </div>
                     </div>
                   </Popup>
                 </Marker>
                 
                 {/* Destination: Ahmedabad (red) */}
                 <Marker position={[destPos.lat, destPos.lng] as any}>
                   <Popup>
                     <div className="text-sm flex items-center gap-2">
                       <Icon name="MapPinIcon" size={20} className="text-red-600" />
                       <div>
                         <strong className="text-red-600">Destination</strong><br/>
                         <strong>Ahmedabad</strong>, Gujarat<br/>
                         ~265 km from Mumbai
                       </div>
                     </div>
                   </Popup>
                 </Marker>
                 
                 {/* Route polyline connecting all three cities */}
                 <Polyline 
                   positions={[
                     [sourcePos.lat, sourcePos.lng],
                     [currentPos?.lat || 21.1702, currentPos?.lng || 72.8311],
                     [destPos.lat, destPos.lng]
                   ] as any} 
                   pathOptions={{ color: '#38bdf8', weight: 3, opacity: 0.6, dashArray: '8, 4' } as any} 
                 />
               </MapContainer>
             </div>             <div className="mt-3 text-sm text-gray-300 grid grid-cols-3 gap-2">
               <div><span className="text-gray-500">Driver:</span> Demo Driver</div>
               <div><span className="text-gray-500">Vehicle:</span> Demo-001</div>
               <div><span className="text-gray-500">Speed:</span> {Math.round(speed)} km/h</div>
             </div>
           </div>

           {/* R3C3: Privacy Controls */}
           <div className="bg-[#0f192e] border border-gray-700 rounded-xl p-4">
             <p className="text-gray-400 text-sm mb-3">Privacy Controls</p>
             <PrivacyControls isPrivacyMode={privacy} onPrivacyModeChange={setPrivacy} />
           </div>
         </div>

         <div className="text-xs text-gray-500 border-t border-gray-800 pt-2 flex justify-between">
           <span>Vision: {cameraStatus ? 'Active' : 'Simulated'} • Speed {Math.round(speed)} km/h</span>
           <span>{new Date().toLocaleTimeString()}</span>
         </div>

         <div className="mt-3 text-xs text-gray-400">
           <details>
             <summary className="cursor-pointer">Debug: lastPrediction (expand)</summary>
             <pre className="mt-2 text-xs text-left p-2 max-h-60 overflow-auto bg-black/40 rounded">
               {lastPrediction ? JSON.stringify(lastPrediction, (_k, v) => (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' ? v : (v && v.toString ? v : v)), 2) : 'No prediction yet'}
             </pre>
           </details>
         </div>

       </div>
     </div>
   );
 }
