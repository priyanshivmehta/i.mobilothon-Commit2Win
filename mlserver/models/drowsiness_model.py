"""
AI Inference: Drowsiness Detection Model
CNN + LSTM architecture for detecting drowsiness from temporal eye closure patterns
"""

import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Tuple, Optional
import cv2

class DrowsinessDetectionCNN(nn.Module):
    """
    CNN for extracting spatial features from eye regions
    """
    def __init__(self, input_channels: int = 1):
        super(DrowsinessDetectionCNN, self).__init__()
        
        # Convolutional layers for feature extraction
        self.conv1 = nn.Conv2d(input_channels, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.pool1 = nn.MaxPool2d(2, 2)
        
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.pool2 = nn.MaxPool2d(2, 2)
        
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.pool3 = nn.MaxPool2d(2, 2)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        
    def forward(self, x):
        # x shape: (batch, channels, height, width)
        x = self.pool1(self.relu(self.bn1(self.conv1(x))))
        x = self.pool2(self.relu(self.bn2(self.conv2(x))))
        x = self.pool3(self.relu(self.bn3(self.conv3(x))))
        x = self.dropout(x)
        return x


class DrowsinessDetectionLSTM(nn.Module):
    """
    LSTM for modeling temporal patterns in drowsiness
    """
    def __init__(self, input_size: int, hidden_size: int = 128, num_layers: int = 2):
        super(DrowsinessDetectionLSTM, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.3
        )
        
    def forward(self, x, hidden=None):
        # x shape: (batch, seq_len, features)
        out, hidden = self.lstm(x, hidden)
        return out, hidden


class DrowsinessCNNLSTM(nn.Module):
    """
    Complete CNN + LSTM model for drowsiness detection
    """
    def __init__(self, 
                 input_size: Tuple[int, int] = (64, 64),
                 sequence_length: int = 30,
                 num_classes: int = 2):
        super(DrowsinessCNNLSTM, self).__init__()
        
        self.input_size = input_size
        self.sequence_length = sequence_length
        
        # CNN for spatial feature extraction
        self.cnn = DrowsinessDetectionCNN(input_channels=1)
        
        # Calculate CNN output size
        with torch.no_grad():
            dummy_input = torch.zeros(1, 1, input_size[0], input_size[1])
            cnn_output = self.cnn(dummy_input)
            cnn_output_size = cnn_output.view(1, -1).size(1)
        
        # Feature projection
        self.fc_features = nn.Linear(cnn_output_size, 256)
        
        # LSTM for temporal modeling
        self.lstm = DrowsinessDetectionLSTM(input_size=256, hidden_size=128, num_layers=2)
        
        # Classification head
        self.fc1 = nn.Linear(128, 64)
        self.fc2 = nn.Linear(64, num_classes)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)
        self.softmax = nn.Softmax(dim=1)
        
    def forward(self, x):
        # x shape: (batch, seq_len, channels, height, width)
        batch_size, seq_len, channels, height, width = x.size()
        
        # Process each frame through CNN
        cnn_features = []
        for t in range(seq_len):
            frame = x[:, t, :, :, :]
            features = self.cnn(frame)
            features = features.view(batch_size, -1)
            features = self.relu(self.fc_features(features))
            cnn_features.append(features)
        
        # Stack features for LSTM: (batch, seq_len, features)
        cnn_features = torch.stack(cnn_features, dim=1)
        
        # Pass through LSTM
        lstm_out, _ = self.lstm(cnn_features)
        
        # Use last LSTM output for classification
        last_output = lstm_out[:, -1, :]
        
        # Classification layers
        out = self.relu(self.fc1(last_output))
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out


class DrowsinessDetector:
    """
    Drowsiness detection inference wrapper
    """
    def __init__(self, 
                 model_path: Optional[str] = None,
                 device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
                 sequence_length: int = 30,
                 input_size: Tuple[int, int] = (64, 64)):
        
        self.device = device
        self.sequence_length = sequence_length
        self.input_size = input_size
        
        # Initialize model
        self.model = DrowsinessCNNLSTM(
            input_size=input_size,
            sequence_length=sequence_length,
            num_classes=2  # Alert, Drowsy
        ).to(device)
        
        # Load pretrained weights if available
        if model_path:
            try:
                self.model.load_state_dict(torch.load(model_path, map_location=device))
                print(f"Loaded model from {model_path}")
            except:
                print(f"Could not load model from {model_path}. Using random initialization.")
        
        self.model.eval()
        
        # Frame buffer for temporal sequence
        self.frame_buffer = []
        
        # Drowsiness thresholds
        self.drowsy_threshold = 0.6
        
    def preprocess_eye_region(self, eye_region: np.ndarray) -> torch.Tensor:
        """
        Preprocess eye region image for model input
        """
        # Convert to grayscale if needed
        if len(eye_region.shape) == 3:
            eye_region = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
        
        # Resize to model input size
        eye_region = cv2.resize(eye_region, self.input_size)
        
        # Normalize
        eye_region = eye_region.astype(np.float32) / 255.0
        
        # Convert to tensor: (1, height, width)
        eye_tensor = torch.from_numpy(eye_region).unsqueeze(0)
        
        return eye_tensor
    
    def update_buffer(self, eye_tensor: torch.Tensor):
        """
        Update frame buffer with new eye region
        """
        self.frame_buffer.append(eye_tensor)
        
        # Keep only last sequence_length frames
        if len(self.frame_buffer) > self.sequence_length:
            self.frame_buffer.pop(0)
    
    def predict(self, eye_region: np.ndarray) -> Dict:
        """
        Predict drowsiness from eye region
        
        Args:
            eye_region: Eye region image (numpy array)
        
        Returns:
            Dictionary with prediction results
        """
        # Preprocess
        eye_tensor = self.preprocess_eye_region(eye_region)
        
        # Update buffer
        self.update_buffer(eye_tensor)
        
        # Need full sequence for prediction
        if len(self.frame_buffer) < self.sequence_length:
            return {
                'drowsiness_score': 0.0,
                'is_drowsy': False,
                'confidence': 0.0,
                'class_probabilities': [1.0, 0.0],  # [alert, drowsy]
                'status': 'buffering'
            }
        
        # Prepare input: (1, seq_len, 1, height, width)
        sequence = torch.stack(self.frame_buffer, dim=0).unsqueeze(0).to(self.device)
        
        # Inference
        with torch.no_grad():
            logits = self.model(sequence)
            probabilities = torch.softmax(logits, dim=1)
            probabilities = probabilities.cpu().numpy()[0]
        
        # Extract results
        alert_prob = probabilities[0]
        drowsy_prob = probabilities[1]
        
        is_drowsy = drowsy_prob > self.drowsy_threshold
        confidence = max(alert_prob, drowsy_prob)
        
        return {
            'drowsiness_score': float(drowsy_prob),
            'is_drowsy': bool(is_drowsy),
            'confidence': float(confidence),
            'class_probabilities': probabilities.tolist(),
            'status': 'active'
        }
    
    def predict_from_features(self, ear: float, mar: float, blink_rate: float) -> Dict:
        """
        Alternative prediction using hand-crafted features
        Useful when CNN+LSTM model is not available
        
        Args:
            ear: Eye Aspect Ratio
            mar: Mouth Aspect Ratio
            blink_rate: Blinks per minute
        
        Returns:
            Dictionary with prediction results
        """
        # Simple rule-based drowsiness detection
        # EAR < 0.25: eyes closing
        # MAR > 0.6: yawning
        # blink_rate < 12: reduced alertness
        
        ear_score = max(0, 1.0 - (ear / 0.25))
        mar_score = min(mar / 0.6, 1.0)
        blink_score = max(0, 1.0 - (blink_rate / 15))
        
        # Weighted combination
        drowsiness_score = 0.5 * ear_score + 0.3 * mar_score + 0.2 * blink_score
        drowsiness_score = np.clip(drowsiness_score, 0.0, 1.0)
        
        is_drowsy = drowsiness_score > self.drowsy_threshold
        
        return {
            'drowsiness_score': float(drowsiness_score),
            'is_drowsy': bool(is_drowsy),
            'confidence': float(drowsiness_score),
            'ear_score': float(ear_score),
            'mar_score': float(mar_score),
            'blink_score': float(blink_score),
            'status': 'rule_based'
        }
    
    def reset_buffer(self):
        """Reset frame buffer"""
        self.frame_buffer = []


def train_model(train_loader, val_loader, num_epochs: int = 50, 
               learning_rate: float = 0.001, device: str = 'cuda'):
    """
    Training function for the drowsiness detection model
    
    Args:
        train_loader: DataLoader for training data
        val_loader: DataLoader for validation data
        num_epochs: Number of training epochs
        learning_rate: Learning rate
        device: Device to train on
    """
    model = DrowsinessCNNLSTM().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=5)
    
    best_val_loss = float('inf')
    
    for epoch in range(num_epochs):
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for inputs, labels in train_loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = torch.max(outputs, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
        
        train_accuracy = 100 * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_accuracy = 100 * val_correct / val_total
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        print(f'Epoch [{epoch+1}/{num_epochs}]')
        print(f'  Train Loss: {train_loss/len(train_loader):.4f}, Acc: {train_accuracy:.2f}%')
        print(f'  Val Loss: {val_loss/len(val_loader):.4f}, Acc: {val_accuracy:.2f}%')
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'models/drowsiness_cnn_lstm_best.pth')
            print('  Saved best model!')
    
    return model


if __name__ == "__main__":
    # Test the model architecture
    print("Testing Drowsiness Detection CNN+LSTM Model")
    
    # Create dummy data
    batch_size = 4
    seq_len = 30
    img_size = (64, 64)
    
    dummy_input = torch.randn(batch_size, seq_len, 1, img_size[0], img_size[1])
    
    # Create model
    model = DrowsinessCNNLSTM(input_size=img_size, sequence_length=seq_len)
    
    # Forward pass
    output = model(dummy_input)
    print(f"Input shape: {dummy_input.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Output (logits): {output[0]}")
    
    # Test detector
    detector = DrowsinessDetector()
    
    # Simulate eye region
    dummy_eye = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    result = detector.predict(dummy_eye)
    print(f"\nPrediction result: {result}")
    
    # Test feature-based prediction
    result_features = detector.predict_from_features(ear=0.20, mar=0.5, blink_rate=10)
    print(f"Feature-based prediction: {result_features}")
    
    print("\nModel test complete!")
