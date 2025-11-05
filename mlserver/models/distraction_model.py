"""
AI Inference: Distraction Detection Model
Vision-based model for detecting driver distraction from head pose
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Tuple, Optional
import cv2

class DistractionCNN(nn.Module):
    """
    CNN for extracting features from driver face/pose
    Lighter architecture for real-time inference
    """
    def __init__(self, input_channels: int = 3, num_classes: int = 4):
        super(DistractionCNN, self).__init__()
        
        # Feature extraction layers
        self.features = nn.Sequential(
            # Block 1
            nn.Conv2d(input_channels, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.2),
            
            # Block 2
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.3),
            
            # Block 3
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(0.3),
            
            # Block 4
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((4, 4))
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256 * 4 * 4, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )
        
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


class DistractionTransformer(nn.Module):
    """
    Simplified Vision Transformer for distraction detection
    Uses patch embedding and transformer encoder
    """
    def __init__(self, 
                 img_size: int = 224,
                 patch_size: int = 16,
                 num_classes: int = 4,
                 dim: int = 256,
                 depth: int = 6,
                 heads: int = 8,
                 mlp_dim: int = 512):
        super(DistractionTransformer, self).__init__()
        
        self.patch_size = patch_size
        num_patches = (img_size // patch_size) ** 2
        patch_dim = 3 * patch_size * patch_size
        
        # Patch embedding
        self.patch_embed = nn.Linear(patch_dim, dim)
        
        # Positional embedding
        self.pos_embed = nn.Parameter(torch.randn(1, num_patches + 1, dim))
        
        # CLS token
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=dim,
            nhead=heads,
            dim_feedforward=mlp_dim,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        
        # Classification head
        self.mlp_head = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, num_classes)
        )
        
    def forward(self, x):
        # x shape: (batch, channels, height, width)
        batch_size = x.size(0)
        
        # Extract patches
        patches = self._extract_patches(x)  # (batch, num_patches, patch_dim)
        
        # Patch embedding
        x = self.patch_embed(patches)  # (batch, num_patches, dim)
        
        # Add CLS token
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)  # (batch, num_patches + 1, dim)
        
        # Add positional embedding
        x = x + self.pos_embed
        
        # Transformer encoding
        x = self.transformer(x)
        
        # Use CLS token for classification
        cls_output = x[:, 0]
        output = self.mlp_head(cls_output)
        
        return output
    
    def _extract_patches(self, x):
        """Extract patches from image"""
        batch_size, channels, height, width = x.size()
        patch_size = self.patch_size
        
        # Unfold into patches
        patches = x.unfold(2, patch_size, patch_size).unfold(3, patch_size, patch_size)
        # Shape: (batch, channels, n_patches_h, n_patches_w, patch_size, patch_size)
        
        patches = patches.contiguous().view(batch_size, channels, -1, patch_size, patch_size)
        # Shape: (batch, channels, num_patches, patch_size, patch_size)
        
        patches = patches.permute(0, 2, 1, 3, 4)
        # Shape: (batch, num_patches, channels, patch_size, patch_size)
        
        patches = patches.contiguous().view(batch_size, -1, channels * patch_size * patch_size)
        # Shape: (batch, num_patches, patch_dim)
        
        return patches


class DistractionDetector:
    """
    Distraction detection inference wrapper
    Detects: Forward, Left, Right, Down (looking at phone)
    """
    
    DISTRACTION_CLASSES = {
        0: 'Forward',
        1: 'Left',
        2: 'Right',
        3: 'Down'
    }
    
    def __init__(self,
                 model_path: Optional[str] = None,
                 model_type: str = 'cnn',  # 'cnn' or 'transformer'
                 device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
                 input_size: Tuple[int, int] = (224, 224)):
        
        self.device = device
        self.input_size = input_size
        self.model_type = model_type
        
        # Initialize model
        if model_type == 'transformer':
            self.model = DistractionTransformer(
                img_size=input_size[0],
                num_classes=4
            ).to(device)
        else:
            self.model = DistractionCNN(
                input_channels=3,
                num_classes=4
            ).to(device)
        
        # Load pretrained weights if available
        if model_path:
            try:
                self.model.load_state_dict(torch.load(model_path, map_location=device))
                print(f"Loaded model from {model_path}")
            except:
                print(f"Could not load model from {model_path}. Using random initialization.")
        
        self.model.eval()
        
        # Distraction thresholds
        self.distraction_threshold = 0.7
        self.distraction_history = []
        self.history_length = 10
        
    def preprocess_frame(self, frame: np.ndarray) -> torch.Tensor:
        """
        Preprocess frame for model input
        """
        # Resize
        frame = cv2.resize(frame, self.input_size)
        
        # Convert BGR to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Normalize to [0, 1]
        frame = frame.astype(np.float32) / 255.0
        
        # Normalize with ImageNet stats
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        frame = (frame - mean) / std
        
        # Convert to tensor: (channels, height, width)
        frame_tensor = torch.from_numpy(frame).permute(2, 0, 1)
        
        return frame_tensor
    
    def predict(self, frame: np.ndarray) -> Dict:
        """
        Predict distraction from frame
        
        Args:
            frame: Input frame (numpy array)
        
        Returns:
            Dictionary with prediction results
        """
        # Preprocess
        frame_tensor = self.preprocess_frame(frame).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            logits = self.model(frame_tensor)
            probabilities = torch.softmax(logits, dim=1)
            probabilities = probabilities.cpu().numpy()[0]
        
        # Get prediction
        predicted_class = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_class])
        
        # Determine if distracted (not looking forward)
        is_distracted = (predicted_class != 0) and (confidence > self.distraction_threshold)
        
        # Update history for temporal smoothing
        self.distraction_history.append(is_distracted)
        if len(self.distraction_history) > self.history_length:
            self.distraction_history.pop(0)
        
        # Smooth distraction detection
        distraction_ratio = sum(self.distraction_history) / len(self.distraction_history)
        is_distracted_smoothed = distraction_ratio > 0.5
        
        # Calculate distraction score (0 = attentive, 1 = highly distracted)
        # Forward attention = 0, other directions = 1
        distraction_score = 1.0 - probabilities[0]
        
        return {
            'predicted_class': predicted_class,
            'class_name': self.DISTRACTION_CLASSES[predicted_class],
            'confidence': confidence,
            'is_distracted': bool(is_distracted_smoothed),
            'distraction_score': float(distraction_score),
            'class_probabilities': probabilities.tolist(),
            'all_classes': self.DISTRACTION_CLASSES
        }
    
    def predict_from_pose(self, yaw: float, pitch: float, roll: float) -> Dict:
        """
        Alternative prediction using head pose angles
        Useful when deep learning model is not available
        
        Args:
            yaw: Head yaw angle (left/right)
            pitch: Head pitch angle (up/down)
            roll: Head roll angle (tilt)
        
        Returns:
            Dictionary with prediction results
        """
        # Thresholds for distraction
        YAW_LEFT_THRESHOLD = -25
        YAW_RIGHT_THRESHOLD = 25
        PITCH_DOWN_THRESHOLD = 20
        
        # Determine direction
        if abs(yaw) < 20 and abs(pitch) < 15:
            predicted_class = 0  # Forward
            confidence = 1.0 - (abs(yaw) / 20 + abs(pitch) / 15) / 2
        elif yaw < YAW_LEFT_THRESHOLD:
            predicted_class = 1  # Left
            confidence = min(abs(yaw) / 45, 1.0)
        elif yaw > YAW_RIGHT_THRESHOLD:
            predicted_class = 2  # Right
            confidence = min(abs(yaw) / 45, 1.0)
        elif pitch > PITCH_DOWN_THRESHOLD:
            predicted_class = 3  # Down
            confidence = min(pitch / 45, 1.0)
        else:
            predicted_class = 0  # Default to forward
            confidence = 0.5
        
        is_distracted = predicted_class != 0
        distraction_score = 0.0 if predicted_class == 0 else confidence
        
        return {
            'predicted_class': predicted_class,
            'class_name': self.DISTRACTION_CLASSES[predicted_class],
            'confidence': float(confidence),
            'is_distracted': bool(is_distracted),
            'distraction_score': float(distraction_score),
            'pose_angles': {'yaw': yaw, 'pitch': pitch, 'roll': roll},
            'method': 'rule_based'
        }
    
    def reset_history(self):
        """Reset distraction history"""
        self.distraction_history = []


if __name__ == "__main__":
    # Test the models
    print("Testing Distraction Detection Models")
    
    # Test CNN
    print("\n1. Testing CNN model:")
    cnn_model = DistractionCNN(input_channels=3, num_classes=4)
    dummy_input = torch.randn(2, 3, 224, 224)
    cnn_output = cnn_model(dummy_input)
    print(f"   Input shape: {dummy_input.shape}")
    print(f"   Output shape: {cnn_output.shape}")
    
    # Test Transformer
    print("\n2. Testing Transformer model:")
    vit_model = DistractionTransformer(img_size=224, num_classes=4)
    vit_output = vit_model(dummy_input)
    print(f"   Input shape: {dummy_input.shape}")
    print(f"   Output shape: {vit_output.shape}")
    
    # Test detector with CNN
    print("\n3. Testing Distraction Detector (CNN):")
    detector = DistractionDetector(model_type='cnn')
    
    # Simulate frame
    dummy_frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    result = detector.predict(dummy_frame)
    print(f"   Prediction: {result['class_name']}")
    print(f"   Confidence: {result['confidence']:.2f}")
    print(f"   Is distracted: {result['is_distracted']}")
    print(f"   Distraction score: {result['distraction_score']:.2f}")
    
    # Test pose-based prediction
    print("\n4. Testing pose-based prediction:")
    pose_result = detector.predict_from_pose(yaw=30, pitch=10, roll=5)
    print(f"   Prediction: {pose_result['class_name']}")
    print(f"   Confidence: {pose_result['confidence']:.2f}")
    print(f"   Is distracted: {pose_result['is_distracted']}")
    
    print("\nModel test complete!")
