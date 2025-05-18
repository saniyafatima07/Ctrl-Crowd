# Toolchain
XTENSA_TOOLCHAIN ?= xtensa-esp32-elf
CXX = $(XTENSA_TOOLCHAIN)-g++
AR = $(XTENSA_TOOLCHAIN)-ar

# Flags
CXXFLAGS = -Os -std=c++17 -ffunction-sections -fdata-sections -fno-exceptions -fno-rtti -fstrict-volatile-bitfields -mlongcalls -nostdlib

# Include paths
INCLUDES = \
  -I.\
  -Itensorflow \
  -Itensorflow/lite \
  -Itensorflow/lite/c \
  -Itensorflow/lite/core/api \
  -Itensorflow/lite/kernels/internal \
  -Itensorflow/lite/micro \
  -Itensorflow/lite/micro/kernels \
  -Itensorflow/lite/schema \
  -Itensorflow/lite/tools/make/downloads/flatbuffers/include \
  -Isignal

# Sources
SRCS = crowd_counter.cpp image_data.cc model_data.cc

# Objects
OBJS = $(addprefix build/, $(SRCS:.cpp=.o))
OBJS := $(OBJS:.cc=.o)

# Output binary
OUT_ELF = build/crowd_counter.elf

# Default target
all: $(OUT_ELF)

# Create build directory
build:
	mkdir -p build

# Compile source files
build/%.o: %.cpp | build
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

build/%.o: %.cc | build
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Link final binary
$(OUT_ELF): $(OBJS)
	$(CXX) -nostdlib -Wl,--gc-sections -Wl,-static -Wl,-Map=build/crowd_counter.map -o $@ $(OBJS)

# Clean
clean:
	rm -rf build

.PHONY: all clean

