from flask import Flask, jsonify
import cv2
import numpy as np
import tensorflow as tf
import urllib.request
import threading
import time
from datetime import datetime
from collections import deque

MODEL_PATH = "../weights/mobilenetv2/accurate.tflite"
IMG_URL = "http://<IP_ADDR>/800x600.jpg"
IMG_SIZE = 224
FETCH_INTERVAL = 1
MAX_HISTORY = 50
app = Flask(__name__)
latest_count = {'value': 0.0}
history = deque(maxlen=MAX_HISTORY)
interpreter = tf.lite.Interpreter(model_path=MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
def fetch_and_predict():
    global latest_count, history
    while True:
        try:
            resp = urllib.request.urlopen(IMG_URL, timeout=5)
            image_data = np.asarray(bytearray(resp.read()), dtype=np.uint8)
            img = cv2.imdecode(image_data, cv2.IMREAD_COLOR)
            if img is not None:
                img_resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE)).astype(np.float32) / 255.0
                input_img = np.expand_dims(img_resized, axis=0)
                interpreter.set_tensor(input_details[0]['index'], input_img)
                interpreter.invoke()
                predicted = float(interpreter.get_tensor(output_details[0]['index'])[0][0])
                latest_count['value'] = predicted
                history.appendleft({
                    "timestamp": datetime.now().isoformat(),
                    "crowd_count": round(predicted, 2)
                })
                print(f"[INFO] Count: {predicted:.2f} at {datetime.now().strftime('%H:%M:%S')}")
            else:
                print("[WARN] Image fetch failed or returned None")
        except Exception as e:
            print(f"[ERROR] {e}")
        time.sleep(FETCH_INTERVAL)
@app.route('/get_crowd', methods=['GET'])
def get_crowd():
    return jsonify({
        'crowd_count': round(latest_count['value'], 2)
    })
@app.route('/get_crowd_history/<int:n>', methods=['GET'])
def get_crowd_history(n):
    n = min(n, MAX_HISTORY)
    return jsonify(list(history)[:n])
threading.Thread(target=fetch_and_predict, daemon=True).start()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4040)


