import tensorflow as tf
import numpy as np
model = tf.keras.models.load_model("crowd_count_mobilenetv2.keras")
def representative_data_gen():
    for _ in range(100):
        data = np.random.rand(1, 224, 224, 3).astype(np.float32)
        yield [data]
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_gen
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.uint8 
converter.inference_output_type = tf.uint8 
tflite_model = converter.convert()
with open("crowd_count_mobilenetv2_quantized.tflite", "wb") as f:
    f.write(tflite_model)
print("Quantized TFLite model saved successfully.")

