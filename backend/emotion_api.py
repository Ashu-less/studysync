from flask import Flask, request, jsonify
from flask_cors import CORS
from emotion_predictor import EmotionPredictor
import base64
from io import BytesIO
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

predictor = EmotionPredictor('models/emotion_model.h5')

@app.route('/predict_emotion', methods=['POST'])
def predict_emotion():
    data = request.get_json()
    img_data = data['image']
    if img_data.startswith('data:image'):
        img_data = img_data.split(',')[1]
    img_bytes = base64.b64decode(img_data)
    img = Image.open(BytesIO(img_bytes)).convert('RGB')
    img_np = np.array(img)
    result = predictor.predict(img_np)
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': True})

@app.route('/emotions', methods=['GET'])
def get_emotions():
    """Get list of available emotions"""
    return jsonify({
        'emotions': predictor.labels
    })

if __name__ == '__main__':
    print("Starting Emotion API server...")
    print(f"Available emotions: {predictor.labels}")
    app.run(debug=True, host='0.0.0.0', port=5001) 