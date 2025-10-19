# SpeakEasy - Unified Application

**Real-time Conversation Assistant + Conversation Management Platform**

A comprehensive full-stack application that combines real-time screen sharing with AI-powered conversation analysis and a conversation management system for post-session review and insights.

## Overview

This integrated application combines two powerful systems:

1. **Live Session Mode** (React + Vite + Express + Socket.IO + AWS)
   - Real-time screen sharing and audio capture
   - Emotion detection using AWS Rekognition
   - Speech transcription using AWS Transcribe
   - Live AI conversation advice using AWS Bedrock (Claude 3.5 Sonnet)

2. **Conversation History** (Next.js + Firebase + Gemini AI)
   - User authentication with Firebase
   - Conversation storage and retrieval
   - AI-powered summaries using Google Gemini
   - Speaking feedback and analysis
   - News article recommendations

## Architecture

### Services

- **React Frontend** (Port 5173) - Main UI for live sessions and navigation
- **Next.js Application** (Port 3000) - Conversation viewer and API routes
- **Express + Socket.IO Server** (Port 3001) - Real-time WebSocket server

### Technology Stack

**Frontend**
- React 18.3.1 + Vite 5.4.2
- TypeScript 5.9.3
- Socket.IO Client 4.8.1

**Next.js Application**
- Next.js 15.5.6
- React 19.2.0
- Firebase 10.14.1 (Auth + Admin SDK)
- Tailwind CSS 4.1.14
- React Markdown 10.1.0

**Backend (Express)**
- Express 5.1.0
- Socket.IO 4.8.1
- AWS SDK 3.913.0 (Rekognition, Transcribe, Bedrock)

**AI Services**
- AWS Bedrock (Claude 3.5 Sonnet) - Live conversation advice
- Google Gemini API - Post-session summaries and feedback
- AWS Rekognition - Emotion detection
- AWS Transcribe - Speech-to-text

## Features

### Real-Time Features (Live Session)
- **Screen Sharing** - Capture video and audio from Zoom/FaceTime/any application
- **Emotion Detection** - Real-time facial emotion analysis (Happy, Sad, Angry, Surprised, etc.)
- **Speech Transcription** - Live speech-to-text transcription
- **AI Conversation Advice** - Context-aware response suggestions every 15 seconds
- **Emotion-Aware Suggestions** - Different advice strategies based on detected emotions
- **Session Recording** - Automatic saving of conversations as markdown files

### Post-Session Features (Conversation History)
- **User Authentication** - Secure Firebase email/password authentication
- **Conversation Library** - Browse and manage all past conversations
- **AI Summaries** - Generate comprehensive conversation summaries
- **Speaking Feedback** - Get AI-powered communication insights
- **News Recommendations** - Find relevant articles based on conversation topics
- **Markdown Viewer** - Beautiful rendering of conversation content

## Installation

### Prerequisites

- Node.js 18.18+ or 20+
- npm or yarn
- AWS Account with Rekognition, Transcribe, and Bedrock access
- Firebase Project (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
- Google Gemini API Key (see [GEMINI_SETUP.md](./GEMINI_SETUP.md))

### Step 1: Clone and Install

```bash
cd SpeakEasy-1
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```env
# AWS Credentials (already configured if you have .env)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Express Server
PORT=3001

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

### Step 3: Set Up Firebase

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to:
1. Create a Firebase project
2. Enable Email/Password authentication
3. Get your web app credentials
4. Generate a service account key

### Step 4: Set Up Gemini API

Follow the guide in [GEMINI_SETUP.md](./GEMINI_SETUP.md) to:
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create an API key
3. Add it to `.env.local`

## Running the Application

### Development Mode (All Services)

Run all three services simultaneously:

```bash
npm run dev
```

This starts:
- React frontend on http://localhost:5173
- Next.js application on http://localhost:3000
- Express server on http://localhost:3001

### Individual Services

**React Frontend Only:**
```bash
npm run dev:vite
```

**Next.js Application Only:**
```bash
npm run dev:next
```

**Express Server Only:**
```bash
npm run dev:server
```

## Usage

### 1. Access the Home Page

Navigate to http://localhost:5173 to see the unified home page with two options:

- **Start Live Session** - Begin a real-time conversation analysis session
- **View Conversations** - Access your conversation history (requires authentication)

### 2. Live Session Workflow

1. Click "Start Live Session"
2. Click "Start Screen Share"
3. Select the window/screen to share (e.g., Zoom call)
4. Enable audio sharing
5. The app will:
   - Detect emotions every 2 seconds
   - Transcribe speech continuously
   - Provide AI advice every 15 seconds
   - Display live response suggestions
6. Click "Stop Sharing" when done
7. **Conversation automatically saved** to `conversations/demo-user/` directory

### 3. Conversation History Workflow

1. Click "View Conversations" on the home page (opens http://localhost:3000)
2. Sign up or log in with email/password
3. View your conversation list in the sidebar
4. Click any conversation to view:
   - Full transcript
   - Detected emotions timeline
   - Session details
5. Use AI features:
   - "Generate Summary" - Get AI-powered conversation summary
   - "Get Speaking Feedback" - Receive communication insights
   - "Find Relevant Article" - Get news recommendations

## File Structure

```
SpeakEasy-1/
├── app/                          # Next.js application
│   ├── api/                      # API routes
│   │   ├── conversations/        # Conversation endpoints
│   │   │   ├── route.ts         # List conversations
│   │   │   └── [id]/
│   │   │       ├── route.ts     # Get conversation
│   │   │       ├── summarize/   # Generate summary
│   │   │       ├── feedback/    # Generate feedback
│   │   │       └── news/        # Fetch news
│   │   └── init-user/           # User initialization
│   ├── auth/                     # Auth pages
│   ├── components/              # Next.js components
│   │   ├── auth/               # Auth components
│   │   ├── ConversationList.tsx
│   │   └── ConversationViewer.tsx
│   ├── conversation/           # Conversation pages
│   ├── lib/                    # Utilities
│   │   ├── firebase/          # Firebase config
│   │   ├── markdown.ts        # File operations
│   │   └── generateExamples.ts
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Next.js home
│   └── globals.css            # Global styles
├── src/                        # React application
│   ├── components/
│   │   ├── ScreenShare.tsx   # Main live session component
│   │   └── AdvicePanel.tsx   # AI advice display
│   ├── App.tsx               # React app with navigation
│   ├── App.css               # Styles
│   └── index.tsx             # Entry point
├── server/
│   └── index.ts              # Express + Socket.IO server
├── conversations/            # Saved markdown conversations
│   └── demo-user/           # User-specific folders
├── scripts/                  # Utility scripts
├── .env                     # Express server config (AWS)
├── .env.local               # Next.js config (Firebase + Gemini)
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## How Conversations are Saved

When you stop a live session:

1. Express server generates a conversation summary using AWS Bedrock (Claude)
2. Saves the conversation to `conversations/demo-user/conversation-YYYY-MM-DD-HH-MM-SS.md`
3. Markdown file includes:
   - Frontmatter (title, date, summary)
   - Full transcript
   - Detected emotions timeline
   - Session details (duration, frames analyzed)

Example saved conversation:
```markdown
---
title: Conversation Session 2025-10-18 14:30:45
date: 2025-10-18T14:30:45.123Z
summary: Discussion about project planning and Q4 roadmap...
feedback:
---

# Dialogue

[Transcribed speech content here]

# Detected Emotions Timeline

- 2:30:45 PM: HAPPY (92.3%)
- 2:30:47 PM: SURPRISED (85.1%)
...

# Session Details

- **Duration:** 45.3 seconds
- **Frames Analyzed:** 23
- **Recording Date:** 10/18/2025, 2:30:00 PM
```

## Customization

### Changing the User ID

By default, conversations are saved to `conversations/demo-user/`. To use actual Firebase user IDs:

1. Pass the user ID from the React frontend to Express via Socket.IO
2. Update `saveConversationToMarkdown()` in `server/index.ts` to use the actual user ID

### Adjusting AI Features

**Live Advice Frequency:**
- Edit line ~600 in `server/index.ts`
- Change `15000` (15 seconds) to your preferred interval

**Emotion Detection Rate:**
- Edit line ~459 in `server/index.ts`
- Change `2000` (2 seconds) to your preferred interval

**Audio Transcription Buffer:**
- Edit line ~550 in `server/index.ts`
- Change `6000` (6 seconds) and chunk count threshold

## Troubleshooting

### React Frontend Won't Start
- Check that port 5173 is available
- Run `npm run dev:vite` separately

### Next.js Won't Start
- Check that port 3000 is available
- Verify Firebase credentials in `.env.local`
- Run `npm run dev:next` separately

### Express Server Won't Start
- Check that port 3001 is available
- Verify AWS credentials in `.env`
- Run `npm run dev:server` separately

### Conversations Not Appearing in Next.js
- Check that conversations are saved to `conversations/demo-user/`
- Verify the markdown files have proper frontmatter
- Restart the Next.js server after adding new conversations

### Firebase Authentication Issues
- See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) troubleshooting section
- Verify all Firebase environment variables
- Check Firebase Console > Authentication settings

### Gemini API Issues
- See [GEMINI_SETUP.md](./GEMINI_SETUP.md) troubleshooting section
- Verify API key in `.env.local`
- Check API quotas at https://ai.google.dev/

## Production Deployment

### React + Express
- Build React: `npm run build`
- Deploy Express server with Socket.IO support
- Configure AWS credentials securely

### Next.js
- Deploy to Vercel (recommended)
- Add all environment variables from `.env.local`
- Ensure Firebase is properly configured

## Security Notes

- Never commit `.env` or `.env.local` files
- AWS credentials should be rotated regularly
- Firebase service account keys are sensitive
- Use Firebase security rules in production
- Gemini API keys should be server-side only

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Check the troubleshooting sections
- Review setup guides (FIREBASE_SETUP.md, GEMINI_SETUP.md)
- Open an issue on GitHub

---

**Built with:**
- React + Vite for real-time UI
- Next.js for conversation management
- Express + Socket.IO for WebSocket communication
- AWS (Rekognition, Transcribe, Bedrock) for AI features
- Firebase for authentication
- Google Gemini for post-session analysis
