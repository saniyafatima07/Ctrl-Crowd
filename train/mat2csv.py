import os
import scipy.io
import numpy as np
import pandas as pd
from scipy.spatial import distance
GT_FOLDER = "ShanghaiTech_Crowd_Counting_Dataset/part_B_final/train_data/ground_truth"
OUTPUT_CSV = "annotations_full.csv"
records = []
for file in os.listdir(GT_FOLDER):
    if not file.endswith(".mat"):
        continue
    path = os.path.join(GT_FOLDER, file)
    mat = scipy.io.loadmat(path)
    points = mat["image_info"][0][0][0][0][0]
    count = len(points)
    image_name = file.replace("GT_", "").replace(".mat", ".jpg")
    if count > 1:
        dists = distance.pdist(points)
        avg_dist = np.mean(dists)
        min_dist = np.min(dists)
        max_dist = np.max(dists)
    else:
        avg_dist = min_dist = max_dist = 0.0
    locations_str = ";".join([f"{x:.2f},{y:.2f}" for x, y in points])
    records.append({
        "image_name": image_name,
        "count": count,
        "avg_dist": avg_dist,
        "min_dist": min_dist,
        "max_dist": max_dist,
        "head_locations": locations_str
    })
df = pd.DataFrame(records)
df.to_csv(OUTPUT_CSV, index=False)
print(f"Saved {len(df)} rows to {OUTPUT_CSV}")

