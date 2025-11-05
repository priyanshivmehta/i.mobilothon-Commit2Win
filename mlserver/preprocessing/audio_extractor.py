"""
Preprocessing Module: Audio Feature Extraction
Extracts MFCC features for voice cue detection (yawning, speech patterns)
"""

import numpy as np
import librosa
import soundfile as sf
from typing import Dict, Optional, Tuple
import queue
import threading
import pyaudio

class AudioFeatureExtractor:
    """
    Extracts audio features for detecting:
    - Yawning (low frequency elongated sound)
    - Speech pauses (silence detection)
    - Voice fatigue indicators
    """
    
    def __init__(self, sample_rate: int = 16000, frame_duration: float = 0.5):
        self.sample_rate = sample_rate
        self.frame_duration = frame_duration
        self.frame_size = int(sample_rate * frame_duration)
        
        # MFCC parameters
        self.n_mfcc = 13
        self.n_fft = 2048
        self.hop_length = 512
        
        # Yawn detection parameters
        self.yawn_freq_range = (200, 1000)  # Hz
        self.yawn_duration_threshold = 1.0  # seconds
        self.yawn_energy_threshold = 0.02
        
        # Speech pause detection
        self.silence_threshold = 0.01
        self.pause_duration_threshold = 2.0  # seconds
        
        # Audio buffer for real-time processing
        self.audio_queue = queue.Queue()
        self.is_recording = False
        
    def extract_mfcc(self, audio: np.ndarray) -> np.ndarray:
        """
        Extract MFCC features from audio signal
        Returns: (n_mfcc, time_steps) array
        """
        mfccs = librosa.feature.mfcc(
            y=audio,
            sr=self.sample_rate,
            n_mfcc=self.n_mfcc,
            n_fft=self.n_fft,
            hop_length=self.hop_length
        )
        return mfccs
    
    def extract_spectral_features(self, audio: np.ndarray) -> Dict:
        """
        Extract spectral features useful for voice analysis
        """
        # Spectral centroid (brightness)
        spectral_centroid = librosa.feature.spectral_centroid(
            y=audio, sr=self.sample_rate, n_fft=self.n_fft, hop_length=self.hop_length
        )[0]
        
        # Spectral rolloff
        spectral_rolloff = librosa.feature.spectral_rolloff(
            y=audio, sr=self.sample_rate, n_fft=self.n_fft, hop_length=self.hop_length
        )[0]
        
        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(
            audio, frame_length=self.n_fft, hop_length=self.hop_length
        )[0]
        
        # RMS energy
        rms = librosa.feature.rms(
            y=audio, frame_length=self.n_fft, hop_length=self.hop_length
        )[0]
        
        return {
            'spectral_centroid': spectral_centroid,
            'spectral_rolloff': spectral_rolloff,
            'zero_crossing_rate': zcr,
            'rms_energy': rms,
            'spectral_centroid_mean': np.mean(spectral_centroid),
            'spectral_rolloff_mean': np.mean(spectral_rolloff),
            'zcr_mean': np.mean(zcr),
            'rms_mean': np.mean(rms)
        }
    
    def detect_yawn(self, audio: np.ndarray) -> Tuple[bool, float]:
        """
        Detect yawning based on audio characteristics
        Yawns typically have:
        - Low frequency components
        - Extended duration
        - Specific energy pattern
        
        Returns: (is_yawning, confidence_score)
        """
        # Calculate spectrogram
        D = librosa.stft(audio, n_fft=self.n_fft, hop_length=self.hop_length)
        magnitude = np.abs(D)
        
        # Focus on yawn frequency range
        freqs = librosa.fft_frequencies(sr=self.sample_rate, n_fft=self.n_fft)
        freq_mask = (freqs >= self.yawn_freq_range[0]) & (freqs <= self.yawn_freq_range[1])
        yawn_band_energy = np.mean(magnitude[freq_mask, :], axis=0)
        
        # Calculate energy statistics
        mean_energy = np.mean(yawn_band_energy)
        max_energy = np.max(yawn_band_energy)
        
        # Check for sustained energy (yawns are prolonged)
        high_energy_frames = yawn_band_energy > (mean_energy * 1.5)
        sustained_duration = np.sum(high_energy_frames) * self.hop_length / self.sample_rate
        
        # Yawn detection logic
        is_yawning = (mean_energy > self.yawn_energy_threshold and 
                     sustained_duration > self.yawn_duration_threshold)
        
        # Confidence score (0-1)
        confidence = min(mean_energy / (self.yawn_energy_threshold * 3), 1.0)
        
        return is_yawning, confidence
    
    def detect_speech_pause(self, audio: np.ndarray) -> Tuple[bool, float]:
        """
        Detect prolonged speech pauses (possible sign of fatigue)
        
        Returns: (has_long_pause, pause_duration)
        """
        # Calculate RMS energy
        rms = librosa.feature.rms(y=audio, frame_length=self.n_fft, hop_length=self.hop_length)[0]
        
        # Detect silence frames
        silence_frames = rms < self.silence_threshold
        
        # Find longest continuous silence
        max_pause_duration = 0
        current_pause = 0
        
        for is_silent in silence_frames:
            if is_silent:
                current_pause += 1
            else:
                max_pause_duration = max(max_pause_duration, current_pause)
                current_pause = 0
        
        max_pause_duration = max(max_pause_duration, current_pause)
        pause_duration = max_pause_duration * self.hop_length / self.sample_rate
        
        has_long_pause = pause_duration > self.pause_duration_threshold
        
        return has_long_pause, pause_duration
    
    def calculate_voice_fatigue_score(self, audio: np.ndarray) -> float:
        """
        Calculate overall voice fatigue score based on multiple features
        
        Returns: fatigue_score (0 = alert, 1 = fatigued)
        """
        # Extract features
        spectral = self.extract_spectral_features(audio)
        is_yawning, yawn_confidence = self.detect_yawn(audio)
        has_pause, pause_duration = self.detect_speech_pause(audio)
        
        # Fatigue indicators:
        # 1. Lower spectral centroid (voice deepens when tired)
        # 2. Lower energy
        # 3. More pauses
        # 4. Yawning
        
        # Normalize features to 0-1 (fatigue indicators)
        centroid_score = 1.0 - min(spectral['spectral_centroid_mean'] / 3000, 1.0)
        energy_score = 1.0 - min(spectral['rms_mean'] / 0.1, 1.0)
        pause_score = min(pause_duration / 5.0, 1.0)
        yawn_score = yawn_confidence if is_yawning else 0.0
        
        # Weighted combination
        fatigue_score = (
            0.2 * centroid_score +
            0.2 * energy_score +
            0.3 * pause_score +
            0.3 * yawn_score
        )
        
        return np.clip(fatigue_score, 0.0, 1.0)
    
    def process_audio(self, audio: np.ndarray) -> Dict:
        """
        Main processing function - extract all audio features and detections
        
        Args:
            audio: Audio signal (1D numpy array)
        
        Returns:
            Dictionary with audio analysis results
        """
        # Ensure audio is the right length
        if len(audio) < self.frame_size:
            # Pad with zeros
            audio = np.pad(audio, (0, self.frame_size - len(audio)))
        
        # Normalize audio
        audio = audio.astype(np.float32)
        if np.max(np.abs(audio)) > 0:
            audio = audio / np.max(np.abs(audio))
        
        # Extract features
        mfcc = self.extract_mfcc(audio)
        spectral = self.extract_spectral_features(audio)
        is_yawning, yawn_confidence = self.detect_yawn(audio)
        has_long_pause, pause_duration = self.detect_speech_pause(audio)
        fatigue_score = self.calculate_voice_fatigue_score(audio)
        
        return {
            'mfcc': mfcc,
            'mfcc_mean': np.mean(mfcc, axis=1),
            'mfcc_std': np.std(mfcc, axis=1),
            'spectral_features': spectral,
            'is_yawning': is_yawning,
            'yawn_confidence': yawn_confidence,
            'has_long_pause': has_long_pause,
            'pause_duration': pause_duration,
            'voice_fatigue_score': fatigue_score
        }
    
    def start_recording(self, duration: Optional[float] = None):
        """
        Start recording audio from microphone
        
        Args:
            duration: Recording duration in seconds (None for continuous)
        """
        self.is_recording = True
        
        def record():
            p = pyaudio.PyAudio()
            stream = p.open(
                format=pyaudio.paFloat32,
                channels=1,
                rate=self.sample_rate,
                input=True,
                frames_per_buffer=self.frame_size
            )
            
            print("Recording audio...")
            
            frames_recorded = 0
            max_frames = int(duration / self.frame_duration) if duration else None
            
            while self.is_recording:
                if max_frames and frames_recorded >= max_frames:
                    break
                
                data = stream.read(self.frame_size, exception_on_overflow=False)
                audio_data = np.frombuffer(data, dtype=np.float32)
                self.audio_queue.put(audio_data)
                frames_recorded += 1
            
            stream.stop_stream()
            stream.close()
            p.terminate()
            print("Recording stopped.")
        
        # Start recording in a separate thread
        record_thread = threading.Thread(target=record, daemon=True)
        record_thread.start()
    
    def stop_recording(self):
        """Stop audio recording"""
        self.is_recording = False
    
    def get_latest_audio(self) -> Optional[np.ndarray]:
        """Get latest audio frame from recording queue"""
        try:
            return self.audio_queue.get_nowait()
        except queue.Empty:
            return None
    
    def load_audio_file(self, file_path: str) -> np.ndarray:
        """Load audio from file"""
        audio, sr = librosa.load(file_path, sr=self.sample_rate)
        return audio


if __name__ == "__main__":
    # Test the audio feature extractor
    import time
    
    extractor = AudioFeatureExtractor()
    
    print("Starting audio feature extraction demo.")
    print("Speak, yawn, or stay silent to test detection.")
    print("Recording for 10 seconds...")
    
    # Start recording
    extractor.start_recording(duration=10.0)
    
    # Process audio in real-time
    try:
        while extractor.is_recording or not extractor.audio_queue.empty():
            audio = extractor.get_latest_audio()
            if audio is not None:
                result = extractor.process_audio(audio)
                
                print(f"\nVoice Fatigue Score: {result['voice_fatigue_score']:.2f}")
                if result['is_yawning']:
                    print(f"  YAWNING DETECTED! (confidence: {result['yawn_confidence']:.2f})")
                if result['has_long_pause']:
                    print(f"  Long pause detected: {result['pause_duration']:.2f}s")
                print(f"  Energy: {result['spectral_features']['rms_mean']:.4f}")
            
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nStopping...")
        extractor.stop_recording()
    
    print("Demo complete.")
