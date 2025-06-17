from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import numpy as np
from emotion_predictor import EmotionPredictor
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the emotion predictor
predictor = EmotionPredictor()

@app.route('/predict_emotion', methods=['POST'])
def predict_emotion():
    """API endpoint to predict emotion from image"""
    try:
        # Get image data from request
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove data URL prefix
            image_data = image_data.split(',')[1]
        
        # Convert base64 to PIL Image
        image_bytes = base64.b64decode(image_data)
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        # Predict emotion
        result = predictor.predict_from_pil(pil_image)
        
        return jsonify({
            'success': True,
            'emotion': result['emotion'],
            'confidence': result['confidence'],
            'all_probabilities': result['all_probabilities']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': True})

@app.route('/emotions', methods=['GET'])
def get_emotions():
    """Get list of available emotions"""
    return jsonify({
        'emotions': predictor.emotion_labels
    })

if __name__ == '__main__':
    print("Starting Emotion API server...")
    print(f"Available emotions: {predictor.emotion_labels}")
    app.run(debug=True, host='0.0.0.0', port=5001) 