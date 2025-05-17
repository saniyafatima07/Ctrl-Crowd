const mongoose = require('mongoose');
const dotenv = require('dotenv');

const uri = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/crowdDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Stop the server if DB connection fails
    }
};

module.exports = connectDB