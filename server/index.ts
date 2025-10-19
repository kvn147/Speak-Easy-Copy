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
interface MoodSnapshot {
  timestamp: number
  emotion: string
  confidence: number
}

interface TranscriptSegment {
  timestamp: number
  text: string
}

interface AnalysisSession {
  frameCount: number
  lastProcessedTime: number
  lastAudioProcessedTime: number
  lastAdviceGeneratedTime: number
  startTime: number
  currentEmotion: string | null
  previousEmotion: string | null
  emotionJustChanged: boolean
  fullTranscript: string
  audioChunks: Buffer[]
  lastAdvice: string[]
  moodHistory: MoodSnapshot[]
  transcriptSegments: TranscriptSegment[]
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

// Function to generate conversation summary using Claude via Bedrock
async function generateConversationSummary(
  moodHistory: MoodSnapshot[],
  fullTranscript: string,
  duration: number
): Promise<string> {
  try {
    // Format mood progression
    const moodProgression = moodHistory.length > 0
      ? moodHistory.map(m => `${m.emotion} (${m.confidence.toFixed(0)}%)`).join(' → ')
      : 'No emotions detected'

    const prompt = `You are a conversation analyst. Generate a comprehensive summary of this conversation in the EXACT markdown format specified below.

CONVERSATION DURATION: ${duration.toFixed(1)} seconds
EMOTIONAL JOURNEY: ${moodProgression}
FULL TRANSCRIPT: "${fullTranscript || 'No speech was captured'}"

Generate a summary using this EXACT markdown template:

# Conversation Summary

## 📊 Overview
- **Duration**: [duration in minutes and seconds]
- **Date**: [current date and time]
- **Transcript Length**: [number of words or "No speech captured"]

## 💬 Key Topics Discussed
[Bullet points of 3-5 main topics that were discussed. If no speech, write "No topics - conversation not captured"]

## 😊 Emotional Journey
[Describe the emotional progression throughout the conversation. Include specific emotions detected and any notable shifts. If no emotions detected, write "Emotions not captured"]

## ✨ Highlights & Key Moments
[Bullet points of 2-4 notable moments, insights, or turning points in the conversation. If minimal content, write "Not enough data captured"]

## 💡 Insights & Patterns
[2-3 sentences analyzing communication patterns, emotional intelligence, or conversation dynamics observed]

## 🎯 Recommendations for Next Time
[Bullet points with 2-3 actionable suggestions for improving future conversations based on what was observed]

---
*Generated by SpeakEasy Conversation Coach*

IMPORTANT:
- Follow the template EXACTLY as shown above
- Use the same headers, emoji, and structure
- Keep it concise but insightful
- Be specific to the actual conversation content
- If data is limited, acknowledge it but still provide the template structure`

    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    })

    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    if (responseBody.content && responseBody.content.length > 0) {
      return responseBody.content[0].text
    }

    return '# Conversation Summary\n\nUnable to generate summary.'
  } catch (error) {
    console.error('Summary generation error:', error)
    return '# Conversation Summary\n\nError generating summary.'
  }
}

// Function to generate conversation advice using Claude via Bedrock
async function generateConversationAdvice(
  moodHistory: MoodSnapshot[],
  transcriptSegments: TranscriptSegment[],
  currentEmotion: string | null,
  fullTranscript: string,
  emotionJustChanged: boolean,
  previousEmotion: string | null
): Promise<string[]> {
  try {
    // Get recent mood history (last 30 seconds)
    const now = Date.now()
    const recentMoods = moodHistory.filter(m => now - m.timestamp < 30000)
    const recentTranscripts = transcriptSegments.filter(t => now - t.timestamp < 30000)

    // Format mood history for context
    const moodContext = recentMoods.length > 0
      ? recentMoods.map(m => `${m.emotion} (${m.confidence.toFixed(0)}%)`).join(' → ')
      : 'No emotions detected yet'

    // Format recent conversation
    const conversationContext = recentTranscripts.length > 0
      ? recentTranscripts.map(t => t.text).join(' ')
      : (fullTranscript || 'No speech detected yet')

    // Extract the base emotion (remove confidence percentage)
    const baseEmotion = currentEmotion?.split('(')[0].trim() || 'UNKNOWN'

    // Create emotion-specific guidance
    let emotionGuidance = ''
    if (emotionJustChanged && previousEmotion) {
      emotionGuidance = `\n⚠️ EMOTION JUST CHANGED from ${previousEmotion} to ${baseEmotion}! Be especially creative and responsive to this shift.\n`
    }

    // Add specific guidance based on current emotion
    const emotionStrategies: { [key: string]: string } = {
      'HAPPY': 'Capitalize on their positive energy. Suggest ways to deepen joy, celebrate together, or channel excitement productively.',
      'SAD': 'Show deep empathy and validation. Offer comfort, understanding, and gentle ways to explore or process feelings.',
      'ANGRY': 'Acknowledge their frustration without judgment. Provide calming perspectives, validation, or constructive outlets.',
      'SURPRISED': 'Embrace the unexpected moment. Explore what surprised them, share in the excitement, or help process the shock.',
      'CONFUSED': 'Offer clarity and reassurance. Break down complexity, provide structure, or ask clarifying questions.',
      'DISGUSTED': 'Validate their reaction while seeking to understand. Explore boundaries or suggest reframing.',
      'FEAR': 'Provide safety and reassurance. Acknowledge concerns, offer support, or help problem-solve.',
      'CALM': 'Maintain the peaceful energy. Deepen reflection, explore meaningful topics, or strengthen connection.'
    }

    const specificGuidance = emotionStrategies[baseEmotion] || 'Respond authentically to their emotional state.'

    // Create the prompt for Claude
    const prompt = `You are a real-time conversation coach analyzing a live conversation. Based on the emotional progression and recent dialogue, provide exactly 4 CREATIVE and SPECIFIC response options.

MOOD PROGRESSION (last 30s): ${moodContext}
CURRENT EMOTION: ${baseEmotion}${emotionGuidance}
RECENT CONVERSATION: "${conversationContext}"

STRATEGY FOR ${baseEmotion}: ${specificGuidance}

Provide exactly 4 different ways to respond in this moment. Each option should:
- Be HIGHLY SPECIFIC to the ${baseEmotion} emotion and what was just said
- Offer a different creative approach (empathetic question, bold affirmation, surprising insight, playful reframe)
- Be concise but impactful (1-2 sentences max)
- Feel natural, warm, and emotionally intelligent
- Match the energy level of their ${baseEmotion} state
${emotionJustChanged ? '- DIRECTLY acknowledge and respond to the emotional shift they just experienced' : ''}

Make your suggestions CREATIVE, ACTIONABLE, and EMOTIONALLY RESONANT. Avoid generic advice.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "options": [
    "First response option here",
    "Second response option here",
    "Third response option here",
    "Fourth response option here"
  ]
}

IMPORTANT: Output ONLY the JSON object, no other text.`

    // Prepare the request for Claude 3.5 Sonnet
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }

    const command = new InvokeModelCommand({
      modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0", // Cross-region inference profile
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    })

    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    if (responseBody.content && responseBody.content.length > 0) {
      const responseText = responseBody.content[0].text

      // Parse JSON response
      try {
        // Extract JSON from response (in case Claude adds extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.options && Array.isArray(parsed.options)) {
            return parsed.options.slice(0, 4) // Ensure max 4 options
          }
        }
      } catch (parseError) {
        console.error('Failed to parse JSON from Bedrock response:', parseError)
        console.error('Response was:', responseText)
      }
    }

    // Fallback if parsing fails
    return [
      'Ask an open-ended question about their experience',
      'Acknowledge their feelings and show empathy',
      'Share a related thought to build connection',
      'Suggest exploring this topic more deeply'
    ]
  } catch (error) {
    console.error('Bedrock error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return [
      'Continue the conversation naturally',
      'Ask a follow-up question',
      'Show active listening',
      'Build on what they just said'
    ]
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
      previousEmotion: null,
      emotionJustChanged: false,
      fullTranscript: '',
      audioChunks: [],
      lastAdvice: [
        'Start your conversation naturally',
        'Be yourself and stay engaged',
        'Listen actively to what they share',
        'I\'ll provide live tips as we go'
      ],
      moodHistory: [],
      transcriptSegments: []
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

        // Detect emotion change
        const previousBaseEmotion = session.currentEmotion?.split('(')[0].trim()
        if (previousBaseEmotion && previousBaseEmotion !== dominantEmotion) {
          session.emotionJustChanged = true
          session.previousEmotion = previousBaseEmotion
          console.log(`\n🔄 EMOTION CHANGED: ${previousBaseEmotion} → ${dominantEmotion}\n`)
        } else {
          session.emotionJustChanged = false
        }

        // Store current emotion in session
        session.currentEmotion = `${dominantEmotion} (${confidence.toFixed(1)}%)`

        // Add to mood history
        session.moodHistory.push({
          timestamp: Date.now(),
          emotion: dominantEmotion,
          confidence: confidence
        })

        // Keep only last 60 seconds of mood history
        const cutoffTime = Date.now() - 60000
        session.moodHistory = session.moodHistory.filter(m => m.timestamp > cutoffTime)

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

    // Process audio every 6 seconds to get enough context for better transcription accuracy
    const now = Date.now()
    const timeSinceLastTranscription = now - session.lastAudioProcessedTime

    // Only transcribe if we have enough audio (6 seconds worth) and sufficient chunks
    // Increased from 5s to 6s for better accuracy with larger buffer size
    if (timeSinceLastTranscription < 6000 || session.audioChunks.length < 15) {
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
        // Split the combined audio into optimal chunks for streaming
        // Increased to 8192 to match frontend buffer size for better quality
        const chunkSize = 8192 * 2 // 8192 samples * 2 bytes per sample (16-bit PCM)
        for (let i = 0; i < combinedAudio.length; i += chunkSize) {
          const chunk = combinedAudio.slice(i, Math.min(i + chunkSize, combinedAudio.length))
          yield { AudioEvent: { AudioChunk: chunk } }
        }
      }

      const command = new StartStreamTranscriptionCommand({
        LanguageCode: LanguageCode.EN_US,
        MediaEncoding: MediaEncoding.PCM,
        MediaSampleRateHertz: 48000,
        AudioStream: audioStream(),
        EnablePartialResultsStabilization: true,
        PartialResultsStability: 'high', // Improves accuracy of partial results
        ShowSpeakerLabel: false // Not needed for single speaker
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

                  // Add to transcript segments for recent context
                  session.transcriptSegments.push({
                    timestamp: Date.now(),
                    text: text
                  })

                  // Keep only last 60 seconds of transcript segments
                  const cutoffTime = Date.now() - 60000
                  session.transcriptSegments = session.transcriptSegments.filter(t => t.timestamp > cutoffTime)

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

        // Generate advice only every 15 seconds to avoid rate limiting
        const now = Date.now()
        const timeSinceLastAdvice = now - session.lastAdviceGeneratedTime
        const shouldGenerateAdvice = session.currentEmotion && session.fullTranscript &&
                                     timeSinceLastAdvice >= 15000 // 15 seconds minimum interval

        if (shouldGenerateAdvice) {
          session.lastAdviceGeneratedTime = now

          // Check if emotion changed recently for better context
          const recentEmotionChange = session.emotionJustChanged ||
                                      (session.previousEmotion && session.previousEmotion !== session.currentEmotion?.split('(')[0].trim())

          if (recentEmotionChange) {
            console.log('💡 Generating CREATIVE conversation advice (emotion recently changed)...')
          } else {
            console.log('💡 Generating conversation advice with 15s aggregate data...')
          }

          const adviceOptions = await generateConversationAdvice(
            session.moodHistory,
            session.transcriptSegments,
            session.currentEmotion,
            session.fullTranscript,
            recentEmotionChange,
            session.previousEmotion
          )
          session.lastAdvice = adviceOptions

          // Send advice array to frontend
          socket.emit('advice-update', {
            options: adviceOptions,
            emotion: session.currentEmotion,
            emotionChanged: recentEmotionChange,
            timestamp: new Date().toISOString()
          })

          console.log('╔═══════════════════════════════════════════════════════════')
          console.log(`║ 💡 LIVE RESPONSE OPTIONS${recentEmotionChange ? ' (EMOTION SHIFT)' : ''}:`)
          console.log('╠═══════════════════════════════════════════════════════════')

          adviceOptions.forEach((option, index) => {
            console.log(`║ ${index + 1}. ${option}`)
          })

          console.log('╚═══════════════════════════════════════════════════════════\n')

          // Reset emotion changed flag after generating advice
          session.emotionJustChanged = false
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
  socket.on('stream-stop', async () => {
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

      // Generate AI-powered conversation summary with delay to avoid rate limiting
      console.log('\n🤖 Waiting 3 seconds before generating summary to avoid rate limits...\n')

      setTimeout(async () => {
        try {
          console.log('🤖 Generating conversation summary with AI...\n')
          const summary = await generateConversationSummary(
            session.moodHistory,
            session.fullTranscript,
            duration
          )

          // Print the markdown summary
          console.log('\n' + '='.repeat(70))
          console.log(summary)
          console.log('='.repeat(70) + '\n')
        } catch (summaryError) {
          console.error('Failed to generate summary after retry:', summaryError)
          console.log('\n' + '='.repeat(70))
          console.log('# Conversation Summary')
          console.log('\nUnable to generate summary due to rate limiting.')
          console.log('Please wait a moment and the summary will be generated.')
          console.log('='.repeat(70) + '\n')
        }
      }, 3000) // Wait 3 seconds before generating summary
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
