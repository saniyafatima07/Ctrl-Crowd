const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const crowdData = require('./models/crowdData');

const connectDB = require('./mongoose');
connectDB();

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, './frontend')));

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

app.get('/getCrowdData', (req,res) => {
    const crowd = [
        {time: '01.03'},
        {address: '192.0.0.1'},
        {crowdcount: 450}
    ];
    res.json(crowd);
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;