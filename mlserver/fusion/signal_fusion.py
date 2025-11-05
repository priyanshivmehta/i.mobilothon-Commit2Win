"""
Signal Fusion Module
Combines all AI model outputs into a unified Driver Alertness Score
"""

import numpy as np
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class AlertnessMetrics:
    """Container for all alertness metrics"""
    drowsiness_score: float = 0.0
    distraction_score: float = 0.0
    voice_fatigue_score: float = 0.0
    overall_alertness: float = 100.0  # 0-100 scale
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


class SignalFusion:
    """
    Fuses multiple signal sources into a unified Driver Alertness Score
    
    Signal Sources:
    1. Drowsiness (from facial features, eye closure)
    2. Distraction (from head pose, gaze direction)
    3. Voice Fatigue (from audio cues, yawning)
    """
    
    def __init__(self,
                 drowsiness_weight: float = 0.5,
                 distraction_weight: float = 0.3,
                 voice_weight: float = 0.2):
        """
        Initialize signal fusion with configurable weights
        
        Args:
            drowsiness_weight: Weight for drowsiness signal (default 0.5)
            distraction_weight: Weight for distraction signal (default 0.3)
            voice_weight: Weight for voice fatigue signal (default 0.2)
        """
        # Normalize weights
        total_weight = drowsiness_weight + distraction_weight + voice_weight
        self.weights = {
            'drowsiness': drowsiness_weight / total_weight,
            'distraction': distraction_weight / total_weight,
            'voice': voice_weight / total_weight
        }
        
        # Alert level thresholds (on 0-100 scale, lower = more alert)
        self.thresholds = {
            'normal': (0, 30),      # 70-100% alertness
            'mild': (31, 60),       # 40-69% alertness
            'moderate': (61, 80),   # 20-39% alertness
            'severe': (81, 100)     # 0-19% alertness
        }
        
        # History for trend analysis
        self.history: List[AlertnessMetrics] = []
        self.max_history = 100
        
        # Smoothing parameters
        self.smoothing_window = 5
        
    def normalize_score(self, score: float) -> float:
        """Normalize score to 0-1 range"""
        return np.clip(score, 0.0, 1.0)
    
    def compute_alertness_score(self,
                               drowsiness: float = 0.0,
                               distraction: float = 0.0,
                               voice_fatigue: float = 0.0) -> float:
        """
        Compute overall alertness score from individual signals
        
        Args:
            drowsiness: Drowsiness score (0=alert, 1=drowsy)
            distraction: Distraction score (0=attentive, 1=distracted)
            voice_fatigue: Voice fatigue score (0=normal, 1=fatigued)
        
        Returns:
            Alertness score (0-100, higher = more alert)
        """
        # Normalize inputs
        drowsiness = self.normalize_score(drowsiness)
        distraction = self.normalize_score(distraction)
        voice_fatigue = self.normalize_score(voice_fatigue)
        
        # Weighted combination (risk score, 0=safe, 1=risky)
        risk_score = (
            self.weights['drowsiness'] * drowsiness +
            self.weights['distraction'] * distraction +
            self.weights['voice'] * voice_fatigue
        )
        
        # Convert to alertness score (0-100, higher is better)
        alertness = (1.0 - risk_score) * 100
        
        return np.clip(alertness, 0.0, 100.0)
    
    def get_alert_level(self, alertness_score: float) -> str:
        """
        Determine alert level from alertness score
        
        Returns: 'normal', 'mild', 'moderate', or 'severe'
        """
        # Note: Lower alertness score = higher fatigue/risk
        fatigue_score = 100 - alertness_score
        
        for level, (min_val, max_val) in self.thresholds.items():
            if min_val <= fatigue_score <= max_val:
                return level
        
        return 'normal'
    
    def process_signals(self,
                       drowsiness_result: Optional[Dict] = None,
                       distraction_result: Optional[Dict] = None,
                       voice_result: Optional[Dict] = None) -> Dict:
        """
        Main processing function - fuse all signals and compute alertness
        
        Args:
            drowsiness_result: Result from drowsiness detector
            distraction_result: Result from distraction detector
            voice_result: Result from voice cues detector
        
        Returns:
            Dictionary with fused results and alertness score
        """
        # Extract scores from each signal (default to 0 if not available)
        drowsiness_score = 0.0
        if drowsiness_result and 'drowsiness_score' in drowsiness_result:
            drowsiness_score = drowsiness_result['drowsiness_score']
        
        distraction_score = 0.0
        if distraction_result and 'distraction_score' in distraction_result:
            distraction_score = distraction_result['distraction_score']
        
        voice_score = 0.0
        if voice_result and 'voice_fatigue_score' in voice_result:
            voice_score = voice_result['voice_fatigue_score']
        
        # Compute overall alertness
        alertness = self.compute_alertness_score(
            drowsiness_score,
            distraction_score,
            voice_score
        )
        
        # Apply temporal smoothing
        smoothed_alertness = self._smooth_alertness(alertness)
        
        # Determine alert level
        alert_level = self.get_alert_level(smoothed_alertness)
        
        # Store in history
        metrics = AlertnessMetrics(
            drowsiness_score=drowsiness_score,
            distraction_score=distraction_score,
            voice_fatigue_score=voice_score,
            overall_alertness=smoothed_alertness,
            timestamp=datetime.now()
        )
        self._update_history(metrics)
        
        # Predict trend
        trend = self._predict_trend()
        
        return {
            'alertness_score': float(smoothed_alertness),
            'alert_level': alert_level,
            'signal_scores': {
                'drowsiness': float(drowsiness_score),
                'distraction': float(distraction_score),
                'voice_fatigue': float(voice_score)
            },
            'signal_weights': self.weights,
            'individual_results': {
                'drowsiness': drowsiness_result,
                'distraction': distraction_result,
                'voice': voice_result
            },
            'trend': trend,
            'timestamp': metrics.timestamp.isoformat(),
            'intervention_needed': alert_level in ['moderate', 'severe']
        }
    
    def _smooth_alertness(self, current_alertness: float) -> float:
        """Apply temporal smoothing to reduce jitter"""
        if len(self.history) == 0:
            return current_alertness
        
        # Get recent history
        recent = self.history[-self.smoothing_window:]
        recent_scores = [m.overall_alertness for m in recent] + [current_alertness]
        
        # Exponential moving average
        weights = np.exp(np.linspace(-1, 0, len(recent_scores)))
        weights /= weights.sum()
        
        smoothed = np.average(recent_scores, weights=weights)
        return float(smoothed)
    
    def _update_history(self, metrics: AlertnessMetrics):
        """Update history buffer"""
        self.history.append(metrics)
        if len(self.history) > self.max_history:
            self.history.pop(0)
    
    def _predict_trend(self) -> Dict:
        """
        Predict alertness trend based on recent history
        
        Returns:
            Dictionary with trend information
        """
        if len(self.history) < 10:
            return {
                'direction': 'stable',
                'rate': 0.0,
                'prediction_5min': None,
                'confidence': 0.0
            }
        
        # Get recent alertness scores
        recent = self.history[-20:]
        scores = np.array([m.overall_alertness for m in recent])
        time_points = np.arange(len(scores))
        
        # Linear regression for trend
        coeffs = np.polyfit(time_points, scores, 1)
        slope = coeffs[0]
        
        # Determine trend direction
        if abs(slope) < 0.5:
            direction = 'stable'
        elif slope > 0:
            direction = 'improving'
        else:
            direction = 'declining'
        
        # Predict 5 minutes ahead (assuming ~2 samples per second = 600 samples)
        future_time = len(scores) + 600
        predicted_score = np.polyval(coeffs, future_time)
        predicted_score = np.clip(predicted_score, 0, 100)
        
        # Confidence based on variance
        residuals = scores - np.polyval(coeffs, time_points)
        variance = np.var(residuals)
        confidence = 1.0 / (1.0 + variance)  # Lower variance = higher confidence
        
        return {
            'direction': direction,
            'rate': float(slope),
            'prediction_5min': float(predicted_score),
            'current_score': float(scores[-1]),
            'confidence': float(confidence)
        }
    
    def get_intervention_recommendation(self, alert_level: str) -> Dict:
        """
        Get recommended intervention based on alert level
        
        Returns:
            Dictionary with intervention details
        """
        interventions = {
            'normal': {
                'level': 'none',
                'message': 'Driver is alert and attentive.',
                'actions': [],
                'visual': {'color': 'green', 'priority': 0}
            },
            'mild': {
                'level': 'soft_nudge',
                'message': 'Mild fatigue detected. Consider taking a short break soon.',
                'actions': [
                    'Gentle voice prompt',
                    'Subtle UI color change',
                    'Suggest break location'
                ],
                'visual': {'color': 'yellow', 'priority': 1}
            },
            'moderate': {
                'level': 'active_alert',
                'message': 'Moderate fatigue detected. Please take a break soon.',
                'actions': [
                    'Visual alert pop-up',
                    'Repeated voice prompt',
                    'Haptic feedback simulation',
                    'Increase cabin alertness (brightness, AC)'
                ],
                'visual': {'color': 'orange', 'priority': 2}
            },
            'severe': {
                'level': 'urgent_warning',
                'message': 'SEVERE FATIGUE DETECTED! Please pull over safely immediately.',
                'actions': [
                    'Urgent visual warning',
                    'Loud audible alert',
                    'Strong haptic feedback',
                    'Emergency contact notification',
                    'Assist with safe pullover'
                ],
                'visual': {'color': 'red', 'priority': 3}
            }
        }
        
        return interventions.get(alert_level, interventions['normal'])
    
    def get_statistics(self) -> Dict:
        """
        Get statistical summary of driver alertness
        
        Returns:
            Dictionary with statistics
        """
        if len(self.history) == 0:
            return {
                'mean_alertness': 100.0,
                'min_alertness': 100.0,
                'max_alertness': 100.0,
                'std_alertness': 0.0,
                'time_in_alert': 0.0,
                'time_in_mild': 0.0,
                'time_in_moderate': 0.0,
                'time_in_severe': 0.0,
                'total_samples': 0
            }
        
        scores = [m.overall_alertness for m in self.history]
        
        # Count time in each alert level
        level_counts = {'normal': 0, 'mild': 0, 'moderate': 0, 'severe': 0}
        for m in self.history:
            level = self.get_alert_level(m.overall_alertness)
            level_counts[level] += 1
        
        total = len(self.history)
        
        return {
            'mean_alertness': float(np.mean(scores)),
            'min_alertness': float(np.min(scores)),
            'max_alertness': float(np.max(scores)),
            'std_alertness': float(np.std(scores)),
            'time_in_alert': level_counts['normal'] / total * 100,
            'time_in_mild': level_counts['mild'] / total * 100,
            'time_in_moderate': level_counts['moderate'] / total * 100,
            'time_in_severe': level_counts['severe'] / total * 100,
            'total_samples': total
        }
    
    def reset(self):
        """Reset history and state"""
        self.history = []


if __name__ == "__main__":
    # Test the signal fusion module
    print("Testing Signal Fusion Module")
    
    fusion = SignalFusion(drowsiness_weight=0.5, distraction_weight=0.3, voice_weight=0.2)
    
    # Simulate various scenarios
    print("\n1. Scenario: Alert Driver")
    result = fusion.process_signals(
        drowsiness_result={'drowsiness_score': 0.1},
        distraction_result={'distraction_score': 0.15},
        voice_result={'voice_fatigue_score': 0.05}
    )
    print(f"   Alertness: {result['alertness_score']:.1f}/100")
    print(f"   Level: {result['alert_level']}")
    print(f"   Intervention: {result['intervention_needed']}")
    
    print("\n2. Scenario: Mildly Fatigued Driver")
    result = fusion.process_signals(
        drowsiness_result={'drowsiness_score': 0.4},
        distraction_result={'distraction_score': 0.3},
        voice_result={'voice_fatigue_score': 0.3}
    )
    print(f"   Alertness: {result['alertness_score']:.1f}/100")
    print(f"   Level: {result['alert_level']}")
    intervention = fusion.get_intervention_recommendation(result['alert_level'])
    print(f"   Message: {intervention['message']}")
    
    print("\n3. Scenario: Severely Fatigued Driver")
    result = fusion.process_signals(
        drowsiness_result={'drowsiness_score': 0.9},
        distraction_result={'distraction_score': 0.7},
        voice_result={'voice_fatigue_score': 0.8}
    )
    print(f"   Alertness: {result['alertness_score']:.1f}/100")
    print(f"   Level: {result['alert_level']}")
    intervention = fusion.get_intervention_recommendation(result['alert_level'])
    print(f"   Message: {intervention['message']}")
    print(f"   Actions: {', '.join(intervention['actions'])}")
    
    # Test trend prediction with simulated degrading alertness
    print("\n4. Testing Trend Prediction")
    for i in range(30):
        # Simulate gradually increasing fatigue
        fatigue = 0.02 * i
        result = fusion.process_signals(
            drowsiness_result={'drowsiness_score': fatigue},
            distraction_result={'distraction_score': fatigue * 0.5},
            voice_result={'voice_fatigue_score': fatigue * 0.3}
        )
    
    trend = result['trend']
    print(f"   Current: {trend['current_score']:.1f}")
    print(f"   Trend: {trend['direction']} (rate: {trend['rate']:.2f}/sample)")
    print(f"   Predicted in 5 min: {trend['prediction_5min']:.1f}")
    print(f"   Confidence: {trend['confidence']:.2f}")
    
    # Get statistics
    print("\n5. Statistics:")
    stats = fusion.get_statistics()
    print(f"   Mean Alertness: {stats['mean_alertness']:.1f}")
    print(f"   Time in Normal: {stats['time_in_alert']:.1f}%")
    print(f"   Time in Mild: {stats['time_in_mild']:.1f}%")
    print(f"   Time in Moderate: {stats['time_in_moderate']:.1f}%")
    print(f"   Time in Severe: {stats['time_in_severe']:.1f}%")
    
    print("\nSignal Fusion test complete!")
