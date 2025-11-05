"""
Configuration file for AI Driver Wellness Assistant
Adjust these parameters to customize the pipeline behavior
"""

# ===== PREPROCESSING CONFIGURATION =====

# Face & Eye Detection
FACE_DETECTION_CONFIG = {
    'scale_factor': 1.1,          # Scale factor for face detection
    'min_neighbors': 5,           # Minimum neighbors for face detection
    'min_face_size': (30, 30),    # Minimum face size in pixels
    'ear_threshold': 0.25,        # Eye Aspect Ratio threshold for drowsiness
    'ear_consec_frames': 3,       # Consecutive frames below threshold to trigger
    'mar_threshold': 0.6,         # Mouth Aspect Ratio threshold for yawning
    'use_dlib': True,             # Use dlib for better accuracy (if available)
}

# Pose Estimation
POSE_ESTIMATION_CONFIG = {
    'yaw_threshold': 25,          # Degrees for left/right distraction
    'pitch_threshold': 20,        # Degrees for up/down distraction
    'distraction_frames': 3,      # Frames to confirm distraction
    'min_detection_confidence': 0.5,
    'min_tracking_confidence': 0.5,
}

# Audio Feature Extraction
AUDIO_CONFIG = {
    'sample_rate': 16000,         # Audio sample rate (Hz)
    'frame_duration': 0.5,        # Frame duration (seconds)
    'n_mfcc': 13,                 # Number of MFCC coefficients
    'yawn_freq_range': (200, 1000),  # Yawn frequency range (Hz)
    'yawn_duration_threshold': 1.0,   # Minimum yawn duration (seconds)
    'yawn_energy_threshold': 0.02,    # Energy threshold for yawn
    'silence_threshold': 0.01,        # Threshold for silence detection
    'pause_duration_threshold': 2.0,  # Long pause threshold (seconds)
}

# ===== AI INFERENCE CONFIGURATION =====

# Drowsiness Detection
DROWSINESS_CONFIG = {
    'model_type': 'cnn_lstm',     # 'cnn_lstm' or 'rule_based'
    'input_size': (64, 64),       # Eye region input size
    'sequence_length': 30,        # Frames in sequence
    'drowsy_threshold': 0.6,      # Threshold for drowsiness classification
    'use_deep_model': False,      # Use trained deep model or rule-based
    'model_path': None,           # Path to trained model (if available)
}

# Distraction Detection
DISTRACTION_CONFIG = {
    'model_type': 'cnn',          # 'cnn', 'transformer', or 'rule_based'
    'input_size': (224, 224),     # Input frame size
    'distraction_threshold': 0.7,  # Threshold for distraction classification
    'use_deep_model': False,      # Use trained deep model or rule-based
    'model_path': None,           # Path to trained model (if available)
    'history_length': 10,         # Frames for temporal smoothing
}

# Voice Cues Detection
VOICE_CONFIG = {
    'model_type': 'lstm',         # 'lstm', 'cnn', 'random_forest', or 'rule_based'
    'sequence_length': 50,        # MFCC sequence length
    'yawn_threshold': 0.6,        # Threshold for yawn detection
    'fatigue_threshold': 0.5,     # Threshold for voice fatigue
    'use_deep_model': False,      # Use trained deep model or rule-based
    'model_path': None,           # Path to trained model (if available)
}

# ===== SIGNAL FUSION CONFIGURATION =====

FUSION_CONFIG = {
    # Signal weights (should sum to 1.0)
    'drowsiness_weight': 0.5,     # Weight for drowsiness signal
    'distraction_weight': 0.3,    # Weight for distraction signal
    'voice_weight': 0.2,          # Weight for voice fatigue signal
    
    # Alert level thresholds (fatigue score, not alertness)
    'thresholds': {
        'normal': (0, 30),        # 70-100% alertness
        'mild': (31, 60),         # 40-69% alertness
        'moderate': (61, 80),     # 20-39% alertness
        'severe': (81, 100),      # 0-19% alertness
    },
    
    # Temporal parameters
    'smoothing_window': 5,        # Frames for temporal smoothing
    'max_history': 100,           # Maximum history buffer size
}

# ===== INTERVENTION CONFIGURATION =====

INTERVENTION_CONFIG = {
    'enable_voice_alerts': True,       # Enable voice prompts
    'enable_visual_alerts': True,      # Enable visual alerts
    'enable_haptic_feedback': False,   # Enable haptic (simulated)
    'alert_repeat_interval': 30,       # Seconds between repeated alerts
    'urgent_alert_volume': 0.8,        # Volume for urgent alerts (0-1)
}

# ===== PIPELINE CONFIGURATION =====

PIPELINE_CONFIG = {
    'device': 'cpu',              # 'cpu' or 'cuda'
    'use_webcam': True,           # Enable webcam
    'use_audio': False,           # Enable audio monitoring
    'camera_index': 0,            # Webcam index (0 = default)
    'target_fps': 30,             # Target FPS (will be limited by hardware)
    'display_window': True,       # Show visualization window
    'save_video': False,          # Save output video
    'output_video_path': 'output.mp4',  # Output video path
    'log_to_file': False,         # Log results to file
    'log_file_path': 'driver_wellness_log.csv',  # Log file path
}

# ===== VISUALIZATION CONFIGURATION =====

VISUALIZATION_CONFIG = {
    'show_face_landmarks': True,      # Draw facial landmarks
    'show_pose_axis': True,           # Draw head pose axis
    'show_alertness_panel': True,     # Show alertness score panel
    'show_trend_chart': False,        # Show real-time trend (heavy)
    'panel_position': 'top_right',    # Panel position
    'panel_transparency': 0.7,        # Panel transparency (0-1)
    'alert_colors': {
        'normal': (0, 255, 0),        # Green
        'mild': (0, 255, 255),        # Yellow
        'moderate': (0, 165, 255),    # Orange
        'severe': (0, 0, 255),        # Red
    }
}

# ===== PERFORMANCE CONFIGURATION =====

PERFORMANCE_CONFIG = {
    'max_frame_queue': 5,         # Maximum frames in processing queue
    'skip_frames': 0,             # Skip N frames between processing (0 = process all)
    'downscale_factor': 1.0,      # Downscale input frames (< 1.0 for speed)
    'use_threading': True,        # Use threading for parallel processing
    'use_gpu_preprocessing': False,  # Use GPU for preprocessing (if available)
}

# ===== EXPORT CONFIGURATION =====

def get_config(config_name: str = 'all'):
    """
    Get configuration dictionary
    
    Args:
        config_name: Name of config to get ('all', 'fusion', 'preprocessing', etc.)
    
    Returns:
        Configuration dictionary
    """
    configs = {
        'face_detection': FACE_DETECTION_CONFIG,
        'pose_estimation': POSE_ESTIMATION_CONFIG,
        'audio': AUDIO_CONFIG,
        'drowsiness': DROWSINESS_CONFIG,
        'distraction': DISTRACTION_CONFIG,
        'voice': VOICE_CONFIG,
        'fusion': FUSION_CONFIG,
        'intervention': INTERVENTION_CONFIG,
        'pipeline': PIPELINE_CONFIG,
        'visualization': VISUALIZATION_CONFIG,
        'performance': PERFORMANCE_CONFIG,
    }
    
    if config_name == 'all':
        return configs
    
    return configs.get(config_name, {})


def print_config():
    """Print all configuration"""
    print("="*70)
    print("AI Driver Wellness Assistant - Configuration")
    print("="*70)
    
    configs = get_config('all')
    
    for name, config in configs.items():
        print(f"\n{name.upper().replace('_', ' ')}:")
        for key, value in config.items():
            print(f"  {key}: {value}")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    print_config()
