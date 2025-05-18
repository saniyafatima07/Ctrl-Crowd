const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const crowdData = require('./models/crowdData');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, './frontend')));
const connectDB = require('./mongoose');
connectDB();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './frontend', 'index.html'));
});

app.post('/verify-passcode', (req, res) => {
    const { passcode } = req.body;
    const valid = process.env.PASSCODE;
    
    if (passcode === valid) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid passcode' });
    }
});

app.post('/crowd-data', async (req, res) => {
    try{
        const data = new crowdData(req.body);
        await data.save();
        res.status(201).json({message:'Data saved succesfully'});

    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: 'Error saving data'});
    }
});

async function fetchAndStoreCrowdData() {
    try {
        const response = await axios.get(process.env.RASP_API);
        const espData = response.data;

        if (!espData.timestamp || espData.crowd_count === undefined) {
            console.error('Invalid data format received:', espData);
            return;
        }

        const newEntry = new crowdData({
            timestamp: espData.timestamp,
            crowd_count: espData.crowd_count
        });

        await newEntry.save();
        console.log('Data saved from ESP32:', espData);
    } catch (error) {
        console.error('Failed to fetch/store ESP32 data:', error.message);
    }
}

setInterval(fetchAndStoreCrowdData, 10000);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;