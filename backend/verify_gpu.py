import tensorflow as tf
import os

# Print TensorFlow and CUDA info
print("TensorFlow version:", tf.__version__)
print("CUDA available:", tf.test.is_built_with_cuda())
print("GPU available:", tf.test.is_gpu_available())

# List physical devices
print("\nPhysical devices:")
print(tf.config.list_physical_devices())

# Try to create a simple model on GPU
try:
    with tf.device('/GPU:0'):
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(100, input_shape=(100,))
        ])
        print("\nSuccessfully created model on GPU")
except RuntimeError as e:
    print("\nError creating model on GPU:", e) 