from PIL import Image
import numpy as np
img = Image.open("gray_244x244.bmp").convert("L")
img = img.resize((244, 244)) 
arr = np.array(img, dtype=np.uint8)
flat = arr.flatten()
c_array = ", ".join(str(x) for x in flat)
print(f"const uint8_t image_data[244*244] = {{\n  {c_array}\n}};")

