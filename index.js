const fs = require('fs');
const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());

// Merge audio and video directly from URLs
function mergeAudioVideoFromUrls(videoUrl, audioUrl, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoUrl)
            .input(audioUrl)
            .outputOptions('-c:v copy') // Copy video codec to avoid re-encoding
            .outputOptions('-c:a aac') // Ensure audio is in AAC format
            .save(outputPath)
            .on('progress', (progress) => {
                console.log(`Merging: ${progress.percent.toFixed(2)}% done`);
            })
            .on('end', () => {
                console.log('Merging complete!');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error during merging:', err);
                reject(err);
            });
    });
}

// Endpoint to handle video merging
app.post('/merge', async (req, res) => {
    const videoUrl = req.query.videoUrl;
    const audioUrl = req.query.audioUrl;
    const outputPath = 'output.mp4';

    try {
        console.log('Merging video and audio...');
        await mergeAudioVideoFromUrls(videoUrl, audioUrl, outputPath);

        res.sendFile(outputPath, { root: __dirname }, () => {
            // Clean up file after sending
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred during processing.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
