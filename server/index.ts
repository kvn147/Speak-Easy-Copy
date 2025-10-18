import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Create recordings directory if it doesn't exist
const recordingsDir = path.join(__dirname, '../recordings')
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true })
}

// Store active recording sessions
interface RecordingSession {
  videoChunks: Buffer[]
  audioChunks: Buffer[]
  startTime: number
}

const sessions = new Map<string, RecordingSession>()

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

    // Initialize recording session
    sessions.set(socket.id, {
      videoChunks: [],
      audioChunks: [],
      startTime: Date.now()
    })

    socket.emit('stream-ready', { message: 'Server ready to receive stream' })
  })

  // Handle video stream chunks
  socket.on('video-chunk', (data: ArrayBuffer) => {
    const session = sessions.get(socket.id)
    if (session) {
      session.videoChunks.push(Buffer.from(data))
      console.log('Received video chunk, size:', data.byteLength, 'bytes, total chunks:', session.videoChunks.length)
    }
  })

  // Handle audio stream chunks
  socket.on('audio-chunk', (data: ArrayBuffer) => {
    const session = sessions.get(socket.id)
    if (session) {
      session.audioChunks.push(Buffer.from(data))
      console.log('Received audio chunk, size:', data.byteLength, 'bytes, total chunks:', session.audioChunks.length)
    }
  })

  // Handle stream stop - save and encode video
  socket.on('stream-stop', async () => {
    console.log('Stream stopped for client:', socket.id)

    const session = sessions.get(socket.id)
    if (!session) {
      console.log('No session found for', socket.id)
      socket.emit('recording-error', {
        message: 'No recording session found'
      })
      return
    }

    // Check if we received any video chunks
    if (session.videoChunks.length === 0) {
      console.error('No video chunks received')
      socket.emit('recording-error', {
        message: 'No video data was recorded. Please ensure screen sharing started properly.'
      })
      sessions.delete(socket.id)
      return
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const tempVideoPath = path.join(recordingsDir, `temp-${timestamp}.webm`)
    const outputPath = path.join(recordingsDir, `recording-${timestamp}.mp4`)

    try {
      // Combine all video chunks into a single file
      const videoBuffer = Buffer.concat(session.videoChunks)

      if (videoBuffer.length === 0) {
        throw new Error('Video buffer is empty')
      }

      fs.writeFileSync(tempVideoPath, videoBuffer)
      console.log(`Saved temp video file: ${tempVideoPath} (${videoBuffer.length} bytes)`)

      // Convert to MP4 with H264 codec using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .outputOptions([
            '-c:v libx264',      // H264 video codec
            '-preset fast',       // Encoding speed
            '-crf 23',           // Quality (lower = better, 23 is good default)
            '-c:a aac',          // AAC audio codec
            '-b:a 128k'          // Audio bitrate
          ])
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine)
          })
          .on('progress', (progress) => {
            console.log('Processing: ' + Math.round(progress.percent || 0) + '% done')
          })
          .on('end', () => {
            console.log(`Successfully created MP4: ${outputPath}`)
            // Clean up temp file
            try {
              fs.unlinkSync(tempVideoPath)
            } catch (err) {
              console.warn('Could not delete temp file:', err)
            }
            resolve()
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err)
            // Clean up temp file on error
            try {
              if (fs.existsSync(tempVideoPath)) {
                fs.unlinkSync(tempVideoPath)
              }
            } catch (cleanupErr) {
              console.warn('Could not delete temp file:', cleanupErr)
            }
            reject(err)
          })
          .run()
      })

      socket.emit('recording-saved', {
        filename: path.basename(outputPath),
        path: outputPath
      })

    } catch (error) {
      console.error('Error processing video:', error)

      let errorMessage = 'Failed to process recording'

      if (error instanceof Error) {
        if (error.message.includes('ffmpeg')) {
          errorMessage = 'FFmpeg error: Please ensure FFmpeg is installed on the server. Run "ffmpeg -version" to check.'
        } else if (error.message.includes('ENOENT')) {
          errorMessage = 'FFmpeg not found. Please install FFmpeg on the server.'
        } else if (error.message.includes('empty')) {
          errorMessage = 'No video data was recorded. Please try again.'
        } else {
          errorMessage = `Recording failed: ${error.message}`
        }
      }

      socket.emit('recording-error', {
        message: errorMessage
      })
    } finally {
      // Clean up session
      sessions.delete(socket.id)
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    // Clean up any active session
    sessions.delete(socket.id)
  })
})

const PORT = process.env.PORT || 3001

// Check FFmpeg availability on startup
function checkFFmpeg() {
  return new Promise<boolean>((resolve) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        console.error('❌ FFmpeg not found or not working properly')
        console.error('   Please install FFmpeg: https://ffmpeg.org/download.html')
        console.error('   Error:', err.message)
        resolve(false)
      } else {
        console.log('✅ FFmpeg is installed and working')
        resolve(true)
      }
    })
  })
}

httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
  console.log(`Recordings will be saved to: ${recordingsDir}`)
  console.log('')

  // Check FFmpeg
  const ffmpegAvailable = await checkFFmpeg()
  if (!ffmpegAvailable) {
    console.warn('⚠️  WARNING: Video recordings will fail until FFmpeg is installed')
  }
  console.log('')
})
