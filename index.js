const fs = require('fs');
const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ffmpegStatic = require('ffmpeg-static');
const cp = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());

// Merge audio and video directly from YouTube URLs
function mergeAudioVideoFromUrls(url, outputPath) {
    return new Promise((resolve, reject) => {
        const videoStream = ytdl(url, { quality: 'highestvideo' });
        const audioStream = ytdl(url, { quality: 'highestaudio' });

        const ffmpegProcess = cp.spawn(
            ffmpegStatic,
            [
                '-loglevel', '8',
                '-hide_banner',
                '-progress', 'pipe:5',
                '-i', 'pipe:3', // Video input
                '-i', 'pipe:4', // Audio input
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-f', 'mp4',
                outputPath,
            ],
            {
                windowsHide: true,
                stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe'],
            }
        );

        videoStream.pipe(ffmpegProcess.stdio[3]);
        audioStream.pipe(ffmpegProcess.stdio[4]);

        ffmpegProcess.stdio[5].on('data', (chunk) => {
            const progress = chunk.toString();
            console.log('FFmpeg progress:', progress); 
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg process exited with code ${code}`));
            }
        });

        ffmpegProcess.on('error', (error) => {
            reject(error);
        });
    });
}

// Endpoint to handle video merging
app.post('/merge', async (req, res) => {
    const { url } = req.query;
    console.log(url)
    if (!url) {
        return res.status(400).send('Both videoUrl and audioUrl are required.');
    }

    const outputPath = `output-${Date.now()}.mp4`;

    try {
        console.log('Merging video and audio...');
        await mergeAudioVideoFromUrls(url, outputPath);

        res.sendFile(outputPath, { root: __dirname }, () => {
            // Clean up file after sending
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('An error occurred during processing.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
