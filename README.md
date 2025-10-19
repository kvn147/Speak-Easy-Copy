# SpeakEasy - Real-Time Conversation Assistant

A real-time screen sharing application that captures video and audio from Zoom/FaceTime calls, analyzes emotions using AWS Rekognition, transcribes speech using AWS Transcribe, and provides live conversation insights.

## Features

- Screen capture with audio
- Real-time emotion detection using AWS Rekognition
- Real-time speech transcription using AWS Transcribe
- Live advice panel for conversation suggestions
- Socket.IO for real-time communication
- Automatic frame capture every 2 seconds
- Automatic audio transcription every 5 seconds

## Prerequisites

Before running this project, make sure you have the following installed:

### 1. Node.js and npm
- **Node.js version**: 18.x or higher
- Download from: https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

### 2. AWS Account and Credentials

You'll need an AWS account with access to:
- **AWS Rekognition** (for emotion detection)
- **AWS Transcribe** (for speech transcription)

See `AWS_SETUP.md` for detailed instructions on setting up your AWS account and obtaining credentials.

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
- `@aws-sdk/client-rekognition` - AWS Rekognition for emotion detection
- `@aws-sdk/client-transcribe-streaming` - AWS Transcribe for speech transcription
- `dotenv` - Environment variable management

**TypeScript Types:**
- `@types/react`, `@types/react-dom`, `@types/express`, `@types/cors`, `@types/node`

### 3. Configure AWS Credentials

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your AWS credentials:

```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
PORT=3001
```

**Important:** Never commit your `.env` file to git! It's already in `.gitignore`.

## Running the Application

You need to run **two separate terminals** - one for the backend server and one for the frontend.

### Terminal 1: Start the Backend Server
```bash
npm run server
```

The server will start on `http://localhost:3001`

You should see:
```
===========================================
🚀 Emotion Detection Server
===========================================
Server running on port 3001
WebSocket server ready for connections

✅ AWS credentials configured
   Region: us-east-1

Ready to detect emotions! 😊😢😡😮😄
===========================================
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
   - **"Window"** - Select your Zoom/FaceTime window (RECOMMENDED for best results)
   - **"Entire Screen"** - Captures full screen (faces may be too small)
   - **"Chrome Tab"** - To capture a browser tab
3. Check **"Share audio"** to capture audio for transcription
4. Click **"Share"**

**Important Tips:**
- Share ONLY the FaceTime/Zoom window (not entire screen) for best emotion detection
- Make sure faces are clearly visible and well-lit
- Faces should be at least 80x80 pixels for detection

### 3. View Live Analysis

Once screen sharing starts:
- Backend console shows real-time emotion detection every 2 seconds
- Backend console shows speech transcription every 5 seconds
- All analyzed frames are saved to `Test/` folder for debugging

**Example Console Output:**

```
╔═══════════════════════════════════════════════════════════
║ 😊 MOOD: HAPPY (85.3%)
╚═══════════════════════════════════════════════════════════

╔═══════════════════════════════════════════════════════════
║ 💬 SPEECH TRANSCRIPTION (Full Session):
╠═══════════════════════════════════════════════════════════
║ Hello how are you doing today I'm doing great thanks
║ for asking
╚═══════════════════════════════════════════════════════════
```

### 4. Stop Recording

Click **"Stop Sharing"** when done. The backend will:
- Display session summary with statistics
- Show final complete transcript
- Clean up session data

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
├── Test/                        # Debug frames (auto-generated)
├── .env                         # AWS credentials (DO NOT COMMIT)
├── .env.example                 # Example environment variables
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── AWS_SETUP.md                # AWS setup instructions
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
2. **Video frames** are drawn to a hidden canvas and converted to JPEG every 2 seconds
3. **Audio** is captured via Web Audio API and converted to PCM 16-bit format
4. JPEG frames sent to backend via **Socket.IO** for emotion detection
5. PCM audio chunks sent to backend continuously for transcription
6. **Backend** sends frames to **AWS Rekognition** for emotion analysis
7. **Backend** streams audio to **AWS Transcribe** for speech-to-text
8. Results displayed in backend console in real-time
9. All analyzed frames saved to `Test/` folder for debugging

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

### AWS Credentials Error

**Solution:**
- Check that `.env` file exists with valid AWS credentials
- Verify credentials have access to Rekognition and Transcribe
- Check AWS region is correct (default: us-east-1)
- Backend will show warning on startup if credentials missing

### No faces detected

**Solution:**
- Share ONLY the FaceTime/Zoom window (not entire screen)
- Make sure faces are clearly visible and well-lit
- Faces should be at least 80x80 pixels
- Check `Test/` folder to see what the camera is capturing

### No audio transcription

**Solution:**
- When selecting screen to share, check **"Share audio"** checkbox
- Make sure the application you're recording has permission to use microphone
- Check that your system audio is not muted
- Check backend console for transcription errors

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

- [ ] Integrate LLM for generating live suggestions based on emotions and speech
- [ ] Display real suggestions in AdvicePanel
- [ ] Add session management and history
- [ ] Export transcripts and emotion data
- [ ] Deploy to production

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Node.js, Express, Socket.IO
- **AI Services:** AWS Rekognition (emotion detection), AWS Transcribe (speech-to-text)
- **Real-time Communication:** WebSocket (Socket.IO)
- **Audio Processing:** Web Audio API (PCM conversion)
- **Image Processing:** Canvas API (JPEG frame extraction)

## Browser Support

- ✅ Chrome 72+ (Recommended)
- ✅ Edge 79+
- ✅ Firefox 66+
- ⚠️ Safari 13+ (Limited support, may have issues)

## License

MIT

---

For questions or issues, contact the team or open an issue on GitHub.
