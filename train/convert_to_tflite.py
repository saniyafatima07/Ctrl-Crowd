import tensorflow as tf
model = tf.keras.models.load_model("crowd_count_mobilenetv2.keras") 
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()
with open("crowd_count_mobilenetv2.tflite", "wb") as f:
    f.write(tflite_model)
print("Converted and saved TFLite model: crowd_count_model.tflite")

