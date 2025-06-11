import cv2
import numpy as np
import onnxruntime as ort

# Load face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Load ONNX emotion model with onnxruntime
emotion_onnx_path = "models/emotion_model.onnx"
emotion_session = ort.InferenceSession(emotion_onnx_path)
emotion_input_name = emotion_session.get_inputs()[0].name

def preprocess_face(face):
    # Resize to 48x48, convert to float32, scale to [0,1], and ensure 3 channels
    face_resized = cv2.resize(face, (48, 48))
    if face_resized.ndim == 2:
        face_resized = cv2.cvtColor(face_resized, cv2.COLOR_GRAY2BGR)
    face_norm = face_resized.astype(np.float32) / 255.0
    return face_norm

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
        face_input = preprocess_face(face)
        face_input = np.expand_dims(face_input, axis=0)  # Add batch dimension
        emotion_pred = emotion_session.run(
            None, {emotion_input_name: face_input.astype(np.float32)}
        )[0]
        emotions.append(int(np.argmax(emotion_pred)))  # Cast to int for JSON serializability
    
    return {"focused": len(faces) > 0, "emotions": emotions}
