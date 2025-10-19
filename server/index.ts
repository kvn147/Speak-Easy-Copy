import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition'
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  LanguageCode,
  MediaEncoding
} from '@aws-sdk/client-transcribe-streaming'
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize AWS clients
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

const transcribeClient = new TranscribeStreamingClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
})

const bedrockClient = new BedrockRuntimeClient({
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

// Store active sessions for emotion detection and transcription
interface AnalysisSession {
  frameCount: number
  lastProcessedTime: number
  lastAudioProcessedTime: number
  lastAdviceGeneratedTime: number
  startTime: number
  currentEmotion: string | null
  fullTranscript: string
  audioChunks: Buffer[]
  lastAdvice: string
}

const sessions = new Map<string, AnalysisSession>()

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

// Function to generate conversation advice using Claude via Bedrock
async function generateConversationAdvice(emotion: string | null, transcript: string) {
  try {
    const emotionContext = emotion || 'No emotion detected yet'
    const transcriptContext = transcript || 'No speech detected yet'

    // Create the prompt for Claude
    const prompt = `You are a real-time conversation coach. Based on the current emotional state and conversation transcript, provide brief, actionable advice to help guide the conversation positively.

Current Emotion: ${emotionContext}
Conversation so far: "${transcriptContext}"

Provide 1-2 sentences of helpful, specific advice. Focus on:
- Responding to the detected emotion appropriately
- Building on what's been said
- Suggesting next steps or questions to deepen the conversation
- Being encouraging and constructive

Keep it concise and actionable.`

    // Prepare the request for Claude 3.5 Sonnet
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    })

    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    if (responseBody.content && responseBody.content.length > 0) {
      return responseBody.content[0].text
    }

    return 'Continue the conversation naturally.'
  } catch (error) {
    console.error('Bedrock error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return 'Keep engaging with the conversation.'
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

    // Initialize analysis session
    sessions.set(socket.id, {
      frameCount: 0,
      lastProcessedTime: Date.now(),
      lastAudioProcessedTime: Date.now(),
      lastAdviceGeneratedTime: Date.now(),
      startTime: Date.now(),
      currentEmotion: null,
      fullTranscript: '',
      audioChunks: [],
      lastAdvice: 'Start your conversation naturally. I\'ll provide live tips as we go.'
    })

    socket.emit('stream-ready', { message: 'Server ready to analyze emotions and transcribe audio' })
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
      console.log(`   Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`)

      // Save ALL frames to Test folder for debugging
      const testDir = path.join(__dirname, '../Test')
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const testFramePath = path.join(testDir, `frame-${session.frameCount}-${timestamp}.jpg`)
      fs.writeFileSync(testFramePath, imageBuffer)
      console.log(`   💾 Saved to Test folder: ${path.basename(testFramePath)}`)

      const emotions = await detectEmotionsFromFrame(imageBuffer)

      if (emotions && emotions.length > 0) {
        const dominantEmotion = emotions[0].dominantEmotion || 'UNKNOWN'
        const confidence = emotions[0].confidence || 0

        // Store current emotion in session
        session.currentEmotion = `${dominantEmotion} (${confidence.toFixed(1)}%)`

        // Display emotion only
        console.log('╔═══════════════════════════════════════════════════════════')
        console.log(`║ 😊 MOOD: ${session.currentEmotion}`)
        console.log('╚═══════════════════════════════════════════════════════════\n')

        // Send emotions back to client for display
        socket.emit('emotion-detected', {
          timestamp: new Date().toISOString(),
          faces: emotions
        })
      } else {
        session.currentEmotion = 'No face detected'
        console.log('   ❌ No faces detected in this frame')
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

  // Handle audio chunks for transcription
  socket.on('audio-chunk', async (data: ArrayBuffer) => {
    const session = sessions.get(socket.id)
    if (!session) return

    const audioBuffer = Buffer.from(data)
    session.audioChunks.push(audioBuffer)

    // Process audio every 5 seconds to get enough context for transcription
    const now = Date.now()
    const timeSinceLastTranscription = now - session.lastAudioProcessedTime

    // Only transcribe if we have enough audio (5 seconds worth) and some chunks
    if (timeSinceLastTranscription < 5000 || session.audioChunks.length < 10) {
      return
    }

    // Update last audio processed time
    session.lastAudioProcessedTime = now

    try {
      // Combine all audio chunks
      const combinedAudio = Buffer.concat(session.audioChunks)
      session.audioChunks = [] // Clear for next batch

      console.log(`🎤 Processing ${(combinedAudio.length / 1024).toFixed(1)} KB of audio...`)

      // Create async generator that yields audio chunks
      async function* audioStream() {
        // Split the combined audio into smaller chunks for streaming
        const chunkSize = 4096 * 2 // 4096 samples * 2 bytes per sample (16-bit PCM)
        for (let i = 0; i < combinedAudio.length; i += chunkSize) {
          const chunk = combinedAudio.slice(i, Math.min(i + chunkSize, combinedAudio.length))
          yield { AudioEvent: { AudioChunk: chunk } }
        }
      }

      const command = new StartStreamTranscriptionCommand({
        LanguageCode: LanguageCode.EN_US,
        MediaEncoding: MediaEncoding.PCM,
        MediaSampleRateHertz: 48000,
        AudioStream: audioStream()
      })

      const response = await transcribeClient.send(command)

      // Process transcription results
      let newTextDetected = false
      if (response.TranscriptResultStream) {
        for await (const event of response.TranscriptResultStream) {
          if (event.TranscriptEvent) {
            const results = event.TranscriptEvent.Transcript?.Results
            if (results && results.length > 0) {
              const transcript = results[0]
              if (!transcript.IsPartial) {
                const text = transcript.Alternatives?.[0]?.Transcript || ''
                if (text.trim()) {
                  // Append to full transcript
                  if (session.fullTranscript) {
                    session.fullTranscript += ' ' + text
                  } else {
                    session.fullTranscript = text
                  }
                  newTextDetected = true
                }
              }
            }
          }
        }
      }

      // Display accumulated transcript if new text was detected
      if (newTextDetected) {
        console.log('╔═══════════════════════════════════════════════════════════')
        console.log('║ 💬 SPEECH TRANSCRIPTION (Full Session):')
        console.log('╠═══════════════════════════════════════════════════════════')

        // Word wrap the transcript for better readability
        const words = session.fullTranscript.split(' ')
        let currentLine = '║ '
        const maxLineLength = 58 // 60 chars minus "║ "

        for (const word of words) {
          if ((currentLine.length + word.length + 1 - 2) > maxLineLength) {
            console.log(currentLine)
            currentLine = '║ ' + word
          } else {
            currentLine += (currentLine === '║ ' ? '' : ' ') + word
          }
        }
        if (currentLine !== '║ ') {
          console.log(currentLine)
        }

        console.log('╚═══════════════════════════════════════════════════════════\n')

        // Generate advice if we have both emotion and transcript, and it's been 10+ seconds since last advice
        const now = Date.now()
        const timeSinceLastAdvice = now - session.lastAdviceGeneratedTime

        if (session.currentEmotion && session.fullTranscript && timeSinceLastAdvice >= 10000) {
          session.lastAdviceGeneratedTime = now

          console.log('💡 Generating conversation advice...')
          const advice = await generateConversationAdvice(session.currentEmotion, session.fullTranscript)
          session.lastAdvice = advice

          // Send advice to frontend
          socket.emit('advice-update', {
            advice: advice,
            emotion: session.currentEmotion,
            timestamp: new Date().toISOString()
          })

          console.log('╔═══════════════════════════════════════════════════════════')
          console.log('║ 💡 LIVE ADVICE:')
          console.log('╠═══════════════════════════════════════════════════════════')

          // Word wrap the advice
          const words = advice.split(' ')
          let currentLine = '║ '
          const maxLineLength = 58

          for (const word of words) {
            if ((currentLine.length + word.length + 1 - 2) > maxLineLength) {
              console.log(currentLine)
              currentLine = '║ ' + word
            } else {
              currentLine += (currentLine === '║ ' ? '' : ' ') + word
            }
          }
          if (currentLine !== '║ ') {
            console.log(currentLine)
          }

          console.log('╚═══════════════════════════════════════════════════════════\n')
        }
      }
    } catch (error) {
      console.error('Transcription error:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
      }
      // Don't fail the whole process if transcription fails
    }
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

      // Display final full transcript
      if (session.fullTranscript) {
        console.log('\n╔═══════════════════════════════════════════════════════════')
        console.log('║ 📝 FINAL FULL TRANSCRIPT:')
        console.log('╠═══════════════════════════════════════════════════════════')

        const words = session.fullTranscript.split(' ')
        let currentLine = '║ '
        const maxLineLength = 58

        for (const word of words) {
          if ((currentLine.length + word.length + 1 - 2) > maxLineLength) {
            console.log(currentLine)
            currentLine = '║ ' + word
          } else {
            currentLine += (currentLine === '║ ' ? '' : ' ') + word
          }
        }
        if (currentLine !== '║ ') {
          console.log(currentLine)
        }

        console.log('╚═══════════════════════════════════════════════════════════\n')
      }
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
