import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition'

// Load environment variables
dotenv.config()

// Initialize AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8 // 100 MB for large video chunks
})

app.use(cors())
app.use(express.json())

// Store active sessions for emotion detection
interface EmotionSession {
  frameCount: number
  lastProcessedTime: number
  startTime: number
}

const sessions = new Map<string, EmotionSession>()

// Function to detect emotions from video frame using AWS Rekognition
async function detectEmotionsFromFrame(imageBytes: Buffer) {
  try {
    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes
      },
      Attributes: ['ALL'] // Include emotions, age range, gender, etc.
    })

    const response = await rekognitionClient.send(command)

    if (response.FaceDetails && response.FaceDetails.length > 0) {
      const emotions = response.FaceDetails.map(face => {
        const dominantEmotion = face.Emotions?.sort((a, b) =>
          (b.Confidence || 0) - (a.Confidence || 0)
        )[0]

        return {
          emotions: face.Emotions,
          dominantEmotion: dominantEmotion?.Type,
          confidence: dominantEmotion?.Confidence,
          ageRange: face.AgeRange,
          gender: face.Gender?.Value
        }
      })

      return emotions
    }

    return null
  } catch (error) {
    console.error('Rekognition error:', error)
    throw error
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Handle stream start
  socket.on('stream-start', () => {
    console.log('Stream started for client:', socket.id)

    // Initialize emotion detection session
    sessions.set(socket.id, {
      frameCount: 0,
      lastProcessedTime: Date.now(),
      startTime: Date.now()
    })

    socket.emit('stream-ready', { message: 'Server ready to analyze emotions' })
  })

  // Handle video frames for emotion detection
  socket.on('video-chunk', async (data: ArrayBuffer) => {
    const session = sessions.get(socket.id)
    if (!session) return

    const now = Date.now()
    // Process every 2 seconds to avoid API rate limits
    if (now - session.lastProcessedTime < 2000) {
      return
    }

    session.lastProcessedTime = now
    session.frameCount++

    try {
      const imageBuffer = Buffer.from(data)
      console.log(`\n[Frame ${session.frameCount}] Analyzing emotions...`)

      const emotions = await detectEmotionsFromFrame(imageBuffer)

      if (emotions && emotions.length > 0) {
        emotions.forEach((face, index) => {
          console.log(`\n👤 Face ${index + 1}:`)
          console.log(`   Dominant Emotion: ${face.dominantEmotion} (${face.confidence?.toFixed(1)}% confidence)`)
          console.log(`   Age Range: ${face.ageRange?.Low}-${face.ageRange?.High}`)
          console.log(`   Gender: ${face.gender}`)
          console.log(`   All Emotions:`)
          face.emotions?.forEach(emotion => {
            console.log(`     - ${emotion.Type}: ${emotion.Confidence?.toFixed(1)}%`)
          })
        })

        // Send emotions back to client for display
        socket.emit('emotion-detected', {
          timestamp: new Date().toISOString(),
          faces: emotions
        })
      } else {
        console.log('   No faces detected in this frame')
      }
    } catch (error) {
      console.error('Error analyzing frame:', error)

      if (error instanceof Error && error.message.includes('credentials')) {
        socket.emit('emotion-error', {
          message: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
        })
      }
    }
  })

  // Handle audio chunks (for future transcription)
  socket.on('audio-chunk', (data: ArrayBuffer) => {
    // TODO: Add audio transcription with AWS Transcribe
    console.log('Received audio chunk, size:', data.byteLength, 'bytes')
  })

  // Handle stream stop
  socket.on('stream-stop', () => {
    console.log('Stream stopped for client:', socket.id)

    const session = sessions.get(socket.id)
    if (session) {
      const duration = (Date.now() - session.startTime) / 1000
      console.log(`\n📊 Session Summary:`)
      console.log(`   Duration: ${duration.toFixed(1)}s`)
      console.log(`   Frames analyzed: ${session.frameCount}`)
      console.log(`   Average: ${(session.frameCount / duration).toFixed(1)} frames/sec`)
    }

    // Clean up session
    sessions.delete(socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    // Clean up any active session
    sessions.delete(socket.id)
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log('===========================================')
  console.log('🚀 Emotion Detection Server')
  console.log('===========================================')
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
  console.log('')

  // Check AWS credentials
  const hasCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  if (hasCredentials) {
    console.log('✅ AWS credentials configured')
    console.log(`   Region: ${process.env.AWS_REGION || 'us-east-1'}`)
  } else {
    console.warn('⚠️  WARNING: AWS credentials not configured!')
    console.warn('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables')
    console.warn('   Emotion detection will not work without valid AWS credentials')
  }
  console.log('')
  console.log('Ready to detect emotions! 😊😢😡😮😄')
  console.log('===========================================\n')
})
