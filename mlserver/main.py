"""
Main AI Pipeline Orchestrator
Integrates all preprocessing and inference modules for real-time driver wellness monitoring
"""

import cv2
import numpy as np
import sys
import os
from typing import Dict, Optional
import time

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import preprocessing modules
from preprocessing.face_eye_detector import FaceEyeDetector
from preprocessing.pose_estimator import PoseEstimator
from preprocessing.audio_extractor import AudioFeatureExtractor

# Import AI inference modules
from models.drowsiness_model import DrowsinessDetector
from models.distraction_model import DistractionDetector
from models.voice_cues_model import VoiceCuesDetector

# Import fusion module
from fusion.signal_fusion import SignalFusion


class DriverWellnessAI:
    """
    Complete AI Pipeline for Driver Wellness Monitoring
    
    Pipeline Flow:
    1. Preprocessing Layer:
       - Face & Eye Detection
       - Pose Estimation
       - Audio Feature Extraction
    
    2. AI Inference Layer:
       - Drowsiness Detection
       - Distraction Detection
       - Voice Cues Detection
    
    3. Fusion Layer:
       - Signal Fusion → Driver Alertness Score
    """
    
    def __init__(self,
                 use_webcam: bool = True,
                 use_audio: bool = False,
                 use_deep_models: bool = False,
                 device: str = 'cpu'):
        """
        Initialize the complete AI pipeline
        
        Args:
            use_webcam: Enable webcam for visual monitoring
            use_audio: Enable audio for voice cue detection
            use_deep_models: Use deep learning models (requires GPU/training)
            device: Device for inference ('cpu' or 'cuda')
        """
        self.use_webcam = use_webcam
        self.use_audio = use_audio
        self.use_deep_models = use_deep_models
        self.device = device
        
        print("🚀 Initializing Driver Wellness AI Pipeline...")
        
        # ===== Preprocessing Layer =====
        print("  📸 Loading preprocessing modules...")
        self.face_eye_detector = FaceEyeDetector()
        self.pose_estimator = PoseEstimator()
        
        if use_audio:
            self.audio_extractor = AudioFeatureExtractor()
        else:
            self.audio_extractor = None
        
        # ===== AI Inference Layer =====
        print("  🧠 Loading AI inference models...")
        self.drowsiness_detector = DrowsinessDetector(device=device)
        self.distraction_detector = DistractionDetector(
            model_type='cnn' if use_deep_models else 'cnn',
            device=device
        )
        
        if use_audio:
            self.voice_detector = VoiceCuesDetector(
                model_type='lstm' if use_deep_models else 'lstm',
                device=device
            )
        else:
            self.voice_detector = None
        
        # ===== Fusion Layer =====
        print("  🔗 Loading signal fusion module...")
        self.signal_fusion = SignalFusion(
            drowsiness_weight=0.5,
            distraction_weight=0.3,
            voice_weight=0.2
        )
        
        # Webcam
        if use_webcam:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                print("  ⚠️ Warning: Could not open webcam")
                self.use_webcam = False
        
        # Performance tracking
        self.fps = 0
        self.frame_count = 0
        self.start_time = time.time()
        
        print("✅ AI Pipeline initialized successfully!\n")
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a single frame through the complete AI pipeline
        
        Args:
            frame: Input frame from webcam
        
        Returns:
            Dictionary with all processing results
        """
        results = {
            'preprocessing': {},
            'inference': {},
            'fusion': {}
        }
        
        # ===== PREPROCESSING LAYER =====
        
        # 1. Face & Eye Detection
        face_result = self.face_eye_detector.process_frame(frame)
        results['preprocessing']['face_eye'] = face_result
        
        # 2. Pose Estimation
        pose_result = self.pose_estimator.process_frame(frame)
        results['preprocessing']['pose'] = pose_result
        
        # ===== AI INFERENCE LAYER =====
        
        # 1. Drowsiness Detection
        drowsiness_result = None
        if face_result['face_detected'] and 'left_eye' in face_result.get('features', {}):
            # Using feature-based approach (more reliable without training)
            features = face_result['features']
            drowsiness_result = self.drowsiness_detector.predict_from_features(
                ear=features.get('avg_ear', 0.3),
                mar=features.get('mar', 0.3),
                blink_rate=12  # Default blink rate
            )
        else:
            # Default safe values
            drowsiness_result = {
                'drowsiness_score': 0.0,
                'is_drowsy': False,
                'confidence': 0.0
            }
        
        results['inference']['drowsiness'] = drowsiness_result
        
        # 2. Distraction Detection
        distraction_result = None
        if pose_result['face_detected'] and pose_result['head_pose']:
            # Using pose-based approach (rule-based, no training needed)
            head_pose = pose_result['head_pose']
            distraction_result = self.distraction_detector.predict_from_pose(
                yaw=head_pose.yaw,
                pitch=head_pose.pitch,
                roll=head_pose.roll
            )
        else:
            # Default safe values
            distraction_result = {
                'distraction_score': 0.0,
                'is_distracted': False,
                'confidence': 0.0,
                'class_name': 'Forward'
            }
        
        results['inference']['distraction'] = distraction_result
        
        # 3. Voice Cues Detection (if audio enabled)
        voice_result = None
        if self.use_audio and self.audio_extractor and self.voice_detector:
            audio_data = self.audio_extractor.get_latest_audio()
            if audio_data is not None:
                audio_features = self.audio_extractor.process_audio(audio_data)
                voice_result = self.voice_detector.predict_from_audio_features(
                    yawn_confidence=audio_features['yawn_confidence'],
                    pause_duration=audio_features['pause_duration'],
                    energy_level=audio_features['spectral_features']['rms_mean'],
                    spectral_centroid=audio_features['spectral_features']['spectral_centroid_mean']
                )
        else:
            # Default safe values
            voice_result = {
                'voice_fatigue_score': 0.0,
                'is_yawning': False,
                'is_fatigued': False
            }
        
        results['inference']['voice'] = voice_result
        
        # ===== FUSION LAYER =====
        fusion_result = self.signal_fusion.process_signals(
            drowsiness_result=drowsiness_result,
            distraction_result=distraction_result,
            voice_result=voice_result
        )
        
        results['fusion'] = fusion_result
        
        return results
    
    def visualize_results(self, frame: np.ndarray, results: Dict) -> np.ndarray:
        """
        Visualize all results on frame
        
        Args:
            frame: Input frame
            results: Processing results
        
        Returns:
            Annotated frame
        """
        vis_frame = frame.copy()
        h, w = vis_frame.shape[:2]
        
        # Draw preprocessing visualizations
        face_result = results['preprocessing']['face_eye']
        vis_frame = self.face_eye_detector.visualize(vis_frame, face_result)
        
        # Draw main alertness panel
        panel_width = 350
        panel_height = 250
        panel_x = w - panel_width - 10
        panel_y = 10
        
        # Semi-transparent background
        overlay = vis_frame.copy()
        cv2.rectangle(overlay, (panel_x, panel_y), 
                     (panel_x + panel_width, panel_y + panel_height),
                     (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, vis_frame, 0.3, 0, vis_frame)
        
        # Fusion results
        fusion = results['fusion']
        alertness = fusion['alertness_score']
        alert_level = fusion['alert_level']
        
        # Determine color based on alert level
        colors = {
            'normal': (0, 255, 0),
            'mild': (0, 255, 255),
            'moderate': (0, 165, 255),
            'severe': (0, 0, 255)
        }
        color = colors.get(alert_level, (255, 255, 255))
        
        # Title
        y_offset = panel_y + 30
        # FONT_HERSHEY_BOLD is not available in some OpenCV builds; use SIMPLEX and increase thickness
        cv2.putText(vis_frame, "DRIVER ALERTNESS", (panel_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        # Alertness score
        y_offset += 40
        # Use SIMPLEX font (portable) and make text bold via thickness
        cv2.putText(vis_frame, f"{alertness:.1f}/100", (panel_x + 10, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.5, color, 3)
        
        # Alert level
        y_offset += 35
        cv2.putText(vis_frame, f"Status: {alert_level.upper()}", (panel_x + 10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Individual scores
        y_offset += 30
        cv2.putText(vis_frame, "Signal Scores:", (panel_x + 10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        
        signals = fusion['signal_scores']
        y_offset += 25
        cv2.putText(vis_frame, f"Drowsiness: {signals['drowsiness']:.2f}", 
                   (panel_x + 10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        y_offset += 20
        cv2.putText(vis_frame, f"Distraction: {signals['distraction']:.2f}", 
                   (panel_x + 10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        y_offset += 20
        cv2.putText(vis_frame, f"Voice Fatigue: {signals['voice_fatigue']:.2f}", 
                   (panel_x + 10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Distraction direction
        if results['inference']['distraction']:
            dist_class = results['inference']['distraction'].get('class_name', 'Unknown')
            y_offset += 25
            cv2.putText(vis_frame, f"Looking: {dist_class}", 
                       (panel_x + 10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 255), 1)
        
        # FPS counter
        cv2.putText(vis_frame, f"FPS: {self.fps:.1f}", (10, h - 20),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return vis_frame
    
    def run(self, display: bool = True, save_video: bool = False):
        """
        Run the complete AI pipeline in real-time
        
        Args:
            display: Display visualization window
            save_video: Save output video to file
        """
        print("🎬 Starting Driver Wellness AI Pipeline")
        print("Press 'q' to quit, 's' for statistics\n")
        
        # Video writer
        video_writer = None
        if save_video and self.use_webcam:
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            video_writer = cv2.VideoWriter('output.mp4', fourcc, 20.0, (640, 480))
        
        # Start audio recording if enabled
        if self.use_audio and self.audio_extractor:
            self.audio_extractor.start_recording()
        
        try:
            while True:
                if self.use_webcam:
                    ret, frame = self.cap.read()
                    if not ret:
                        print("Failed to read frame")
                        break
                else:
                    # Use dummy frame for testing
                    frame = np.zeros((480, 640, 3), dtype=np.uint8)
                
                # Process frame through pipeline
                start = time.time()
                results = self.process_frame(frame)
                processing_time = time.time() - start
                
                # Update FPS
                self.frame_count += 1
                elapsed = time.time() - self.start_time
                self.fps = self.frame_count / elapsed if elapsed > 0 else 0
                
                # Visualize
                if display:
                    vis_frame = self.visualize_results(frame, results)
                    cv2.imshow('Driver Wellness AI', vis_frame)
                    
                    if video_writer:
                        video_writer.write(vis_frame)
                
                # Console output
                fusion = results['fusion']
                print(f"\r[Alertness: {fusion['alertness_score']:.1f}/100 | "
                      f"Level: {fusion['alert_level']} | "
                      f"FPS: {self.fps:.1f} | "
                      f"Processing: {processing_time*1000:.1f}ms]", end='')
                
                # Handle key presses
                if display:
                    key = cv2.waitKey(1) & 0xFF
                    if key == ord('q'):
                        break
                    elif key == ord('s'):
                        self._print_statistics()
                
        except KeyboardInterrupt:
            print("\n\n⏸️ Interrupted by user")
        
        finally:
            print("\n\n📊 Final Statistics:")
            self._print_statistics()
            
            # Cleanup
            if self.use_webcam and self.cap:
                self.cap.release()
            if video_writer:
                video_writer.release()
            if self.use_audio and self.audio_extractor:
                self.audio_extractor.stop_recording()
            cv2.destroyAllWindows()
            
            print("\n✅ Pipeline stopped successfully")
    
    def _print_statistics(self):
        """Print session statistics"""
        stats = self.signal_fusion.get_statistics()
        print("\n\n" + "="*50)
        print("DRIVER WELLNESS STATISTICS")
        print("="*50)
        print(f"  Mean Alertness: {stats['mean_alertness']:.1f}/100")
        print(f"  Min Alertness:  {stats['min_alertness']:.1f}/100")
        print(f"  Max Alertness:  {stats['max_alertness']:.1f}/100")
        print(f"  Std Deviation:  {stats['std_alertness']:.2f}")
        print(f"\n  Time Distribution:")
        print(f"    Normal:   {stats['time_in_alert']:.1f}%")
        print(f"    Mild:     {stats['time_in_mild']:.1f}%")
        print(f"    Moderate: {stats['time_in_moderate']:.1f}%")
        print(f"    Severe:   {stats['time_in_severe']:.1f}%")
        print(f"\n  Total Samples: {stats['total_samples']}")
        print(f"  Avg FPS: {self.fps:.1f}")
        print("="*50 + "\n")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Driver Wellness AI Pipeline')
    parser.add_argument('--no-webcam', action='store_true', help='Disable webcam')
    parser.add_argument('--audio', action='store_true', help='Enable audio monitoring')
    parser.add_argument('--deep-models', action='store_true', help='Use deep learning models')
    parser.add_argument('--device', default='cpu', choices=['cpu', 'cuda'], help='Device for inference')
    parser.add_argument('--no-display', action='store_true', help='Disable display window')
    parser.add_argument('--save-video', action='store_true', help='Save output video')
    
    args = parser.parse_args()
    
    # Create pipeline
    pipeline = DriverWellnessAI(
        use_webcam=not args.no_webcam,
        use_audio=args.audio,
        use_deep_models=args.deep_models,
        device=args.device
    )
    
    # Run pipeline
    pipeline.run(
        display=not args.no_display,
        save_video=args.save_video
    )


if __name__ == "__main__":
    main()
