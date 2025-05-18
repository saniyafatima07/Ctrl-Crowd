import os
import cv2
import numpy as np
import pandas as pd
import tensorflow as tf
IMAGE_DIR = "ShanghaiTech_Crowd_Counting_Dataset/part_B_final/test_data/images" 
CSV_FILE = "annotations_full.csv"
MODEL_PATH = "crowd_count_mobilenetv2.tflite"
IMG_SIZE = 224 

df = pd.read_csv(CSV_FILE)
print("Loaded annotations:", df.shape)
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
y_true = []
y_pred = []
for _, row in df.iterrows():
    img_name = row["image_name"]
    true_count = float(row["count"])
    img_path = os.path.join(IMAGE_DIR, img_name)
    if not os.path.exists(img_path):
        print(f"Missing: {img_path}")
        continue
    img = cv2.imread(img_path)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE)).astype(np.float32) / 255.0
    img = np.expand_dims(img, axis=0)
    interpreter.set_tensor(input_details[0]['index'], img)
    interpreter.invoke()
    prediction = interpreter.get_tensor(output_details[0]['index'])[0][0]
    y_true.append(true_count)
    y_pred.append(prediction)
    print(f"{img_name}: True={true_count}, Predicted={prediction:.2f}")

y_true = np.array(y_true)
y_pred = np.array(y_pred)
mae = np.mean(np.abs(y_true - y_pred))
print(f"\nMean Absolute Error (MAE): {mae:.2f}")

