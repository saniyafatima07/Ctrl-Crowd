import os
import cv2
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, applications
from sklearn.model_selection import train_test_split

CSV_FILE = "annotations_full.csv"
IMAGE_DIR = "ShanghaiTech_Crowd_Counting_Dataset/part_B_final/train_data/images"
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
df = pd.read_csv(CSV_FILE)
images = []
counts = []
for _, row in df.iterrows():
    img_path = os.path.join(IMAGE_DIR, row["image_name"])
    if not os.path.exists(img_path):
        continue
    img = cv2.imread(img_path)
    if img is None:
        continue
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = img.astype(np.float32) / 255.0
    images.append(img)
    counts.append(float(row["count"]))
X = np.array(images)
y = np.array(counts)
print(f"Loaded {len(X)} images.")
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
base_model = applications.MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet")
base_model.trainable = False
model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(1) 
])
model.compile(optimizer='adam', loss='mse', metrics=['mae'])
model.summary()
model.fit(X_train, y_train, epochs=EPOCHS, batch_size=BATCH_SIZE, validation_data=(X_val, y_val))
model.save("crowd_count_mobilenetv2.keras")
print("Model saved to crowd_count_mobilenetv2.keras")

