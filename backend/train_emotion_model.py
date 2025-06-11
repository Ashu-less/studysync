import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import os
from sklearn.model_selection import train_test_split
from keras.utils import to_categorical
import tf2onnx
import pandas as pd

# Load dataset 
def load_data():
    # Load FER2013 dataset from CSV
    fer_path = "fer2013.csv"  # Make sure this file exists in your project directory
    if not os.path.exists(fer_path):
        raise FileNotFoundError("fer2013.csv not found. Download it from Kaggle and place it in the project directory.")

    data = pd.read_csv(fer_path)
    pixels = data['pixels'].tolist()
    width, height = 48, 48  

    X = np.array([np.fromstring(pixel_seq, sep=' ').reshape(width, height) for pixel_seq in pixels])
    X = np.stack([X]*3, axis=-1)  # Convert to 3 channels (grayscale to RGB)
    X = np.array([tf.image.resize(img, (64, 64)).numpy() for img in X])  # Resize to 64x64
    X = X / 255.0  # Normalize

    y = data['emotion'].values  # Labels

    print(f"Loaded FER2013 data: {X.shape[0]} samples.")
    return X, y

def build_model(input_shape, num_classes):
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),

        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),

        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.4),

        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    return model

# Example: Hyperparameter tuning with KerasTuner

def build_tuned_model(hp):
    model = models.Sequential()
    model.add(layers.Conv2D(
        hp.Int('conv1_filters', 32, 128, step=32),
        (3, 3), activation='relu', input_shape=(64, 64, 3)))
    model.add(layers.BatchNormalization())
    model.add(layers.MaxPooling2D((2, 2)))
    model.add(layers.Dropout(hp.Float('dropout1', 0.2, 0.5, step=0.1)))
    model.add(layers.Flatten())
    model.add(layers.Dense(
        hp.Int('dense_units', 64, 256, step=64), activation='relu'))
    model.add(layers.Dropout(hp.Float('dropout2', 0.2, 0.5, step=0.1)))
    model.add(layers.Dense(7, activation='softmax'))
    model.compile(
        optimizer=tf.keras.optimizers.Adam(
            hp.Choice('learning_rate', [1e-2, 1e-3, 1e-4])),
        loss='categorical_crossentropy',
        metrics=['accuracy'])
    return model

# To use:
# import keras_tuner as kt
# tuner = kt.RandomSearch(
#     build_tuned_model,
#     objective='val_accuracy',
#     max_trials=5,
#     directory='tuner_dir',
#     project_name='emotion')
# tuner.search(datagen.flow(X_train, y_train, batch_size=32),
#              epochs=10, validation_data=(X_test, y_test))
# best_model = tuner.get_best_models(1)[0]

# Train and export the model
def train_and_export_model():
    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    y_train = to_categorical(y_train, num_classes=7)
    y_test = to_categorical(y_test, num_classes=7)

    # Data augmentation
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True
    )
    datagen.fit(X_train)

    model = build_model(input_shape=(64, 64, 3), num_classes=7)
    
    model.summary()

    log_dir = "logs"
    tensorboard_callback = tf.keras.callbacks.TensorBoard(log_dir=log_dir, histogram_freq=1)
    early_stopping = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)

    # Train model with data augmentation and EarlyStopping
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=32),
        epochs=10,
        validation_data=(X_test, y_test),
        callbacks=[tensorboard_callback, early_stopping]
    )

    # Optional: Plot training history
    try:
        import matplotlib.pyplot as plt
        plt.plot(history.history['accuracy'], label='train acc')
        plt.plot(history.history['val_accuracy'], label='val acc')
        plt.xlabel('Epoch')
        plt.ylabel('Accuracy')
        plt.legend()
        plt.show()
    except ImportError:
        print("matplotlib not installed, skipping plot.")

    # Save the model in ONNX format (workaround for Keras 3.x compatibility)
    onnx_path = "models/emotion_model.onnx"
    saved_model_dir = "models/emotion_saved_model"
    model.save(saved_model_dir)  # Save as TensorFlow SavedModel

    # Convert SavedModel to ONNX
    import tf2onnx
    model_proto, _ = tf2onnx.convert.from_saved_model(
        saved_model_dir,
        opset=13,
        output_path=onnx_path
    )
    print(f"Model saved to {onnx_path}")

if __name__ == "__main__":
    os.makedirs("models", exist_ok=True)
    train_and_export_model()
