"""
Flask wrapper to expose the Driver Wellness AI pipeline to the frontend.

Endpoints:
 - GET /health -> simple health check
 - POST /predict -> accepts JSON { frame: dataURLBase64, env: { nightMode, glasses, ... } }

This file keeps the pipeline in-process (singleton) for low-latency requests.
"""

import base64
import io
import json
import os
from typing import Any

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# Import the pipeline class
from main import DriverWellnessAI


def _decode_data_url(data_url: str) -> np.ndarray:
	"""Decode a data URL (data:image/png;base64,...) into an OpenCV BGR image."""
	if data_url.startswith('data:'):
		data_url = data_url.split(',', 1)[1]
	img_bytes = base64.b64decode(data_url)
	nparr = np.frombuffer(img_bytes, np.uint8)
	img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
	return img


def _apply_env_filters(frame: np.ndarray, env: dict) -> np.ndarray:
	"""Apply simple visual filters to emulate night mode, sunglasses, cloud, etc.
	These are lightweight and meant for prototype/demo effects only.
	"""
	out = frame.copy()

	if not env:
		return out

	# Night mode: darken + add cool tint
	if env.get('nightMode'):
		# Darken
		out = cv2.convertScaleAbs(out, alpha=0.6, beta=-20)
		# Blue tint: add weight to blue channel
		b, g, r = cv2.split(out)
		b = cv2.addWeighted(b, 1.15, b, 0, 0)
		out = cv2.merge([b, g, r])

	# Glasses / sunglasses: simulate occlusion across top half of face area
	if env.get('glasses'):
		h, w = out.shape[:2]
		# Draw semi-transparent rectangle in upper middle to simulate sunglass region
		x1, y1 = int(w * 0.25), int(h * 0.22)
		x2, y2 = int(w * 0.75), int(h * 0.45)
		overlay = out.copy()
		cv2.rectangle(overlay, (x1, y1), (x2, y2), (10, 10, 10), -1)
		out = cv2.addWeighted(overlay, 0.7, out, 0.3, 0)

	# Cloud / fog: apply light gaussian blur and increased brightness variation
	if env.get('cloud'):
		out = cv2.GaussianBlur(out, (9, 9), 0)

	# Potholes / road vibration: simulate camera shake + motion blur
	if env.get('potholes'):
		h, w = out.shape[:2]
		# small vertical jitter
		M = np.float32([[1, 0, np.random.randint(-4, 5)], [0, 1, np.random.randint(-6, 7)]])
		out = cv2.warpAffine(out, M, (w, h))
		# horizontal motion blur kernel
		kernel_size = 15
		kernel = np.zeros((kernel_size, kernel_size))
		kernel[int((kernel_size - 1)/2), :] = np.ones(kernel_size)
		kernel = kernel / kernel_size
		out = cv2.filter2D(out, -1, kernel)

	return out


def _detect_night(frame: np.ndarray) -> bool:
	"""Simple luminance-based night detection."""
	gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
	mean_brightness = float(np.mean(gray))
	# threshold tuned for indoor webcam: < 60 implies low-light/night
	return mean_brightness < 60.0


def _detect_sunglasses(frame: np.ndarray, pipeline_result: dict) -> bool:
	"""Naive sunglasses detection: compare eye-region brightness to face brightness."""
	try:
		h, w = frame.shape[:2]
		feats = pipeline_result.get('features') or {}
		# prefer MediaPipe landmarks if present
		left = feats.get('left_eye')
		right = feats.get('right_eye')
		if left is None or right is None:
			return False

		# compute bounding rect around both eyes
		pts = np.vstack([np.array(left), np.array(right)])
		x1, y1 = np.clip(pts.min(axis=0) - 5, [0, 0], [w-1, h-1]).astype(int)
		x2, y2 = np.clip(pts.max(axis=0) + 5, [0, 0], [w-1, h-1]).astype(int)

		eye_region = frame[y1:y2, x1:x2]
		if eye_region.size == 0:
			return False

		eye_gray = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
		face_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
		eye_mean = float(np.mean(eye_gray))
		face_mean = float(np.mean(face_gray))

		# If eyes are substantially darker than face, likely sunglasses
		return (face_mean - eye_mean) > 25.0
	except Exception:
		return False


def _detect_steering_wheel(frame: np.ndarray) -> bool:
	"""Naive steering wheel detection using Hough circle detection in the frame center.
	This is best-effort and may fail for many scenes, but provides a useful signal for demos.
	"""
	try:
		gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
		gray = cv2.medianBlur(gray, 5)
		h, w = gray.shape[:2]
		# focus on center area where wheel would appear (center-left/right)
		cx1 = int(w * 0.2)
		cx2 = int(w * 0.8)
		cy1 = int(h * 0.2)
		cy2 = int(h * 0.8)
		roi = gray[cy1:cy2, cx1:cx2]
		if roi.size == 0:
			return False
		circles = cv2.HoughCircles(roi, cv2.HOUGH_GRADIENT, dp=1.2, minDist=100,
								   param1=100, param2=30, minRadius=30, maxRadius=200)
		return circles is not None
	except Exception:
		return False


def _compute_accel_magnitude(sensors: dict) -> float:
	try:
		a = sensors.get('acceleration') or sensors.get('accel') or {}
		x = float(a.get('x', 0.0))
		y = float(a.get('y', 0.0))
		z = float(a.get('z', 0.0))
		return float(np.sqrt(x*x + y*y + z*z))
	except Exception:
		return 0.0


def _make_serializable(obj: Any):
	"""Recursively convert common numpy / object types to JSON-serializable forms."""
	# Basic types
	if obj is None or isinstance(obj, (str, bool, int, float)):
		return obj
	if isinstance(obj, (np.floating,)):
		return float(obj)
	if isinstance(obj, (np.integer,)):
		return int(obj)
	if isinstance(obj, (list, tuple)):
		return [_make_serializable(v) for v in obj]
	if isinstance(obj, dict):
		return {k: _make_serializable(v) for k, v in obj.items()}
	# Dataclasses / simple objects
	if hasattr(obj, '__dict__'):
		try:
			return _make_serializable(vars(obj))
		except Exception:
			return str(obj)
	# Fallback
	return str(obj)


def _encode_jpeg_dataurl(img: np.ndarray, width: int = 320, height: int = 240, quality: int = 60) -> str:
    """Encode an OpenCV BGR image as a data URL JPEG (resized)."""
    try:
        h, w = img.shape[:2]
        if w != width or h != height:
            img_small = cv2.resize(img, (width, height), interpolation=cv2.INTER_AREA)
        else:
            img_small = img
        # encode to JPEG
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        success, buf = cv2.imencode('.jpg', img_small, encode_param)
        if not success:
            return ''
        b64 = base64.b64encode(buf.tobytes()).decode('ascii')
        return f'data:image/jpeg;base64,{b64}'
    except Exception:
        return ''


app = Flask(__name__)
CORS(app)

# Instantiate a single pipeline for the Flask process (no webcam) - reuses models
pipeline = DriverWellnessAI(use_webcam=False, use_audio=False, use_deep_models=False, device='cpu')


@app.route('/health', methods=['GET'])
def health():
	return jsonify({'status': 'ok'})


@app.route('/predict', methods=['POST'])
def predict():
	"""Accepts JSON { frame: dataURLBase64, env: { ... } } and returns pipeline results."""
	body = request.get_json(force=True)
	frame_data = body.get('frame')
	env = body.get('env', {})

	if not frame_data:
		return jsonify({'error': 'no frame provided'}), 400

	try:
		frame = _decode_data_url(frame_data)
	except Exception as e:
		return jsonify({'error': f'could not decode frame: {e}'}), 400

	# Compute some auto-detections from raw frame and incoming sensors
	sensors = body.get('sensors', {}) or {}
	accel_mag = _compute_accel_magnitude(sensors)
	auto_night = _detect_night(frame)

	# run an initial light steering wheel detection on the raw frame
	auto_steering_wheel = _detect_steering_wheel(frame)

	# Apply environment simulation filters (apply when toggled OR auto-detected)
	combined_env = dict(env or {})
	# If sunglasses or night are auto-detected, enable those filters
	if auto_night:
		combined_env.setdefault('nightMode', True)

	# If device acceleration indicates bumps, enable potholes overlay simulation
	if accel_mag and accel_mag > 6.0:
		combined_env.setdefault('potholes', True)

	filtered = _apply_env_filters(frame, combined_env)

	# Process via pipeline
	try:
		results = pipeline.process_frame(filtered)
	except Exception as e:
		# Log full traceback to console for debugging
		tb = traceback.format_exc()
		print("Error during pipeline.process_frame:\n", tb)
		return jsonify({'error': 'processing error', 'details': str(e)}), 500

	# Merge sensors back into response so frontend can use IMU/steering data
	# Post-process: compute auto-detections and which steering source is used
	# Try to find face/eye features in pipeline results for sunglasses detection
	pp = results.get('preprocessing') if isinstance(results, dict) else {}
	face_block = pp.get('face_eye') if isinstance(pp, dict) else pp
	auto_glasses = _detect_sunglasses(frame, face_block or {})

	# Determine if vibration/pothole was present from sensors
	vibration_detected = bool(sensors.get('vibration')) or (accel_mag > 6.0)

	# Decide steering source: prefer phone gyro when present (frontend should send 'steeringAngle')
	steering_source = 'none'
	if sensors.get('steeringAngle') is not None:
		steering_source = 'gyro'
	elif auto_steering_wheel:
		steering_source = 'vision'
	# create a preview image to send back so frontend can show visual simulation (filters/overlay)
	try:
		try:
			vis = pipeline.visualize_results(filtered, results)
		except Exception:
			vis = filtered
		preview = _encode_jpeg_dataurl(vis, width=480, height=360, quality=80)
	except Exception:
		preview = ''

	response = {
		'result': _make_serializable(results),
		'sensors': _make_serializable(sensors),
		'env': _make_serializable(env),
		'preview': preview,
		'auto_env': _make_serializable({
			'night_detected': auto_night,
			'sunglasses_detected': auto_glasses,
			'steering_wheel_detected': auto_steering_wheel,
			'vibration_detected': vibration_detected,
			'accel_magnitude': float(accel_mag)
		}),
		'steering_source': steering_source
	}

	return jsonify(response)


if __name__ == '__main__':
	# When run directly: start dev server
	port = int(os.environ.get('PORT', 5000))
	app.run(host='0.0.0.0', port=port, debug=True)

