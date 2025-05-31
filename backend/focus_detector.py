import cv2
import numpy as np
# uvicorn main:app --reload   -> this is ti run the FastAPI server thru a venv
# face detection model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def is_focused(image_bytes):
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
    
    # I need one face currently to consider the image focused
    return len(faces) > 0
