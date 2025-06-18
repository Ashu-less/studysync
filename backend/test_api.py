import requests
import json
import base64
from PIL import Image
import numpy as np
import io

def test_emotion_api():
    """Test the emotion prediction API"""
    base_url = "http://localhost:5001"
    
    # Test health check
    print("Testing health check...")
    response = requests.get(f"{base_url}/health")
    print(f"Health check: {response.json()}")
    
    # Test get emotions
    print("\nTesting get emotions...")
    response = requests.get(f"{base_url}/emotions")
    print(f"Available emotions: {response.json()}")
    
    # Create a simple test image (48x48 grayscale)
    print("\nCreating test image...")
    test_image = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    pil_image = Image.fromarray(test_image)
    
    # Convert to base64
    buffer = io.BytesIO()
    pil_image.save(buffer, format='PNG')
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Test emotion prediction
    print("Testing emotion prediction...")
    payload = {
        'image': f"data:image/png;base64,{image_base64}"
    }
    
    response = requests.post(f"{base_url}/predict_emotion", json=payload)
    result = response.json()
    
    print(f"Prediction result: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    print("Testing Emotion API...")
    test_emotion_api() 