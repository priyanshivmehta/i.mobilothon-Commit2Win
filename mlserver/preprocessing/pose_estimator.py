"""
Preprocessing Module: Pose Estimation
Estimates head pose and gaze direction using MediaPipe Face Mesh
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class HeadPose:
    """Container for head pose angles"""
    pitch: float  # Nodding (up/down)
    yaw: float    # Shaking head (left/right)
    roll: float   # Tilting head (side to side)

class PoseEstimator:
    """
    Estimates driver head pose and gaze direction using MediaPipe Face Mesh
    Detects distraction based on head orientation
    """
    
    def __init__(self):
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Key facial landmarks for pose estimation
        # Nose tip, chin, left eye corner, right eye corner, left mouth, right mouth
        self.POSE_LANDMARKS = [1, 152, 33, 263, 61, 291]
        
        # 3D model points for head pose estimation
        self.model_points_3d = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye corner
            (225.0, 170.0, -135.0),      # Right eye corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ], dtype=np.float64)
        
        # Thresholds for distraction detection
        self.YAW_THRESHOLD = 25  # degrees (left/right looking)
        self.PITCH_THRESHOLD = 20  # degrees (up/down looking)
        self.DISTRACTION_FRAMES = 3
        self.distraction_counter = 0
        
    def get_2d_landmarks(self, face_landmarks, frame_shape: Tuple[int, int]) -> np.ndarray:
        """
        Extract 2D coordinates of key landmarks
        """
        h, w = frame_shape
        landmarks_2d = []
        
        for idx in self.POSE_LANDMARKS:
            landmark = face_landmarks.landmark[idx]
            x = int(landmark.x * w)
            y = int(landmark.y * h)
            landmarks_2d.append([x, y])
        
        return np.array(landmarks_2d, dtype=np.float64)
    
    def estimate_head_pose(self, face_landmarks, frame_shape: Tuple[int, int], 
                          focal_length: Optional[float] = None) -> Optional[HeadPose]:
        """
        Estimate head pose using PnP (Perspective-n-Point) algorithm
        """
        h, w = frame_shape
        
        # Get 2D landmarks
        image_points = self.get_2d_landmarks(face_landmarks, frame_shape)
        
        # Camera internals
        if focal_length is None:
            focal_length = w
        
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        # Assuming no lens distortion
        dist_coeffs = np.zeros((4, 1))
        
        # Solve PnP
        success, rotation_vector, translation_vector = cv2.solvePnP(
            self.model_points_3d,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return None
        
        # Convert rotation vector to rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        
        # Extract Euler angles
        pose_mat = cv2.hconcat((rotation_matrix, translation_vector))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)
        
        pitch, yaw, roll = euler_angles.flatten()[:3]
        
        return HeadPose(pitch=pitch, yaw=yaw, roll=roll)
    
    def calculate_gaze_score(self, head_pose: HeadPose) -> float:
        """
        Calculate gaze deviation score (0 = looking forward, 1 = highly distracted)
        """
        # Normalize angles to 0-1 based on thresholds
        yaw_score = min(abs(head_pose.yaw) / self.YAW_THRESHOLD, 1.0)
        pitch_score = min(abs(head_pose.pitch) / self.PITCH_THRESHOLD, 1.0)
        
        # Weighted combination (yaw is more important for distraction)
        gaze_score = 0.7 * yaw_score + 0.3 * pitch_score
        
        return np.clip(gaze_score, 0.0, 1.0)
    
    def detect_distraction(self, head_pose: HeadPose) -> bool:
        """
        Detect if driver is distracted based on head pose
        """
        is_distracted = (abs(head_pose.yaw) > self.YAW_THRESHOLD or 
                        abs(head_pose.pitch) > self.PITCH_THRESHOLD)
        
        if is_distracted:
            self.distraction_counter += 1
        else:
            self.distraction_counter = max(0, self.distraction_counter - 1)
        
        return self.distraction_counter >= self.DISTRACTION_FRAMES
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Main processing function - estimate pose and detect distraction
        """
        result = {
            'face_detected': False,
            'head_pose': None,
            'gaze_score': 0.0,  # 0 = looking forward, 1 = distracted
            'is_distracted': False,
            'landmarks': None
        }
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return result
        
        face_landmarks = results.multi_face_landmarks[0]
        result['face_detected'] = True
        result['landmarks'] = face_landmarks
        
        # Estimate head pose
        h, w = frame.shape[:2]
        head_pose = self.estimate_head_pose(face_landmarks, (h, w))
        
        if head_pose:
            result['head_pose'] = head_pose
            result['gaze_score'] = self.calculate_gaze_score(head_pose)
            result['is_distracted'] = self.detect_distraction(head_pose)
        
        return result
    
    def visualize(self, frame: np.ndarray, detection_result: Dict) -> np.ndarray:
        """
        Visualize pose estimation results on frame
        """
        vis_frame = frame.copy()
        h, w = vis_frame.shape[:2]
        
        if not detection_result['face_detected']:
            cv2.putText(vis_frame, "No Face Detected", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            return vis_frame
        
        # Draw face mesh
        if detection_result['landmarks']:
            mp_drawing = mp.solutions.drawing_utils
            mp_drawing_styles = mp.solutions.drawing_styles
            
            mp_drawing.draw_landmarks(
                image=vis_frame,
                landmark_list=detection_result['landmarks'],
                connections=self.mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
            )
        
        # Display head pose angles
        if detection_result['head_pose']:
            pose = detection_result['head_pose']
            y_offset = 30
            
            cv2.putText(vis_frame, f"Pitch: {pose.pitch:.1f}°", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_offset += 30
            cv2.putText(vis_frame, f"Yaw: {pose.yaw:.1f}°", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_offset += 30
            cv2.putText(vis_frame, f"Roll: {pose.roll:.1f}°", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            y_offset += 30
            
            # Display gaze score
            gaze_score = detection_result['gaze_score']
            color = (0, 255, 0) if gaze_score < 0.5 else (0, 165, 255) if gaze_score < 0.8 else (0, 0, 255)
            cv2.putText(vis_frame, f"Gaze Score: {gaze_score:.2f}", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            
            # Display distraction warning
            if detection_result['is_distracted']:
                cv2.putText(vis_frame, "DISTRACTED!", (w//2 - 100, 50),
                           cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
            
            # Draw pose axis
            self._draw_pose_axis(vis_frame, detection_result['landmarks'], pose, (h, w))
        
        return vis_frame
    
    def _draw_pose_axis(self, frame: np.ndarray, face_landmarks, head_pose: HeadPose, 
                        frame_shape: Tuple[int, int]):
        """
        Draw 3D axis showing head orientation
        """
        h, w = frame_shape
        
        # Get nose tip (landmark 1)
        nose_tip = face_landmarks.landmark[1]
        nose_2d = (int(nose_tip.x * w), int(nose_tip.y * h))
        
        # Camera matrix
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        # 3D axis points
        axis_length = 100
        axis_3d = np.float32([
            [axis_length, 0, 0],      # X-axis (red)
            [0, axis_length, 0],      # Y-axis (green)
            [0, 0, axis_length]       # Z-axis (blue)
        ])
        
        # Convert head pose to rotation vector
        pitch_rad = np.radians(head_pose.pitch)
        yaw_rad = np.radians(head_pose.yaw)
        roll_rad = np.radians(head_pose.roll)
        
        # Rotation matrix from Euler angles
        Rx = np.array([
            [1, 0, 0],
            [0, np.cos(pitch_rad), -np.sin(pitch_rad)],
            [0, np.sin(pitch_rad), np.cos(pitch_rad)]
        ])
        Ry = np.array([
            [np.cos(yaw_rad), 0, np.sin(yaw_rad)],
            [0, 1, 0],
            [-np.sin(yaw_rad), 0, np.cos(yaw_rad)]
        ])
        Rz = np.array([
            [np.cos(roll_rad), -np.sin(roll_rad), 0],
            [np.sin(roll_rad), np.cos(roll_rad), 0],
            [0, 0, 1]
        ])
        
        R = Rz @ Ry @ Rx
        rotation_vector, _ = cv2.Rodrigues(R)
        
        # Project 3D points to 2D
        dist_coeffs = np.zeros((4, 1))
        axis_2d, _ = cv2.projectPoints(axis_3d, rotation_vector, np.zeros((3, 1)),
                                       camera_matrix, dist_coeffs)
        
        # Draw axis lines
        axis_2d = axis_2d.reshape(-1, 2).astype(int)
        cv2.line(frame, nose_2d, tuple(axis_2d[0]), (0, 0, 255), 3)  # X - Red
        cv2.line(frame, nose_2d, tuple(axis_2d[1]), (0, 255, 0), 3)  # Y - Green
        cv2.line(frame, nose_2d, tuple(axis_2d[2]), (255, 0, 0), 3)  # Z - Blue


if __name__ == "__main__":
    # Test the pose estimator
    estimator = PoseEstimator()
    cap = cv2.VideoCapture(0)
    
    print("Starting pose estimation demo. Press 'q' to quit.")
    print("Turn your head left/right or up/down to test distraction detection.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        result = estimator.process_frame(frame)
        vis_frame = estimator.visualize(frame, result)
        
        cv2.imshow('Head Pose Estimation', vis_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
