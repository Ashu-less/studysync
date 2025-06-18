# Emotion Detection for StudySync

This directory contains the trained emotion recognition model and API for the StudySync application.

## Files Overview

- `train_emotion_model.py` - Script to train the emotion recognition model
- `emotion_predictor.py` - Class to load and use the trained model
- `emotion_api.py` - Flask API server for emotion prediction
- `models/emotion_model.h5` - Trained model file (H5 format)
- `test_api.py` - Test script for the API

## Model Performance

- **Training Accuracy**: ~67%
- **Validation Accuracy**: ~56%
- **Model Size**: ~2.2MB
- **Inference Speed**: ~8 seconds per epoch during training, much faster for single predictions

## Available Emotions

The model can detect 7 emotions:
1. **angry** - Useful for detecting frustration during study sessions
2. **disgust** - Rare emotion in study contexts
3. **fear** - Can indicate anxiety about exams or assignments
4. **happy** - Positive engagement with material
5. **sad** - Indicates disengagement or difficulty
6. **surprise** - Unexpected learning moments
7. **neutral** - Focused/concentrated state (ideal for studying)

## Usage in StudySync

### 1. Start the API Server

```bash
cd backend
python emotion_api.py
```

The server will run on `http://localhost:5001`

### 2. API Endpoints

#### Health Check
```bash
GET http://localhost:5001/health
```

#### Get Available Emotions
```bash
GET http://localhost:5001/emotions
```

#### Predict Emotion
```bash
POST http://localhost:5001/predict_emotion
Content-Type: application/json

{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### 3. Integration with Frontend

In your React/JavaScript frontend:

```javascript
// Capture image from webcam
const canvas = document.getElementById('canvas');
const imageData = canvas.toDataURL('image/png');

// Send to API
const response = await fetch('http://localhost:5001/predict_emotion', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image: imageData
  })
});

const result = await response.json();
console.log(`Detected emotion: ${result.emotion} (confidence: ${result.confidence})`);
```

### 4. StudySync Use Cases

1. **Focus Monitoring**: Detect when user is neutral (focused) vs distracted
2. **Frustration Detection**: Alert when user shows angry/sad emotions
3. **Engagement Tracking**: Monitor happy/surprised emotions for positive learning
4. **Study Session Analysis**: Track emotional patterns over time
5. **Break Reminders**: Suggest breaks when frustration is detected

## Testing

Run the test script to verify everything works:

```bash
python test_api.py
```

## Model Details

- **Architecture**: Simplified CNN (3 conv layers + dense layers)
- **Input**: 48x48 grayscale images
- **Output**: 7-class probability distribution
- **Training Data**: FER2013 dataset
- **Optimization**: Reduced batch size (64) for faster training

## Performance Notes

- The model achieves ~67% training accuracy, which is good for a lightweight model
- For StudySync purposes, even 60% accuracy provides valuable insights
- The model is optimized for speed over perfect accuracy
- Consider the confidence score when making decisions based on predictions

## Future Improvements

1. **Data Augmentation**: Add more training data with study-specific contexts
2. **Transfer Learning**: Use pre-trained models for better accuracy
3. **Real-time Processing**: Optimize for webcam streaming
4. **Custom Training**: Collect StudySync-specific emotion data
5. **Multi-modal**: Combine with other sensors (heart rate, etc.) 