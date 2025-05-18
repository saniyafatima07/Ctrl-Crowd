import os
import math
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from pymongo import MongoClient

# Load DB link from .env
load_dotenv()
math = os.getenv("math")

if not math:
    raise ValueError("data not found")

# Connect to MongoDB
client = MongoClient('mongodb+srv://saniyafatima07:JlekzM1AbWqHVywz@backupifydb.zb6y0le.mongodb.net')

# Choose database and collection (replace these with your actual names)
db = client["test"]
collection = db["crowddatas"]

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
plt.show()
