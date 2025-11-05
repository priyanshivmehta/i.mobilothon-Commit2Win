"""
Preprocessing Module: Face & Eye Detection
Detects faces, eyes, and facial landmarks using OpenCV and MTCNN
"""

import cv2
import numpy as np
from typing import Dict, Tuple, Optional, List
import dlib

class FaceEyeDetector:
    """
    Detects faces and eyes using multiple methods:
    - OpenCV Haar Cascades (fast, reliable)
    - Dlib facial landmarks (accurate eye detection)
    """
    
    def __init__(self):
        # Load OpenCV Haar Cascades
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
        
        # Initialize dlib face detector and landmark predictor
        self.detector = dlib.get_frontal_face_detector()
        # Download shape_predictor_68_face_landmarks.dat from:
        # http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
        try:
            self.predictor = dlib.shape_predictor('models/shape_predictor_68_face_landmarks.dat')
            self.use_dlib = True
        except:
            print("Warning: Dlib landmark predictor not found. Using OpenCV only.")
            self.use_dlib = False
        
        # Eye landmark indices (dlib 68-point model)
        self.LEFT_EYE_INDICES = list(range(42, 48))
        self.RIGHT_EYE_INDICES = list(range(36, 42))
        
        # EAR threshold for drowsiness
        self.EAR_THRESHOLD = 0.25
        self.EAR_CONSEC_FRAMES = 3
        self.frame_counter = 0
        
    def detect_face(self, frame: np.ndarray) -> Optional[Tuple[int, int, int, int]]:
        """
        Detect face in frame
        Returns: (x, y, w, h) or None
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        
        if len(faces) > 0:
            # Return the largest face
            return max(faces, key=lambda f: f[2] * f[3])
        return None
    
    def detect_eyes_opencv(self, frame: np.ndarray, face_roi: Tuple[int, int, int, int]) -> List[Tuple[int, int, int, int]]:
        """
        Detect eyes using OpenCV within face ROI
        Returns: List of (x, y, w, h) for detected eyes
        """
        x, y, w, h = face_roi
        face_gray = cv2.cvtColor(frame[y:y+h, x:x+w], cv2.COLOR_BGR2GRAY)
        eyes = self.eye_cascade.detectMultiScale(face_gray, scaleFactor=1.1, minNeighbors=5)
        
        # Adjust coordinates to full frame
        return [(ex + x, ey + y, ew, eh) for (ex, ey, ew, eh) in eyes]
    
    def get_eye_aspect_ratio(self, eye_points: np.ndarray) -> float:
        """
        Calculate Eye Aspect Ratio (EAR)
        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        """
        # Vertical eye landmarks
        A = np.linalg.norm(eye_points[1] - eye_points[5])
        B = np.linalg.norm(eye_points[2] - eye_points[4])
        # Horizontal eye landmark
        C = np.linalg.norm(eye_points[0] - eye_points[3])
        
        ear = (A + B) / (2.0 * C)
        return ear
    
    def detect_landmarks_dlib(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Detect facial landmarks using dlib
        Returns: Dict with facial features and drowsiness metrics
        """
        if not self.use_dlib:
            return None
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.detector(gray, 0)
        
        if len(faces) == 0:
            return None
        
        # Use the first detected face
        face = faces[0]
        landmarks = self.predictor(gray, face)
        
        # Extract eye coordinates
        left_eye = np.array([(landmarks.part(i).x, landmarks.part(i).y) 
                             for i in self.LEFT_EYE_INDICES])
        right_eye = np.array([(landmarks.part(i).x, landmarks.part(i).y) 
                              for i in self.RIGHT_EYE_INDICES])
        
        # Calculate EAR for both eyes
        left_ear = self.get_eye_aspect_ratio(left_eye)
        right_ear = self.get_eye_aspect_ratio(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Detect drowsiness
        is_drowsy = False
        if avg_ear < self.EAR_THRESHOLD:
            self.frame_counter += 1
            if self.frame_counter >= self.EAR_CONSEC_FRAMES:
                is_drowsy = True
        else:
            self.frame_counter = 0
        
        # Extract mouth landmarks for yawn detection
        mouth_points = np.array([(landmarks.part(i).x, landmarks.part(i).y) 
                                 for i in range(48, 68)])
        
        # Calculate Mouth Aspect Ratio (MAR)
        mar = self.get_mouth_aspect_ratio(mouth_points)
        is_yawning = mar > 0.6  # Threshold for yawning
        
        return {
            'face_rect': (face.left(), face.top(), face.width(), face.height()),
            'left_eye': left_eye,
            'right_eye': right_eye,
            'left_ear': left_ear,
            'right_ear': right_ear,
            'avg_ear': avg_ear,
            'is_drowsy': is_drowsy,
            'mouth_points': mouth_points,
            'mar': mar,
            'is_yawning': is_yawning,
            'all_landmarks': landmarks
        }
    
    def get_mouth_aspect_ratio(self, mouth_points: np.ndarray) -> float:
        """
        Calculate Mouth Aspect Ratio (MAR) for yawn detection
        """
        # Vertical distances
        A = np.linalg.norm(mouth_points[2] - mouth_points[10])  # 51, 59
        B = np.linalg.norm(mouth_points[4] - mouth_points[8])   # 53, 57
        # Horizontal distance
        C = np.linalg.norm(mouth_points[0] - mouth_points[6])   # 49, 55
        
        mar = (A + B) / (2.0 * C)
        return mar
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Main processing function - detect all facial features
        Returns: Dictionary with all detected features and metrics
        """
        result = {
            'face_detected': False,
            'eyes_detected': False,
            'drowsiness_score': 0.0,  # 0 = alert, 1 = drowsy
            'yawn_detected': False,
            'features': {}
        }
        
        # Try dlib detection first (more accurate)
        if self.use_dlib:
            landmarks_data = self.detect_landmarks_dlib(frame)
            if landmarks_data:
                result['face_detected'] = True
                result['eyes_detected'] = True
                result['drowsiness_score'] = 1.0 - (landmarks_data['avg_ear'] / self.EAR_THRESHOLD)
                result['drowsiness_score'] = np.clip(result['drowsiness_score'], 0.0, 1.0)
                result['yawn_detected'] = landmarks_data['is_yawning']
                result['features'] = landmarks_data
                return result
        
        # Fallback to OpenCV detection
        face = self.detect_face(frame)
        if face is not None:
            result['face_detected'] = True
            eyes = self.detect_eyes_opencv(frame, face)
            result['eyes_detected'] = len(eyes) >= 2
            result['features']['face_rect'] = face
            result['features']['eyes'] = eyes
            
            # Simple drowsiness heuristic based on eye count
            if len(eyes) < 2:
                result['drowsiness_score'] = 0.7  # Possible eye closure
        
        return result
    
    def visualize(self, frame: np.ndarray, detection_result: Dict) -> np.ndarray:
        """
        Draw detection results on frame
        """
        vis_frame = frame.copy()
        
        if not detection_result['face_detected']:
            cv2.putText(vis_frame, "No Face Detected", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            return vis_frame
        
        features = detection_result['features']
        
        # Draw with dlib landmarks
        if 'left_eye' in features:
            # Draw eyes
            for point in features['left_eye']:
                cv2.circle(vis_frame, tuple(point), 2, (0, 255, 0), -1)
            for point in features['right_eye']:
                cv2.circle(vis_frame, tuple(point), 2, (0, 255, 0), -1)
            
            # Draw mouth
            for point in features['mouth_points']:
                cv2.circle(vis_frame, tuple(point), 2, (255, 0, 0), -1)
            
            # Display metrics
            cv2.putText(vis_frame, f"EAR: {features['avg_ear']:.2f}", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(vis_frame, f"MAR: {features['mar']:.2f}", (10, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            if detection_result['drowsiness_score'] > 0.5:
                cv2.putText(vis_frame, "DROWSY!", (10, 90),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
            
            if detection_result['yawn_detected']:
                cv2.putText(vis_frame, "YAWNING!", (10, 120),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 3)
        
        # Draw with OpenCV detection
        elif 'face_rect' in features:
            x, y, w, h = features['face_rect']
            cv2.rectangle(vis_frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            
            for (ex, ey, ew, eh) in features.get('eyes', []):
                cv2.rectangle(vis_frame, (ex, ey), (ex+ew, ey+eh), (0, 255, 0), 2)
        
        return vis_frame


if __name__ == "__main__":
    # Test the detector
    detector = FaceEyeDetector()
    cap = cv2.VideoCapture(0)
    
    print("Starting face & eye detection demo. Press 'q' to quit.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        result = detector.process_frame(frame)
        vis_frame = detector.visualize(frame, result)
        
        cv2.imshow('Face & Eye Detection', vis_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
