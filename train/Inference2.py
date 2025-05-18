import tensorflow as tf
import numpy as np
import cv2
import sys
import os
MODEL_PATH = "crowd_count_model.tflite"
IMAGE_PATH = "tmp.jpg"
IMG_SIZE = 128
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
if not os.path.exists(IMAGE_PATH):
    raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")
img = cv2.imread(IMAGE_PATH)
img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
img = img.astype(np.float32) / 255.0
img = np.expand_dims(img, axis=0)
interpreter.set_tensor(input_details[0]['index'], img)
interpreter.invoke()
output = interpreter.get_tensor(output_details[0]['index'])
print("Predicted Crowd Count:", float(output[0][0]))

