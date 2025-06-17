import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import os

class EmotionPredictor:
    def __init__(self, model_path='models/emotion_model.h5'):
        """Initialize the emotion predictor with the trained model"""
        self.model = tf.keras.models.load_model(model_path)
        self.emotion_labels = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
        
    def preprocess_image(self, image):
        """Preprocess image for emotion prediction"""
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Resize to 48x48
        image = cv2.resize(image, (48, 48))
        
        # Normalize
        image = image.astype('float32') / 255.0
        
        # Add batch and channel dimensions
        image = np.expand_dims(image, axis=[0, -1])
        
        return image
    
    def predict_emotion(self, image):
        """Predict emotion from image"""
        # Preprocess the image
        processed_image = self.preprocess_image(image)
        
        # Get prediction
        prediction = self.model.predict(processed_image, verbose=0)
        
        # Get emotion label and confidence
        emotion_idx = np.argmax(prediction[0])
        confidence = prediction[0][emotion_idx]
        emotion = self.emotion_labels[emotion_idx]
        
        return {
            'emotion': emotion,
            'confidence': float(confidence),
            'all_probabilities': {label: float(prob) for label, prob in zip(self.emotion_labels, prediction[0])}
        }
    
    def predict_from_file(self, image_path):
        """Predict emotion from image file"""
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        return self.predict_emotion(image)
    
    def predict_from_pil(self, pil_image):
        """Predict emotion from PIL Image"""
        # Convert PIL to numpy array
        image = np.array(pil_image)
        
        # Convert RGB to BGR if needed
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        return self.predict_emotion(image)

# Example usage
if __name__ == "__main__":
    # Test the predictor
    predictor = EmotionPredictor()
    print("Emotion predictor loaded successfully!")
    print(f"Available emotions: {predictor.emotion_labels}")
    
    # You can test with an image file like this:
    # result = predictor.predict_from_file('path/to/test/image.jpg')
    # print(f"Predicted emotion: {result['emotion']} (confidence: {result['confidence']:.2f})") 