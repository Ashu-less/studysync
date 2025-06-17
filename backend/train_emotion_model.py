import tensorflow as tf
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import os

# Set environment variables for better performance
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce logging
os.environ['CUDA_VISIBLE_DEVICES'] = '0'  # Use first GPU

# Configure GPU memory growth
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        print("GPU configured successfully")
    except RuntimeError as e:
        print("Error configuring GPU:", e)
else:
    print("No GPU devices found!")

def load_fer2013():
    print("Loading dataset...")
    data = pd.read_csv('fer2013.csv')
    pixels = data['pixels'].tolist()
    width, height = 48, 48
    
    # More efficient conversion
    faces = np.array([np.fromstring(pixel_seq, sep=' ', dtype=np.uint8).reshape(width, height) for pixel_seq in pixels])
    emotions = pd.get_dummies(data['emotion']).values
    
    print(f"Loaded {len(faces)} images")
    return faces, emotions

def build_optimized_model():
    model = tf.keras.Sequential([
        # Simplified architecture for faster training
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
        tf.keras.layers.MaxPooling2D((2, 2)),
        
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D((2, 2)),
        
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(7, activation='softmax')
    ])
    
    optimizer = tf.keras.optimizers.Adam(learning_rate=0.001)
    
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_model():
    # Load and preprocess data
    faces, emotions = load_fer2013()
    faces = faces.reshape(-1, 48, 48, 1)
    faces = faces.astype('float32') / 255.0
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        faces, emotions, test_size=0.2, random_state=42
    )
    
    # Create tf.data.Dataset with smaller batch size for better performance
    train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train))
    train_dataset = train_dataset.cache()
    train_dataset = train_dataset.shuffle(1000).batch(64).prefetch(tf.data.AUTOTUNE)
    
    test_dataset = tf.data.Dataset.from_tensor_slices((X_test, y_test))
    test_dataset = test_dataset.cache()
    test_dataset = test_dataset.batch(64).prefetch(tf.data.AUTOTUNE)
    
    # Create model
    model = build_optimized_model()
    
    # Training callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=3,
            restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=2,
            min_lr=0.00001
        ),
        tf.keras.callbacks.ModelCheckpoint(
            'best_model.h5',
            monitor='val_accuracy',
            save_best_only=True
        )
    ]
    
    # Train model
    print("Starting training...")
    history = model.fit(
        train_dataset,
        epochs=20,  # Reduced epochs
        validation_data=test_dataset,
        callbacks=callbacks,
        verbose=1
    )
    
    # Save model (H5 format only for now)
    print("Saving model...")
    # Create models directory if it doesn't exist
    os.makedirs("models", exist_ok=True)
    
    # Save in H5 format (more reliable than ONNX for this TensorFlow version)
    model.save('models/emotion_model.h5')
    print("Model saved successfully in H5 format!")
    
    # Try ONNX conversion with error handling
    try:
        import tf2onnx
        input_signature = [tf.TensorSpec([1, 48, 48, 1], tf.float32, name="input")]
        onnx_model, _ = tf2onnx.convert.from_keras(model, input_signature, opset=13)
        
        # Save the ONNX model
        with open("models/emotion_model.onnx", "wb") as f:
            f.write(onnx_model.SerializeToString())
        print("ONNX model also saved successfully!")
        
    except Exception as e:
        print(f"Warning: Could not save ONNX model: {e}")
        print("Model is available in H5 format only.")
    
    return history

if __name__ == "__main__":
    history = train_model()
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Model Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.close()
