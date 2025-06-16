import tensorflow as tf
import os
import sys

def check_gpu():
    print("Python version:", sys.version)
    print("TensorFlow version:", tf.__version__)
    print("\nGPU Information:")
    print("Num GPUs Available: ", len(tf.config.list_physical_devices('GPU')))
    print("Is built with CUDA: ", tf.test.is_built_with_cuda())
    print("Is built with cuDNN: ", tf.test.is_built_with_cudnn())
    print("GPU Device Name: ", tf.test.gpu_device_name())
    
    # List all physical devices
    print("\nAll physical devices:")
    print(tf.config.list_physical_devices())
    
    # Try to force GPU memory growth
    try:
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
            print("\nGPU memory growth enabled")
    except RuntimeError as e:
        print("\nError setting GPU memory growth:", e)
    
    # Try to create a simple model on GPU
    print("\nTesting GPU with a simple model...")
    try:
        with tf.device('/GPU:0'):
            # Create a simple model
            model = tf.keras.Sequential([
                tf.keras.layers.Dense(1000, input_shape=(1000,)),
                tf.keras.layers.Dense(1000),
                tf.keras.layers.Dense(10)
            ])
            
            # Create some random data
            x = tf.random.normal((1000, 1000))
            y = tf.random.normal((1000, 10))
            
            # Compile and train for one step
            model.compile(optimizer='adam', loss='mse')
            print("Training for one step...")
            model.fit(x, y, epochs=1, verbose=1)
            print("GPU test completed successfully!")
    except RuntimeError as e:
        print("\nError during GPU test:", e)

if __name__ == "__main__":
    # Set environment variables
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '0'  # Show all logs
    os.environ['CUDA_VISIBLE_DEVICES'] = '0'  # Use first GPU
    
    # Enable mixed precision
    tf.keras.mixed_precision.set_global_policy('mixed_float16')
    
    # Run GPU check
    check_gpu() 