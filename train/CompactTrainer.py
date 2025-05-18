import os
import cv2
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.model_selection import train_test_split
import time

CSV_FILE = "annotations_full.csv"
IMAGE_DIR = "ShanghaiTech_Crowd_Counting_Dataset(1)/part_B_final/train_data/images"
IMG_SIZE = 160
BATCH_SIZE = 32
EPOCHS = 100
def load_data(csv_file, image_dir, img_size):
    df = pd.read_csv(csv_file)
    images = []
    counts = []
    print(f"Loading data from {csv_file} and {image_dir}")
    for index, row in df.iterrows():
        img_path = os.path.join(image_dir, row["image_name"])
        if not os.path.exists(img_path):
            continue
        img = cv2.imread(img_path)
        if img is None:
            continue
        img = cv2.resize(img, (img_size, img_size))
        img = img.astype(np.float32) / 255.0
        images.append(img)
        counts.append(float(row["count"]))
    X = np.array(images)
    y = np.array(counts)
    print(f"Loaded {len(X)} images and counts.")
    return X, y
def create_compact_cnn_model(input_shape):
    model = models.Sequential([
        layers.Conv2D(16, (3, 3), activation='relu', padding='same', input_shape=input_shape),
        layers.MaxPooling2D((2, 2)),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(1)
    ])
    return model
if __name__ == "__main__":
    X, y = load_data(CSV_FILE, IMAGE_DIR, IMG_SIZE)
    if len(X) == 0:
        print("No data loaded. Please check CSV_FILE and IMAGE_DIR paths.")
        exit()
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Training samples: {len(X_train)}, Validation samples: {len(X_val)}")
    model = create_compact_cnn_model(input_shape=(IMG_SIZE, IMG_SIZE, 3))
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), 
                  loss='mse', 
                  metrics=['mae'])
    model.summary()
    keras_model_path = 'best_super_compact_model.keras'
    model_checkpoint_callback = ModelCheckpoint(
        filepath=keras_model_path,
        save_weights_only=False,
        monitor='val_mae',
        mode='min',
        save_best_only=True,
        verbose=1)
    early_stopping_callback = EarlyStopping(
        monitor='val_mae',
        patience=15,
        mode='min',
        verbose=1,
        restore_best_weights=True)
    print("\nStarting model training...")
    start_time = time.time()
    history = model.fit(X_train, y_train, 
                        epochs=EPOCHS, 
                        batch_size=BATCH_SIZE, 
                        validation_data=(X_val, y_val),
                        callbacks=[model_checkpoint_callback, early_stopping_callback])
    training_time = time.time() - start_time
    print(f"Training finished in {training_time:.2f} seconds.")
    print(f"Loading best model from {keras_model_path} for quantization...")
    best_model = models.load_model(keras_model_path)
    print("\nStarting TFLite conversion and quantization...")
    converter = tf.lite.TFLiteConverter.from_keras_model(best_model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    def representative_dataset_gen():
        num_calibration_samples = min(100, len(X_train))
        for i in range(num_calibration_samples):
            yield [X_train[i:i+1].astype(np.float32)]
    converter.representative_dataset = representative_dataset_gen
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
    converter.inference_input_type = tf.int8
    converter.inference_output_type = tf.int8
    tflite_quant_model = converter.convert()
    tflite_model_filename = "super_compact_crowd_model_quantized.tflite"
    with open(tflite_model_filename, 'wb') as f:
        f.write(tflite_quant_model)
    print(f"Quantized TFLite model saved to {tflite_model_filename}")
    model_size_bytes = os.path.getsize(tflite_model_filename)
    model_size_kb = model_size_bytes / 1024
    print(f"Quantized TFLite model size: {model_size_kb:.2f} KB ({model_size_bytes} bytes)")
    if model_size_kb <= 300:
        print(f"SUCCESS: Model size ({model_size_kb:.2f} KB) is within the 300KB target.")
    else:
        print(f"WARNING: Model size ({model_size_kb:.2f} KB) exceeds the 300KB target.")
    print("\nScript finished.")

