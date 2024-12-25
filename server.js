const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // Serve HTML, CSS, JS files

// Handle audio upload and processing
app.post('/upload', upload.fields([{ name: 'audioFile' }, { name: 'thumbnail' }]), (req, res) => {
    const audioFile = req.files['audioFile'][0];
    const thumbnail = req.files['thumbnail'][0];
    const bitrate = req.body.bitrate;
    const samplingRate = req.body.samplingRate;

    const outputFilePath = `processed_audio_${Date.now()}.mp3`;

    ffmpeg(audioFile.path)
        .input(thumbnail.path)
        .audioBitrate(bitrate)
        .audioFrequency(samplingRate * 1000)
        .output(outputFilePath)
        .on('end', () => {
            // Send the processed file URL back to the client
            res.json({ fileUrl: `/${outputFilePath}` });
        })
        .on('error', (err) => {
            console.error('Error processing audio:', err);
            res.status(500).send('Error processing audio');
        })
        .run();
});

// Serve the processed file
app.get('/processed_audio_:timestamp.mp3', (req, res) => {
    const filePath = path.join(__dirname, req.url);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});