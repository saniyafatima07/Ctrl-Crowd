import cv2
import numpy as np
import tensorflow as tf
import sys
import os
MODEL_PATH = "crowd_count_mobilenetv2.tflite"
IMG_SIZE = 224 
IMAGE_PATH = "ShanghaiTech_Crowd_Counting_Dataset/part_B_final/train_data/images/IMG_133.jpg" 
if not os.path.exists(IMAGE_PATH):
    print(f"Image not found: {IMAGE_PATH}")
    sys.exit(1)
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
img = cv2.imread(IMAGE_PATH)
img = cv2.resize(img, (IMG_SIZE, IMG_SIZE)).astype(np.float32) / 255.0
img = np.expand_dims(img, axis=0)
interpreter.set_tensor(input_details[0]['index'], img)
interpreter.invoke()
predicted_count = interpreter.get_tensor(output_details[0]['index'])[0][0]
print(f"Predicted People Count for {os.path.basename(IMAGE_PATH)}: {predicted_count:.2f}")

