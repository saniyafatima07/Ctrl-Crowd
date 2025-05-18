const mongoose = require('mongoose');

const CrowdDataSchema = new mongoose.Schema({
    crowd_count: {
        type: Number,
        required: true,
        set: v => Math.floor(v)
      },
      timestamp: {
        type: String,
        required: true
      }
    // heatmap_csv: String 
});

module.exports = mongoose.model('CrowdData', CrowdDataSchema);
