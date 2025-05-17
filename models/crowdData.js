const mongoose = require('mongoose');

const CrowdDataSchema = new mongoose.Schema({
    ip_address: String,
    timestamp: { type: Date, default: Date.now },
    crowd_count: Number,
    heatmap_csv: String 
});

module.exports = mongoose.model('CrowdData', CrowdDataSchema);
