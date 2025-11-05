"""
AI Inference: Voice Cues Detection Model
ML model for detecting yawning and speech pause patterns from audio features
"""

import numpy as np
import torch
import torch.nn as nn
from typing import Dict, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib

class VoiceCuesLSTM(nn.Module):
    """
    LSTM model for voice cues detection from MFCC features
    """
    def __init__(self, 
                 input_size: int = 13,  # 13 MFCC coefficients
                 hidden_size: int = 64,
                 num_layers: int = 2,
                 num_classes: int = 3):  # Normal, Yawn, Fatigue
        super(VoiceCuesLSTM, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.3 if num_layers > 1 else 0
        )
        
        # Attention mechanism
        self.attention = nn.Linear(hidden_size, 1)
        
        # Classification layers
        self.fc1 = nn.Linear(hidden_size, 32)
        self.fc2 = nn.Linear(32, num_classes)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.softmax = nn.Softmax(dim=1)
        
    def forward(self, x):
        # x shape: (batch, seq_len, features)
        
        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x)
        # lstm_out shape: (batch, seq_len, hidden_size)
        
        # Attention mechanism
        attention_weights = torch.softmax(self.attention(lstm_out), dim=1)
        # attention_weights shape: (batch, seq_len, 1)
        
        # Apply attention
        context = torch.sum(attention_weights * lstm_out, dim=1)
        # context shape: (batch, hidden_size)
        
        # Classification
        out = self.relu(self.fc1(context))
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out


class VoiceCues1DCNN(nn.Module):
    """
    1D CNN for processing MFCC features
    Faster alternative to LSTM
    """
    def __init__(self, input_size: int = 13, num_classes: int = 3):
        super(VoiceCues1DCNN, self).__init__()
        
        self.conv_layers = nn.Sequential(
            # Conv block 1
            nn.Conv1d(input_size, 64, kernel_size=3, padding=1),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Dropout(0.2),
            
            # Conv block 2
            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Dropout(0.3),
            
            # Conv block 3
            nn.Conv1d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1)
        )
        
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes)
        )
        
    def forward(self, x):
        # x shape: (batch, seq_len, features)
        # Transpose for Conv1d: (batch, features, seq_len)
        x = x.transpose(1, 2)
        
        x = self.conv_layers(x)
        x = self.classifier(x)
        
        return x


class VoiceCuesDetector:
    """
    Voice cues detection inference wrapper
    Detects yawning, speech pauses, and voice fatigue
    """
    
    VOICE_CLASSES = {
        0: 'Normal',
        1: 'Yawning',
        2: 'Fatigued'
    }
    
    def __init__(self,
                 model_path: Optional[str] = None,
                 model_type: str = 'lstm',  # 'lstm', 'cnn', or 'random_forest'
                 device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
                 sequence_length: int = 50):
        
        self.device = device
        self.model_type = model_type
        self.sequence_length = sequence_length
        
        # Initialize model
        if model_type == 'cnn':
            self.model = VoiceCues1DCNN(input_size=13, num_classes=3).to(device)
            self.use_torch = True
        elif model_type == 'lstm':
            self.model = VoiceCuesLSTM(input_size=13, hidden_size=64, num_classes=3).to(device)
            self.use_torch = True
        else:  # random_forest
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            self.scaler = StandardScaler()
            self.use_torch = False
        
        # Load pretrained weights if available
        if model_path:
            try:
                if self.use_torch:
                    self.model.load_state_dict(torch.load(model_path, map_location=device))
                    self.model.eval()
                else:
                    self.model = joblib.load(model_path)
                print(f"Loaded model from {model_path}")
            except Exception as e:
                print(f"Could not load model from {model_path}: {e}")
        
        if self.use_torch:
            self.model.eval()
        
        # Detection thresholds
        self.yawn_threshold = 0.6
        self.fatigue_threshold = 0.5
        
        # Feature buffer for temporal analysis
        self.feature_buffer = []
        
    def predict_from_mfcc(self, mfcc_features: np.ndarray) -> Dict:
        """
        Predict voice cues from MFCC features
        
        Args:
            mfcc_features: MFCC features (n_mfcc, time_steps) or (time_steps, n_mfcc)
        
        Returns:
            Dictionary with prediction results
        """
        # Ensure correct shape: (time_steps, n_mfcc)
        if mfcc_features.shape[0] == 13:
            mfcc_features = mfcc_features.T
        
        # Update buffer
        self.feature_buffer.append(mfcc_features)
        if len(self.feature_buffer) > self.sequence_length:
            self.feature_buffer.pop(0)
        
        # Need sufficient data
        if len(self.feature_buffer) < 10:
            return {
                'voice_class': 0,
                'class_name': 'Normal',
                'is_yawning': False,
                'is_fatigued': False,
                'confidence': 0.0,
                'class_probabilities': [1.0, 0.0, 0.0],
                'status': 'buffering'
            }
        
        if self.use_torch:
            return self._predict_torch(mfcc_features)
        else:
            return self._predict_sklearn(mfcc_features)
    
    def _predict_torch(self, mfcc_features: np.ndarray) -> Dict:
        """Prediction using PyTorch models"""
        # Prepare input: (1, seq_len, features)
        if len(mfcc_features.shape) == 2:
            mfcc_tensor = torch.from_numpy(mfcc_features).float().unsqueeze(0).to(self.device)
        else:
            mfcc_tensor = torch.from_numpy(mfcc_features).float().to(self.device)
        
        # Inference
        with torch.no_grad():
            logits = self.model(mfcc_tensor)
            probabilities = torch.softmax(logits, dim=1)
            probabilities = probabilities.cpu().numpy()[0]
        
        # Extract results
        predicted_class = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_class])
        
        is_yawning = (predicted_class == 1) and (probabilities[1] > self.yawn_threshold)
        is_fatigued = (predicted_class == 2) and (probabilities[2] > self.fatigue_threshold)
        
        return {
            'voice_class': predicted_class,
            'class_name': self.VOICE_CLASSES[predicted_class],
            'is_yawning': bool(is_yawning),
            'is_fatigued': bool(is_fatigued),
            'confidence': confidence,
            'class_probabilities': probabilities.tolist(),
            'status': 'active'
        }
    
    def _predict_sklearn(self, mfcc_features: np.ndarray) -> Dict:
        """Prediction using sklearn Random Forest"""
        # Flatten features for sklearn
        features_flat = mfcc_features.flatten().reshape(1, -1)
        
        # Predict
        probabilities = self.model.predict_proba(features_flat)[0]
        predicted_class = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_class])
        
        is_yawning = (predicted_class == 1) and (probabilities[1] > self.yawn_threshold)
        is_fatigued = (predicted_class == 2) and (probabilities[2] > self.fatigue_threshold)
        
        return {
            'voice_class': predicted_class,
            'class_name': self.VOICE_CLASSES[predicted_class],
            'is_yawning': bool(is_yawning),
            'is_fatigued': bool(is_fatigued),
            'confidence': confidence,
            'class_probabilities': probabilities.tolist(),
            'status': 'active'
        }
    
    def predict_from_audio_features(self, 
                                   yawn_confidence: float,
                                   pause_duration: float,
                                   energy_level: float,
                                   spectral_centroid: float) -> Dict:
        """
        Alternative prediction using hand-crafted audio features
        Useful when deep learning models are not available
        
        Args:
            yawn_confidence: Yawn detection confidence (0-1)
            pause_duration: Duration of longest pause in seconds
            energy_level: Average RMS energy
            spectral_centroid: Average spectral centroid (voice brightness)
        
        Returns:
            Dictionary with prediction results
        """
        # Rule-based classification
        # Yawning indicators: high yawn confidence
        # Fatigue indicators: low energy, low spectral centroid, long pauses
        
        yawn_score = yawn_confidence
        
        # Fatigue score based on multiple indicators
        energy_score = max(0, 1.0 - (energy_level / 0.05))  # Lower energy = higher score
        centroid_score = max(0, 1.0 - (spectral_centroid / 2000))  # Lower centroid = higher score
        pause_score = min(pause_duration / 3.0, 1.0)  # Longer pause = higher score
        
        fatigue_score = (0.3 * energy_score + 0.3 * centroid_score + 0.4 * pause_score)
        
        # Determine class
        if yawn_score > 0.6:
            predicted_class = 1  # Yawning
            confidence = yawn_score
        elif fatigue_score > 0.5:
            predicted_class = 2  # Fatigued
            confidence = fatigue_score
        else:
            predicted_class = 0  # Normal
            confidence = 1.0 - max(yawn_score, fatigue_score)
        
        # Create probability distribution
        probabilities = np.zeros(3)
        probabilities[predicted_class] = confidence
        probabilities[(predicted_class + 1) % 3] = (1 - confidence) * 0.6
        probabilities[(predicted_class + 2) % 3] = (1 - confidence) * 0.4
        
        return {
            'voice_class': predicted_class,
            'class_name': self.VOICE_CLASSES[predicted_class],
            'is_yawning': bool(predicted_class == 1),
            'is_fatigued': bool(predicted_class == 2),
            'confidence': float(confidence),
            'class_probabilities': probabilities.tolist(),
            'feature_scores': {
                'yawn_score': float(yawn_score),
                'fatigue_score': float(fatigue_score),
                'energy_score': float(energy_score),
                'centroid_score': float(centroid_score),
                'pause_score': float(pause_score)
            },
            'method': 'rule_based'
        }
    
    def reset_buffer(self):
        """Reset feature buffer"""
        self.feature_buffer = []


if __name__ == "__main__":
    # Test the models
    print("Testing Voice Cues Detection Models")
    
    # Test LSTM
    print("\n1. Testing LSTM model:")
    lstm_model = VoiceCuesLSTM(input_size=13, hidden_size=64, num_classes=3)
    dummy_mfcc = torch.randn(2, 50, 13)  # (batch, seq_len, features)
    lstm_output = lstm_model(dummy_mfcc)
    print(f"   Input shape: {dummy_mfcc.shape}")
    print(f"   Output shape: {lstm_output.shape}")
    
    # Test 1D CNN
    print("\n2. Testing 1D CNN model:")
    cnn_model = VoiceCues1DCNN(input_size=13, num_classes=3)
    cnn_output = cnn_model(dummy_mfcc)
    print(f"   Input shape: {dummy_mfcc.shape}")
    print(f"   Output shape: {cnn_output.shape}")
    
    # Test detector with LSTM
    print("\n3. Testing Voice Cues Detector (LSTM):")
    detector = VoiceCuesDetector(model_type='lstm')
    
    # Simulate MFCC features
    dummy_features = np.random.randn(50, 13)
    result = detector.predict_from_mfcc(dummy_features)
    print(f"   Prediction: {result['class_name']}")
    print(f"   Is yawning: {result['is_yawning']}")
    print(f"   Is fatigued: {result['is_fatigued']}")
    print(f"   Confidence: {result['confidence']:.2f}")
    
    # Test feature-based prediction
    print("\n4. Testing feature-based prediction:")
    feature_result = detector.predict_from_audio_features(
        yawn_confidence=0.7,
        pause_duration=2.5,
        energy_level=0.02,
        spectral_centroid=1500
    )
    print(f"   Prediction: {feature_result['class_name']}")
    print(f"   Is yawning: {feature_result['is_yawning']}")
    print(f"   Confidence: {feature_result['confidence']:.2f}")
    
    print("\nModel test complete!")
