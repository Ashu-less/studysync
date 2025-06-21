import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['CUDA_VISIBLE_DEVICES'] = '0'
import tensorflow as tf
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import matplotlib.pyplot as plt
import pickle

# Configure GPU memory growth for TensorFlow
physical_devices = tf.config.list_physical_devices('GPU')
if physical_devices:
    tf.config.experimental.set_memory_growth(physical_devices[0], True)

def load_data(data_path):
    with open(data_path, 'rb') as f:
        data = pickle.load(f)
    return data['images'], data['labels']

def build_model():
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
        MaxPooling2D((2, 2)),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.5),
        Dense(7, activation='softmax')
    ])
    return model

def main():
    images, labels = load_data('data/emotion_data.pkl')
    images = images.astype(np.float32) / 255.0
    images = np.expand_dims(images, -1)
    split_idx = int(0.8 * len(images))
    x_train, x_val = images[:split_idx], images[split_idx:]
    y_train, y_val = labels[:split_idx], labels[split_idx:]
    train_ds = tf.data.Dataset.from_tensor_slices((x_train, y_train)).batch(32)
    val_ds = tf.data.Dataset.from_tensor_slices((x_val, y_val)).batch(32)
    model = build_model()
    model.compile(optimizer=Adam(1e-3), loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    callbacks = [
        EarlyStopping(patience=3, restore_best_weights=True),
        ModelCheckpoint('models/emotion_model.h5', save_best_only=True)
    ]
    history = model.fit(train_ds, validation_data=val_ds, epochs=20, callbacks=callbacks)
    if not os.path.exists('models'):
        os.makedirs('models')
    model.save('models/emotion_model.h5')
    plt.plot(history.history['accuracy'], label='accuracy')
    plt.plot(history.history['val_accuracy'], label='val_accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.savefig('models/training_history.png')

if __name__ == '__main__':
    main()
