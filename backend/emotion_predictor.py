import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import os
from typing import Dict

class EmotionPredictor:
    def __init__(self, model_path: str):
        """Initialize the emotion predictor with the trained model"""
        self.model = tf.keras.models.load_model(model_path)
        self.labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        
    def preprocess(self, img: np.ndarray) -> np.ndarray:
        """Preprocess image for emotion prediction"""
        # Convert to grayscale if needed
        if len(img.shape) == 3 and img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Resize to 48x48
        img = cv2.resize(img, (48, 48))
        
        # Normalize
        img = img.astype(np.float32) / 255.0
        
        # Add batch and channel dimensions
        img = np.expand_dims(img, axis=-1)
        img = np.expand_dims(img, axis=0)
        
        return img
    
    def predict(self, img: np.ndarray) -> Dict:
        """Predict emotion from image"""
        # Preprocess the image
        processed = self.preprocess(img)
        
        # Get prediction
        pred = self.model.predict(processed, verbose=0)
        
        # Get emotion label and confidence
        top_idx = int(np.argmax(pred[0]))
        emotion = self.labels[top_idx]
        confidence = pred[0][top_idx]
        
        return {
            "emotion": emotion,
            "confidence": float(confidence),
            "probabilities": {label: float(prob) for label, prob in zip(self.labels, pred[0])}
        }
    
    def predict_from_file(self, file_path: str) -> Dict:
        """Predict emotion from image file"""
        # Load image
        img = cv2.imread(file_path)
        if img is None:
            raise ValueError(f"Could not load image from {file_path}")
        
        return self.predict(img)
    
    def predict_from_pil(self, pil_image):
        """Predict emotion from PIL Image"""
        # Convert PIL to numpy array
        image = np.array(pil_image)
        
        # Convert RGB to BGR if needed
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        return self.predict(image)

# Example usage
if __name__ == "__main__":
    # Test the predictor
    predictor = EmotionPredictor('models/emotion_model.h5')
    print("Emotion predictor loaded successfully!")
    print(f"Available emotions: {predictor.labels}")
    
    # You can test with an image file like this:
    # result = predictor.predict_from_file('path/to/test/image.jpg')
    # print(f"Predicted emotion: {result['emotion']} (confidence: {result['confidence']:.2f})") 