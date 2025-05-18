# CMakeLists.txt for main component

# Register the component
idf_component_register(
    SRCS "crowd_counter.cpp" "model_data.cc" "image_data.cc"
    INCLUDE_DIRS "."
)

# Add TensorFlow Lite dependency
set(TFLITE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../components/tensorflow)
target_include_directories(${COMPONENT_LIB} PRIVATE ${TFLITE_DIR})

# Add ESP-NN dependency if available
set(ESP_NN_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../components/esp-nn)
if(EXISTS ${ESP_NN_DIR})
    target_include_directories(${COMPONENT_LIB} PRIVATE ${ESP_NN_DIR}/include)
endif()

# Set compiler flags
target_compile_options(${COMPONENT_LIB} PRIVATE -std=c++11 -O3)

# Set component dependencies
target_link_libraries(${COMPONENT_LIB} PRIVATE tensorflow-lite-micro)

