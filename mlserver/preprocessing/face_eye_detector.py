"""
Preprocessing Module: Face & Eye Detection
Detects faces, eyes, and facial landmarks using OpenCV and MTCNN
"""

import cv2
import numpy as np
from typing import Dict, Tuple, Optional, List

# Use MediaPipe Face Mesh as a dlib-free alternative for landmark detection
try:
    import mediapipe as mp
    HAS_MEDIAPIPE = True
except Exception:
    HAS_MEDIAPIPE = False


class FaceEyeDetector:
    """
    Detects faces and eyes using OpenCV Haar Cascades and MediaPipe FaceMesh.
    This avoids the heavy dlib build on Windows while still providing reliable
    landmarks for EAR/MAR calculations.
    """

    def __init__(self):
        # Load OpenCV Haar Cascades (fallback face/eye detection)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )

        # MediaPipe FaceMesh (preferred if available)
        self.use_mediapipe = HAS_MEDIAPIPE
        if self.use_mediapipe:
            self.mp_face = mp.solutions.face_mesh
            # Avoid refine_landmarks=True on Windows to prevent NORM_RECT/IMAGE_DIMENSIONS warnings
            # and potential projection errors when ROI is not square. Use a simpler mesh.
            self.face_mesh = self.mp_face.FaceMesh(static_image_mode=False,
                                                    max_num_faces=1,
                                                    refine_landmarks=False,
                                                    min_detection_confidence=0.5,
                                                    min_tracking_confidence=0.5)

        # Landmark index groups for MediaPipe FaceMesh (approximate)
        # Left eye: [33,160,158,133,153,144]
        # Right eye: [362,385,387,263,373,380]
        self.LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380]
        # Mouth landmarks (MediaPipe FaceMesh indices) - a broader set for MAR calculation
        # These indices cover outer and inner lip regions and match common FaceMesh examples
        self.MOUTH_LANDMARKS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 78, 95]

        # EAR threshold for drowsiness (tunable)
        self.EAR_THRESHOLD = 0.22
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

    def _landmarks_to_points(self, landmarks, image_w, image_h, indices):
        pts = []
        for idx in indices:
            lm = landmarks[idx]
            x = int(lm.x * image_w)
            y = int(lm.y * image_h)
            pts.append((x, y))
        return np.array(pts)
    
    def detect_landmarks_mediapipe(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Use MediaPipe FaceMesh to extract landmarks and compute EAR/MAR.
        Returns a dict similar to the previous dlib-based output.
        """
        if not self.use_mediapipe:
            return None

        try:
            h, w = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb)
        except Exception:
            # MediaPipe sometimes raises internal errors for certain frames; be defensive
            return None

        if not results or not results.multi_face_landmarks:
            return None

        lm = results.multi_face_landmarks[0].landmark

        left_eye = self._landmarks_to_points(lm, w, h, self.LEFT_EYE_LANDMARKS)
        right_eye = self._landmarks_to_points(lm, w, h, self.RIGHT_EYE_LANDMARKS)
        mouth_pts = self._landmarks_to_points(lm, w, h, self.MOUTH_LANDMARKS)

        left_ear = self.get_eye_aspect_ratio(left_eye)
        right_ear = self.get_eye_aspect_ratio(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0

        # Drowsiness heuristic
        is_drowsy = False
        if avg_ear < self.EAR_THRESHOLD:
            self.frame_counter += 1
            if self.frame_counter >= self.EAR_CONSEC_FRAMES:
                is_drowsy = True
        else:
            self.frame_counter = 0

        mar = self.get_mouth_aspect_ratio(mouth_pts)
        is_yawning = mar > 0.6

        # Approximate face bounding box from landmarks (min/max)
        xs = [int(p.x * w) for p in lm]
        ys = [int(p.y * h) for p in lm]
        x_min, x_max = min(xs), max(xs)
        y_min, y_max = min(ys), max(ys)

        return {
            'face_rect': (x_min, y_min, x_max - x_min, y_max - y_min),
            'left_eye': left_eye,
            'right_eye': right_eye,
            'left_ear': left_ear,
            'right_ear': right_ear,
            'avg_ear': avg_ear,
            'is_drowsy': is_drowsy,
            'mouth_points': mouth_pts,
            'mar': mar,
            'is_yawning': is_yawning,
            'all_landmarks': lm
        }
    
    def get_mouth_aspect_ratio(self, mouth_points: np.ndarray) -> float:
        """
        Calculate Mouth Aspect Ratio (MAR) for yawn detection
        """
        try:
            pts = np.array(mouth_points, dtype=float)
            if pts.ndim != 2 or pts.shape[0] < 3:
                return 0.0

            # If we have a rich set of mouth points (MediaPipe outer+inner), try index-based MAR
            if pts.shape[0] >= 11:
                try:
                    A = np.linalg.norm(pts[2] - pts[10])
                    B = np.linalg.norm(pts[4] - pts[8])
                    C = np.linalg.norm(pts[0] - pts[6])
                    mar = (A + B) / (2.0 * (C + 1e-6))
                    return float(mar)
                except Exception:
                    # fall through to span-based computation
                    pass

            # Robust fallback: use percentile-based vertical span and horizontal span
            ys = pts[:, 1]
            xs = pts[:, 0]
            top_y = float(np.percentile(ys, 25))
            bot_y = float(np.percentile(ys, 75))
            left_x = float(np.min(xs))
            right_x = float(np.max(xs))
            v_span = max(0.0, bot_y - top_y)
            h_span = max(1e-6, right_x - left_x)
            return float(v_span / h_span)
        except Exception:
            return 0.0
    
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
        
        # Prefer MediaPipe landmarks when available
        if self.use_mediapipe:
            landmarks_data = self.detect_landmarks_mediapipe(frame)
            if landmarks_data:
                result['face_detected'] = True
                result['eyes_detected'] = True
                # Map avg_ear into a 0..1 drowsiness score (clamped)
                result['drowsiness_score'] = 1.0 - (landmarks_data['avg_ear'] / max(self.EAR_THRESHOLD, 1e-6))
                result['drowsiness_score'] = float(np.clip(result['drowsiness_score'], 0.0, 1.0))
                result['yawn_detected'] = bool(landmarks_data['is_yawning'])
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
