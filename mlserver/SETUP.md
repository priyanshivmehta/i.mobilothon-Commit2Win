# 🚀 Quick Setup Guide - AI Driver Wellness Assistant

## Prerequisites

- Python 3.8 or higher
- Webcam (for video monitoring)
- Microphone (optional, for audio monitoring)

## Installation Steps

### Step 1: Create Virtual Environment

```bash
# Navigate to project directory

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

### Step 2: Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt
```

**Note**: Some packages may require system dependencies:

#### For Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y python3-dev cmake
sudo apt-get install -y portaudio19-dev  # For audio
sudo apt-get install -y libopencv-dev    # For OpenCV
```

#### For macOS:
```bash
brew install cmake
brew install portaudio  # For audio
```

#### For Windows:
- Most packages have pre-built wheels
- For dlib issues, try: `pip install dlib-binary`

### Step 3: Download Optional Models (for better accuracy)

```bash
# Create models directory
mkdir -p models

# Download dlib facial landmark predictor
# Visit: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
# Extract and place in: models/shape_predictor_68_face_landmarks.dat
```

Or using wget:
```bash
cd models
wget http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
bzip2 -d shape_predictor_68_face_landmarks.dat.bz2
cd ..
```

## Quick Test

### 1. Test Demo (No Webcam Required)

```bash
python demo.py
```

This runs simulated scenarios showing the AI pipeline's capabilities.

### 2. Test Individual Modules

```bash
# Test face detection (requires webcam)
python preprocessing/face_eye_detector.py

# Test pose estimation (requires webcam)
python preprocessing/pose_estimator.py

# Test signal fusion (no hardware required)
python fusion/signal_fusion.py
```

### 3. Run Full Pipeline

```bash
# Basic run with webcam
python main.py

# Show help and options
python main.py --help
```

## Common Issues & Solutions

### Issue 1: OpenCV not detecting webcam

**Solution**:
```bash
# Test camera availability
python -c "import cv2; cap = cv2.VideoCapture(0); print('Webcam OK' if cap.isOpened() else 'No webcam')"
```

### Issue 2: Dlib installation fails

**Solution**:
```bash
# Try using conda (if you have Anaconda/Miniconda)
conda install -c conda-forge dlib

# Or skip dlib and use OpenCV-only mode
# The pipeline will automatically fallback to OpenCV
```

### Issue 3: PyTorch CUDA issues

**Solution**:
```bash
# For CPU-only (works on any system)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# For CUDA 11.8
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Issue 4: PyAudio installation fails

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install portaudio19-dev python3-pyaudio

# macOS
brew install portaudio
pip install pyaudio

# Windows: Download wheel from
# https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
pip install PyAudio‑0.2.11‑cp39‑cp39‑win_amd64.whl  # Match your Python version
```

### Issue 5: "No module named..." errors

**Solution**:
```bash
# Ensure you're in the virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

## Usage Examples

### Example 1: Basic Webcam Monitoring
```bash
python main.py
```

### Example 2: With Audio Analysis
```bash
python main.py --audio
```

### Example 3: Headless Mode (No Display)
```bash
python main.py --no-display
```

### Example 4: Save Output Video
```bash
python main.py --save-video
```

### Example 5: GPU Acceleration
```bash
python main.py --device cuda
```

### Example 6: Full Features
```bash
python main.py --audio --save-video --device cuda
```

## Understanding the Output

### Alertness Score
- **70-100**: Normal (Green) - Driver is alert
- **40-69**: Mild fatigue (Yellow) - Soft intervention
- **20-39**: Moderate fatigue (Orange) - Active alert
- **0-19**: Severe fatigue (Red) - Urgent warning

### Signal Scores (0-1 scale)
- **Drowsiness**: Eye closure, blink rate, yawning
- **Distraction**: Head pose deviation from forward
- **Voice Fatigue**: Voice characteristics, pauses, yawning sounds

### Interventions
- **Normal**: No action needed
- **Mild**: Gentle reminder to take a break
- **Moderate**: Visual + audio alert, suggest rest stop
- **Severe**: Urgent warning, assist with safe pullover

## Next Steps

1. **Customize Weights**: Edit `fusion/signal_fusion.py` to adjust signal importance
2. **Train Models**: Use your own dataset for better accuracy
3. **Integrate with Vehicle**: Connect to CAN bus or vehicle systems
4. **Add Dashboard**: Create web UI using Flask/FastAPI + React

## Support

For issues or questions:
1. Check the main README.md for detailed documentation
2. Review error messages carefully
3. Ensure all dependencies are installed
4. Test individual modules to isolate problems

## Performance Tips

1. **Use GPU**: Add `--device cuda` for faster inference
2. **Lower Resolution**: Edit video capture size in `main.py`
3. **Disable Audio**: Skip `--audio` flag if not needed
4. **Optimize Frame Rate**: Adjust processing frequency in code

---

**Ready to go!** 🎉 Run `python demo.py` to see the AI pipeline in action!
