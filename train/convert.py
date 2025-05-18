import os
import scipy.io
from PIL import Image
import numpy as np
import csv

INPUT_IMAGES_DIR = "ShanghaiTech_Crowd_Counting_Dataset/part_A_final/train_data/images"
GROUND_TRUTH_DIR = "ShanghaiTech_Crowd_Counting_Dataset/part_A_final/train_data/ground_truth"
OUTPUT_DIR = "edge_impulse_data"
RESIZE_TO = (96, 96)
THRESHOLD = 100 
os.makedirs(OUTPUT_DIR, exist_ok=True)
low_dir = os.path.join(OUTPUT_DIR, 'low_crowd')
high_dir = os.path.join(OUTPUT_DIR, 'high_crowd')
os.makedirs(low_dir, exist_ok=True)
os.makedirs(high_dir, exist_ok=True)
manifest_path = os.path.join(OUTPUT_DIR, "manifest.csv")
with open(manifest_path, mode='w', newline='') as manifest_file:
    writer = csv.writer(manifest_file)
    writer.writerow(["image", "label"])
    for img_file in os.listdir(INPUT_IMAGES_DIR):
        if not img_file.endswith(".jpg"):
            continue
        img_path = os.path.join(INPUT_IMAGES_DIR, img_file)
        gt_path = os.path.join(GROUND_TRUTH_DIR, "GT_" + img_file.replace(".jpg", ".mat"))
        mat = scipy.io.loadmat(gt_path)
        head_count = mat["image_info"][0][0][0][0][1].shape[0]
        label = "low_crowd" if head_count <= THRESHOLD else "high_crowd"
        img = Image.open(img_path).convert('RGB')
        img = img.resize(RESIZE_TO)
        save_path = os.path.join(OUTPUT_DIR, label, img_file)
        img.save(save_path)
        writer.writerow([f"{label}/{img_file}", label])
print(f"Done. Data saved to {OUTPUT_DIR}. Ready for Edge Impulse uploader.")

