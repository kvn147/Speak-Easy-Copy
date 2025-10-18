# Server Setup Instructions

## Prerequisites

### Install FFmpeg

The server requires FFmpeg to be installed on your system to convert video recordings to MP4 H264 format.

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
Download from https://ffmpeg.org/download.html and add to PATH

### Verify FFmpeg Installation
```bash
ffmpeg -version
```

## Running the Application

### 1. Start the Backend Server
```bash
npm run server
```
The server will run on `http://localhost:3001`

### 2. Start the Frontend (in a new terminal)
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

## How It Works

1. Click "Start Screen Share" in the browser
2. Select the screen/window you want to capture
3. The video stream is sent to the server in real-time
4. Click "Stop Sharing" to end the recording
5. The server will:
   - Combine all video chunks
   - Convert to MP4 with H264 codec using FFmpeg
   - Save to the `recordings/` directory

## Recordings Location

All recordings are saved in the `recordings/` directory at the project root.

Filename format: `recording-YYYY-MM-DDTHH-MM-SS.mp4`
