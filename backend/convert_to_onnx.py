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
    spec = (tf.TensorSpec((None, 48, 48, 1), tf.float32, name="input"),)
    
    # Convert to ONNX
    output_path = 'models/emotion_model.onnx'
    model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, output_path=output_path)
    
    print("ONNX model saved successfully at models/emotion_model.onnx!")

if __name__ == "__main__":
    convert_h5_to_onnx() 