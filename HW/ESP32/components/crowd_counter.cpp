#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/schema/schema_generated.h"
#include "tensorflow/lite/c/common.h"
#include "tensorflow/lite/micro/micro_log.h"
#include "model_data.h"
#include "image_data.h"

#define IMAGE_WIDTH 244
#define IMAGE_HEIGHT 244
#define NUM_CHANNELS 1

#define TFLITE_MINIMAL_CHECK(x)                              \
  if (!(x)) {                                                \
    fprintf(stderr, "Error at line %d\n", __LINE__);         \
    return 1;                                                \
  }
int main(int argc, char* argv[]) {
  printf("ESP32 Crowd Counter\n");
  printf("Loading model...\n");
  const tflite::Model* model = tflite::GetModel(crowd_count_mobilenetv2_quantized_tflite);
  if (model->version() != TFLITE_SCHEMA_VERSION) {
    fprintf(stderr, "Model provided is schema version %d not equal to supported version %d\n",
            model->version(), TFLITE_SCHEMA_VERSION);
    return 1;
  }
  printf("Model version: %d\n", model->version());
  constexpr int kTensorArenaSize = 800 * 1024;
  uint8_t* tensor_arena = (uint8_t*)malloc(kTensorArenaSize);
  if (!tensor_arena) {
    fprintf(stderr, "Failed to allocate tensor arena memory\n");
    return 1;
  }
  static tflite::MicroMutableOpResolver<10> resolver;
  resolver.AddAveragePool2D();
  resolver.AddConv2D();
  resolver.AddDepthwiseConv2D();
  resolver.AddReshape();
  resolver.AddFullyConnected();
  resolver.AddAdd();
  resolver.AddMul();
  resolver.AddRelu();
  resolver.AddRelu6();
  resolver.AddSoftmax();
  printf("Operations added to resolver\n");
  static tflite::MicroInterpreter interpreter(
      model, resolver, tensor_arena, kTensorArenaSize);
  printf("Allocating tensors...\n");
  TfLiteStatus allocate_status = interpreter.AllocateTensors();
  if (allocate_status != kTfLiteOk) {
    fprintf(stderr, "AllocateTensors() failed\n");
    free(tensor_arena);
    return 1;
  }
  TfLiteTensor* input_tensor = interpreter.input(0);
  TfLiteTensor* output_tensor = interpreter.output(0);
  printf("Input tensor information:\n");
  printf("- Dims: ");
  for (int i = 0; i < input_tensor->dims->size; i++) {
    printf("%d", input_tensor->dims->data[i]);
    if (i < input_tensor->dims->size - 1) printf("x");
  }
  printf("\n");
  printf("- Type: %d\n", input_tensor->type);
  bool dims_match = (input_tensor->dims->size == 4 &&
                     input_tensor->dims->data[0] == 1 &&
                     input_tensor->dims->data[1] == IMAGE_HEIGHT &&
                     input_tensor->dims->data[2] == IMAGE_WIDTH &&
                     input_tensor->dims->data[3] == NUM_CHANNELS);
                     
  if (!dims_match) {
    fprintf(stderr, "Input tensor dimensions don't match expected values\n");
    fprintf(stderr, "Expected: [1, %d, %d, %d]\n", IMAGE_HEIGHT, IMAGE_WIDTH, NUM_CHANNELS);
    free(tensor_arena);
    return 1;
  }
  printf("Output tensor information:\n");
  printf("- Dims: ");
  for (int i = 0; i < output_tensor->dims->size; i++) {
    printf("%d", output_tensor->dims->data[i]);
    if (i < output_tensor->dims->size - 1) printf("x");
  }
  printf("\n");
  printf("- Type: %d\n", output_tensor->type);
  printf("Copying image data to input tensor...\n");
  if (input_tensor->type == kTfLiteUInt8) {
    uint8_t* input_data = input_tensor->data.uint8;
    for (int i = 0; i < IMAGE_WIDTH * IMAGE_HEIGHT; i++) {
      input_data[i] = image_data[i];
    }
  } else if (input_tensor->type == kTfLiteFloat32) {
    float* input_data = input_tensor->data.f;
    for (int i = 0; i < IMAGE_WIDTH * IMAGE_HEIGHT; i++) {
      input_data[i] = static_cast<float>(image_data[i]) / 255.0f;
    }
  } else {
    fprintf(stderr, "Unsupported input tensor type: %d\n", input_tensor->type);
    free(tensor_arena);
    return 1;
  }
  printf("Running inference...\n");
  TfLiteStatus invoke_status = interpreter.Invoke();
  if (invoke_status != kTfLiteOk) {
    fprintf(stderr, "Invoke failed!\n");
    free(tensor_arena);
    return 1;
  }
  printf("Inference completed\n");
  float crowd_count = 0.0;
  if (output_tensor->type == kTfLiteFloat32) {
    printf("Processing floating point output\n");
    float* output_data = output_tensor->data.f;
    int output_size = 1;
    for (int i = 0; i < output_tensor->dims->size; i++) {
      output_size *= output_tensor->dims->data[i];
    }
    for (int i = 0; i < output_size; i++) {
      crowd_count += output_data[i];
    }
  } 
  else if (output_tensor->type == kTfLiteUInt8) {
    printf("Processing quantized uint8 output\n");
    uint8_t* output_data = output_tensor->data.uint8;
    
    int output_size = 1;
    for (int i = 0; i < output_tensor->dims->size; i++) {
      output_size *= output_tensor->dims->data[i];
    }
    
    float scale = output_tensor->params.scale;
    int zero_point = output_tensor->params.zero_point;
    
    printf("Scale: %f, Zero point: %d\n", scale, zero_point);
    
    for (int i = 0; i < output_size; i++) {
      crowd_count += (output_data[i] - zero_point) * scale;
    }
  }
  else if (output_tensor->type == kTfLiteInt8) {
    printf("Processing quantized int8 output\n");
    int8_t* output_data = output_tensor->data.int8;
    
    int output_size = 1;
    for (int i = 0; i < output_tensor->dims->size; i++) {
      output_size *= output_tensor->dims->data[i];
    }
    
    float scale = output_tensor->params.scale;
    int zero_point = output_tensor->params.zero_point;
    
    printf("Scale: %f, Zero point: %d\n", scale, zero_point);
    
    for (int i = 0; i < output_size; i++) {
      crowd_count += (output_data[i] - zero_point) * scale;
    }
  }
  else {
    fprintf(stderr, "Unsupported output tensor type: %d\n", output_tensor->type);
    free(tensor_arena);
    return 1;
  }
  int people_count = round(crowd_count);
  printf("\n----- RESULTS -----\n");
  printf("Estimated crowd count: %f (rounded to %d people)\n", crowd_count, people_count);
  printf("------------------\n");
  free(tensor_arena);
  return 0;
}

