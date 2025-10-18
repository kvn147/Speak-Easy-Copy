# SpeakEasy - Real-Time Conversation Assistant

A real-time screen sharing application that captures video and audio from Zoom/FaceTime calls, processes them for emotion detection and transcription, and provides live suggestions to help guide conversations.

## Features

- Screen capture with audio
- Real-time video streaming to backend
- MP4 H264 video recording
- Live advice panel for conversation suggestions
- Socket.IO for real-time communication

## Prerequisites

Before running this project, make sure you have the following installed:

### 1. Node.js and npm
- **Node.js version**: 16.x or higher
- Download from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

### 2. FFmpeg (Required for video encoding)

FFmpeg is needed to convert recorded video to MP4 H264 format.

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install FFmpeg
brew install ffmpeg
```

#### Ubuntu/Debian Linux
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
1. Download from: https://ffmpeg.org/download.html
2. Extract the archive
3. Add FFmpeg to your system PATH

Verify FFmpeg installation:
```bash
ffmpeg -version
```

### 3. Recommended Browser
- **Google Chrome** (recommended) or Chromium-based browser (Edge, Brave)
- Safari has limited screen sharing support

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Dubhacks2025
```

### 2. Install Dependencies
```bash
npm install
```

This will install all required packages including:

**Frontend Dependencies:**
- `react` - UI framework
- `react-dom` - React DOM rendering
- `socket.io-client` - WebSocket client for real-time communication
- `vite` - Build tool and dev server

**Backend Dependencies:**
- `express` - Web server framework
- `socket.io` - WebSocket server
- `cors` - Cross-origin resource sharing
- `fluent-ffmpeg` - FFmpeg wrapper for video encoding

**TypeScript Types:**
- `@types/react`, `@types/react-dom`, `@types/express`, `@types/cors`, `@types/fluent-ffmpeg`, `@types/node`

## Running the Application

You need to run **two separate terminals** - one for the backend server and one for the frontend.

### Terminal 1: Start the Backend Server
```bash
npm run server
```

The server will start on `http://localhost:3001`

You should see:
```
Server running on port 3001
WebSocket server ready for connections
```

### Terminal 2: Start the Frontend Dev Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 3. Open in Browser
1. Open **Google Chrome**
2. Navigate to `http://localhost:5173`
3. You should see "Connected to server" (green indicator)

## How to Use

### 1. Grant Screen Recording Permissions (macOS)

**Important:** macOS requires explicit permission for screen recording.

1. Go to **System Settings** → **Privacy & Security** → **Screen Recording**
2. Enable **Google Chrome** (check the box)
3. **Restart Chrome completely** (Cmd+Q to quit, then reopen)

### 2. Start Screen Sharing

1. Click **"Start Screen Share"** button
2. Chrome will show a dialog - select:
   - **"Entire Screen"** - to capture your full screen
   - **"Window"** - to capture a specific window (like Zoom)
   - **"Chrome Tab"** - to capture a browser tab
3. Check **"Share audio"** if you want to capture system audio
4. Click **"Share"**

### 3. View Live Suggestions

Once screen sharing starts:
- The advice panel will appear at the bottom of the page
- Currently shows placeholder text
- Can be collapsed/expanded with the ▼/▲ button

### 4. Stop Recording

Click **"Stop Sharing"** when done. The backend will:
- Save the recording to `recordings/` folder
- Convert to MP4 H264 format using FFmpeg
- Display success message with filename

## Project Structure

```
Dubhacks2025/
├── src/
│   ├── components/
│   │   ├── ScreenShare.tsx      # Main screen sharing component
│   │   ├── ScreenShare.css      # Screen sharing styles
│   │   ├── AdvicePanel.tsx      # Bottom advice panel component
│   │   └── AdvicePanel.css      # Advice panel styles
│   ├── App.tsx                  # Root component
│   ├── App.css                  # App styles
│   ├── index.tsx                # React entry point
│   └── index.css                # Global styles
├── server/
│   └── index.ts                 # Express + Socket.IO backend
├── recordings/                  # Recorded videos (auto-generated)
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
└── README.md                   # This file
```

## Available Scripts

```bash
npm run dev        # Start frontend dev server (Vite)
npm run server     # Start backend server (Express + Socket.IO)
npm run build      # Build frontend for production
npm run preview    # Preview production build
```

## How It Works

1. **Frontend** captures screen using `navigator.mediaDevices.getDisplayMedia()`
2. **MediaRecorder API** records video+audio in WebM format
3. Video chunks are sent to backend via **Socket.IO** every second
4. **Backend** stores chunks in memory during recording
5. When stopped, backend combines chunks and uses **FFmpeg** to convert to MP4 H264
6. Recordings saved to `recordings/` folder with timestamp

## Troubleshooting

### "Failed to start screen sharing"

**Solution:**
- Make sure you're using **Chrome** (not Safari)
- Check macOS Screen Recording permissions (System Settings → Privacy & Security)
- Restart Chrome after granting permissions
- Check browser console (F12) for detailed error messages

### "Disconnected from server" (red indicator)

**Solution:**
- Make sure backend server is running: `npm run server`
- Check that backend is on port 3001
- Verify no firewall blocking localhost connections

### FFmpeg errors during recording

**Solution:**
- Verify FFmpeg is installed: `ffmpeg -version`
- Make sure FFmpeg is in your system PATH
- Check backend console for specific FFmpeg errors

### No audio in recording

**Solution:**
- When selecting screen to share, check **"Share audio"** checkbox
- Make sure the application you're recording (Zoom/FaceTime) has permission to use microphone
- Check that your system audio is not muted

### Port already in use

**Solution:**
- Frontend (5173): Kill any other Vite processes
- Backend (3001): Kill any other Node processes using port 3001
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>
```

## Next Steps / TODO

- [ ] Integrate emotion detection API
- [ ] Add audio transcription service
- [ ] Connect LLM for generating live suggestions
- [ ] Display real suggestions in AdvicePanel
- [ ] Add session management and history
- [ ] Deploy to production

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Node.js, Express, Socket.IO
- **Video Processing:** FFmpeg, MediaRecorder API
- **Real-time Communication:** WebSocket (Socket.IO)

## Browser Support

- ✅ Chrome 72+ (Recommended)
- ✅ Edge 79+
- ✅ Firefox 66+
- ⚠️ Safari 13+ (Limited support, may have issues)

## License

MIT

---

For questions or issues, contact the team or open an issue on GitHub.