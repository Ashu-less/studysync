import cv2
import numpy as np

# Load face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Load emotion detection model
emotion_model = cv2.dnn.readNetFromONNX("models/emotion_model.onnx")

def is_focused_and_emotion(image_bytes):
    # Convert bytes to numpy array then decode into an OpenCV image
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )
    
    emotions = []
    for (x, y, w, h) in faces:
        face = image[y:y+h, x:x+w]
        blob = cv2.dnn.blobFromImage(face, scalefactor=1.0, size=(64, 64), mean=(104, 117, 123))
        emotion_model.setInput(blob)
        emotion_predictions = emotion_model.forward()
        emotions.append(np.argmax(emotion_predictions))  # Example: return the index of the highest probability
    
    return {"focused": len(faces) > 0, "emotions": emotions}
