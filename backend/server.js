const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowd_estimation', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const crowdDataSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        required: true
    },
    densityLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Very High'],
        required: true
    },
    deviceId: {
        type: String,
        required: true
    },
    coordinates: {
        x: Number,
        y: Number
    },
    // Additional metadata from the ESP32
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
});

// Create model from schema
const CrowdData = mongoose.model('CrowdData', crowdDataSchema);


app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// ESP32 data submission endpoint
app.post('/api/crowd-data', async (req, res) => {
    try {
        // Calculate density level based on count
        // This logic can be adjusted based on your specific requirements
        const count = req.body.count;
        let densityLevel;
        
        if (count < 50) {
            densityLevel = 'Low';
        } else if (count < 100) {
            densityLevel = 'Medium';
        } else if (count < 150) {
            densityLevel = 'High';
        } else {
            densityLevel = 'Very High';
        }
        
        // Create new crowd data entry
        const crowdData = new CrowdData({
            timestamp: new Date(),
            location: req.body.location,
            count: count,
            densityLevel: densityLevel,
            deviceId: req.body.deviceId,
            coordinates: req.body.coordinates,
            metadata: req.body.metadata
        });
        
        // Save to database
        await crowdData.save();
        
        res.status(201).json({
            success: true,
            message: 'Crowd data saved successfully',
            data: crowdData
        });
    } catch (error) {
        console.error('Error saving crowd data:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving crowd data',
            error: error.message
        });
    }
});

// Get all crowd data
app.get('/api/crowd-data', async (req, res) => {
    try {
        // Parse query parameters for filtering
        const { startDate, endDate, location, deviceId } = req.query;
        
        // Build query object
        const query = {};
        
        // Add date range filter if provided
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                query.timestamp.$lte = new Date(endDate);
            }
        }
        
        // Add location filter if provided
        if (location) {
            query.location = location;
        }
        
        // Add device filter if provided
        if (deviceId) {
            query.deviceId = deviceId;
        }
        
        // Execute query
        const crowdData = await CrowdData.find(query).sort({ timestamp: -1 });
        
        res.status(200).json({
            success: true,
            count: crowdData.length,
            data: crowdData
        });
    } catch (error) {
        console.error('Error fetching crowd data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching crowd data',
            error: error.message
        });
    }
});

// Get latest crowd data
app.get('/api/crowd-data/latest', async (req, res) => {
    try {
        const latestData = await CrowdData.find()
            .sort({ timestamp: -1 })
            .limit(1);
            
        if (latestData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No crowd data found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: latestData[0]
        });
    } catch (error) {
        console.error('Error fetching latest crowd data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching latest crowd data',
            error: error.message
        });
    }
});

// Get crowd data aggregated by time
app.get('/api/crowd-data/aggregate/time', async (req, res) => {
    try {
        const { interval, startDate, endDate, location } = req.query;
        
        // Validate interval
        const validIntervals = ['hour', 'day', 'week', 'month'];
        if (!validIntervals.includes(interval)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid interval. Must be one of: hour, day, week, month'
            });
        }
        
        // Build date filter
        const dateFilter = {};
        if (startDate) {
            dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.$lte = new Date(endDate);
        }
        
        // Build match stage
        const matchStage = {};
        if (Object.keys(dateFilter).length > 0) {
            matchStage.timestamp = dateFilter;
        }
        if (location) {
            matchStage.location = location;
        }
        
        // Define group by interval
        let groupByTime;
        switch (interval) {
            case 'hour':
                groupByTime = {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                    day: { $dayOfMonth: '$timestamp' },
                    hour: { $hour: '$timestamp' }
                };
                break;
            case 'day':
                groupByTime = {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' },
                    day: { $dayOfMonth: '$timestamp' }
                };
                break;
            case 'week':
                groupByTime = {
                    year: { $year: '$timestamp' },
                    week: { $week: '$timestamp' }
                };
                break;
            case 'month':
                groupByTime = {
                    year: { $year: '$timestamp' },
                    month: { $month: '$timestamp' }
                };
                break;
        }
        
        // Execute aggregation pipeline
        const aggregatedData = await CrowdData.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: groupByTime,
                    averageCount: { $avg: '$count' },
                    maxCount: { $max: '$count' },
                    minCount: { $min: '$count' },
                    totalCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
        ]);
        
        res.status(200).json({
            success: true,
            count: aggregatedData.length,
            data: aggregatedData
        });
    } catch (error) {
        console.error('Error aggregating crowd data:', error);
        res.status(500).json({
            success: false,
            message: 'Error aggregating crowd data',
            error: error.message
        });
    }
});

// Get heatmap data
app.get('/api/crowd-data/heatmap', async (req, res) => {
    try {
        const { location, timeframe } = req.query;
        
        // Define the time range based on timeframe parameter
        let startTime;
        const endTime = new Date();
        
        switch (timeframe) {
            case 'hour':
                startTime = new Date(endTime - 60 * 60 * 1000);
                break;
            case 'day':
                startTime = new Date(endTime - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                startTime = new Date(endTime - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startTime = new Date(endTime - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = new Date(endTime - 24 * 60 * 60 * 1000); // Default to 1 day
        }
        
        // Build query
        const query = {
            timestamp: { $gte: startTime, $lte: endTime }
        };
        
        if (location) {
            query.location = location;
        }
        
        // Get data with coordinates
        const heatmapData = await CrowdData.find(query, 'coordinates count timestamp')
            .sort({ timestamp: -1 });
            
        // Process data for heatmap format
        const processedData = processHeatmapData(heatmapData);
        
        res.status(200).json({
            success: true,
            data: processedData
        });
    } catch (error) {
        console.error('Error fetching heatmap data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching heatmap data',
            error: error.message
        });
    }
});

// Helper function to process heatmap data
function processHeatmapData(data) {
    // This is a simple example - you would want to customize this based on your specific requirements
    // Create a grid of coordinates and aggregate the counts
    const gridSize = 10; // 10x10 grid
    const grid = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    
    // Process each data point
    data.forEach(point => {
        if (point.coordinates && typeof point.coordinates.x === 'number' && typeof point.coordinates.y === 'number') {
            // Scale coordinates to fit in our grid
            const x = Math.min(Math.max(Math.floor(point.coordinates.x * gridSize), 0), gridSize - 1);
            const y = Math.min(Math.max(Math.floor(point.coordinates.y * gridSize), 0), gridSize - 1);
            
            // Add count to the grid cell
            grid[y][x] += point.count;
        }
    });
    
    // Format data for frontend consumption
    return {
        xCoords: Array.from({ length: gridSize }, (_, i) => i + 1),
        yCoords: Array.from({ length: gridSize }, (_, i) => i + 1),
        densityValues: grid
    };
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing