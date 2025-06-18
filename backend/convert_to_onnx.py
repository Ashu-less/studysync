import tensorflow as tf
import tf2onnx
import os

def convert_h5_to_onnx():
    """Convert the H5 emotion model to ONNX format"""
    print("Loading H5 model...")
    
    # Load the TensorFlow model
    model = tf.keras.models.load_model('models/emotion_model.h5')
    
    print("Converting to ONNX...")
    
    # Define input signature for ONNX conversion
    input_signature = [tf.TensorSpec([1, 48, 48, 1], tf.float32, name="input")]
    
    # Convert to ONNX
    onnx_model, _ = tf2onnx.convert.from_keras(model, input_signature, opset=13)
    
    # Save the ONNX model
    with open("models/emotion_model.onnx", "wb") as f:
        f.write(onnx_model.SerializeToString())
    
    print("ONNX model saved successfully at models/emotion_model.onnx!")

if __name__ == "__main__":
    convert_h5_to_onnx() 