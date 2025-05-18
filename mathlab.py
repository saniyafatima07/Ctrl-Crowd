import pymongo
import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["crowdDB"]
collection = db["crowddatas"]  # default collection name from model

# Fetch all records
data = list(collection.find())

# Plot crowd count over time
timestamps = [d["timestamp"] for d in data]
counts = [d["crowd_count"] for d in data]
8
plt.figure(figsize=(10, 5))
plt.plot(timestamps, counts, marker='o')
plt.title("Crowd Count Over Time")
plt.xlabel("Time")
plt.ylabel("Crowd Count")
plt.grid(True)
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# Optional: Generate heatmap from one sample
if data:
    sample_csv = data[0]["heatmap_csv"]
    df = pd.read_csv(StringIO(sample_csv))
    pivot = df.pivot("y", "x", "intensity")
    plt.imshow(pivot, cmap="hot", interpolation="nearest")
    plt.title("Sample Heatmap from ESP32")
    plt.colorbar()
    plt.show()