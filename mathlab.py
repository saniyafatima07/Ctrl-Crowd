import os
import math
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from pymongo import MongoClient
from pathlib import Path

matplotlib.use('TkAgg')
env_path = Path(__file__).resolve().parent/".env"
load_dotenv(dotenv_path=env_path)


# Load DB link from .env
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not math:
    raise ValueError("data not found")

# Connect to MongoDB
client = MongoClient(MONGO_URI)
# Choose database and collection (replace these with your actual names)
db = client["test"]
collection = db["crowddatas"]



# try:
#     client.server_info()
#     print("Connected")
# except Exception as e:
#     print("Failed to connect ")


# Fetch all data
records = list(collection.find({}))

# Extract time and crowd values
x = [record["timestamp"] for record in records]
y = [record["crowd_count"] for record in records]

# Plot the data
plt.plot(x, y, label='Crowd', marker='o', color='blue')
plt.xlabel('Time')
plt.ylabel('Crowd Count')
plt.title('Crowd variation wrt time')
plt.grid(True)
plt.legend()
plt.savefig("output_plot.png")
print("Plot saved to output_plot.png")

