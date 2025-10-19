import { useState, useRef, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import AdvicePanel from './AdvicePanel'
import './ScreenShare.css'

function ScreenShare() {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentOptions, setCurrentOptions] = useState<string[]>([
    'Start your conversation naturally',
    'Be yourself and stay engaged',
    'Listen actively to what they share',
    'I\'ll provide live tips as we go'
  ])
  const [currentEmotion, setCurrentEmotion] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameIntervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null)

  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to JPEG blob
    canvas.toBlob((blob) => {
      if (blob && socketRef.current) {
        // Convert blob to ArrayBuffer and send to server
        blob.arrayBuffer().then((buffer) => {
          console.log('Sending JPEG frame:', blob.size, 'bytes')
          socketRef.current?.emit('video-chunk', buffer)
        })
      }
    }, 'image/jpeg', 0.8) // JPEG with 80% quality
  }

  const setupAudioCapture = (stream: MediaStream) => {
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      console.warn('No audio tracks available in stream')
      return
    }

    // Create audio context
    audioContextRef.current = new AudioContext({ sampleRate: 48000 })
    const audioContext = audioContextRef.current

    // Create a media stream source from the audio track
    const source = audioContext.createMediaStreamSource(new MediaStream([audioTracks[0]]))

    // Create a script processor to capture raw audio data
    // Using 8192 buffer for better quality (was 4096)
    const processor = audioContext.createScriptProcessor(8192, 1, 1)
    audioProcessorRef.current = processor

    processor.onaudioprocess = (e) => {
      if (!socketRef.current) return

      // Get the raw audio data (Float32Array)
      const inputData = e.inputBuffer.getChannelData(0)

      // Convert Float32Array to Int16Array (PCM 16-bit)
      const pcmData = new Int16Array(inputData.length)
      for (let i = 0; i < inputData.length; i++) {
        // Convert from -1.0 to 1.0 range to -32768 to 32767 range
        const s = Math.max(-1, Math.min(1, inputData[i]))
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
      }

      // Send PCM data to server
      socketRef.current.emit('audio-chunk', pcmData.buffer)
    }

    // Connect the audio graph
    source.connect(processor)
    processor.connect(audioContext.destination)

    console.log('Audio capture setup complete (48kHz PCM)')
  }

  const stopAudioCapture = () => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect()
      audioProcessorRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    console.log('Audio capture stopped')
  }

  const startScreenShare = async () => {
    try {
      setError(null)

      // Check if running in browser
      if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.mediaDevices) {
        setError('Screen sharing is only available in the browser')
        return
      }

      // Request screen sharing with audio and reduced quality
      // Resolution: Target 1280x720 (720p), max 1920x1080
      // Frame Rate: Target 15 fps, max 24 fps (down from typical 30-60 fps)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // @ts-ignore - cursor is supported but not in TypeScript types yet
          cursor: 'always',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 24 }
        },
        audio: true
      })

      streamRef.current = stream

      // Display the stream in the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Notify server that stream is starting
      if (socketRef.current) {
        socketRef.current.emit('stream-start')
      }

      setIsSharing(true)

      // Create canvas for frame capture if not exists
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
      }

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, ready to capture frames')
            resolve()
          }
        }
      })

      // Start capturing and sending frames every 2 seconds
      console.log('Starting frame capture (every 2 seconds)')
      frameIntervalRef.current = window.setInterval(() => {
        captureAndSendFrame()
      }, 2000) // 2 seconds = matches server processing interval

      // Set up audio capture for transcription
      setupAudioCapture(stream)

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare()
      })

    } catch (err) {
      console.error('Error starting screen share:', err)

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Screen sharing permission denied. Please allow screen sharing in your browser.')
        } else if (err.name === 'NotFoundError') {
          setError('No screen sharing source available.')
        } else if (err.name === 'NotSupportedError') {
          setError('Screen sharing is not supported in this browser.')
        } else if (err.name === 'AbortError') {
          setError('Screen sharing was cancelled.')
        } else {
          setError(`Failed to start screen sharing: ${err.message}`)
        }
      } else {
        setError('Failed to start screen sharing. Please check permissions.')
      }
    }
  }

  const stopScreenShare = () => {
    // Stop frame capture interval
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current)
      frameIntervalRef.current = null
      console.log('Stopped frame capture')
    }

    // Stop audio capture
    stopAudioCapture()

    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Notify server
    if (socketRef.current) {
      socketRef.current.emit('stream-stop')
    }

    setIsSharing(false)
  }

  // Set up Socket.IO connection
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Determine server URL based on environment
    let serverUrl: string

    if (process.env.NODE_ENV === 'development') {
      // Local development
      serverUrl = 'http://localhost:3001'
    } else {
      // Production - use same host as web app, different port
      serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 
                  `http://${window.location.hostname}:3001`
    }

    console.log('Connecting to WebSocket server:', serverUrl)
    
    // Connect to server
    const socket = io(serverUrl)
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    socket.on('stream-ready', (data) => {
      console.log('Server ready:', data.message)
    })

    socket.on('emotion-detected', (data) => {
      console.log('Emotions detected:', data)
      // TODO: Update UI with emotion data
    })

    socket.on('emotion-error', (data) => {
      console.error('Emotion detection error:', data.message)
      setError(data.message)
    })

    socket.on('advice-update', (data) => {
      console.log('Received advice update:', data)
      if (data.options && Array.isArray(data.options)) {
        setCurrentOptions(data.options)
      }
      if (data.emotion) {
        setCurrentEmotion(data.emotion)
      }
    })

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
      stopAudioCapture()
      socket.disconnect()
    }
  }, [])

  return (
    <div className="screen-share-container">
      <h1>Screen Sharing for Emotion Detection</h1>

      <div className="connection-status">
        {isConnected ? (
          <span className="status-connected">Connected to server</span>
        ) : (
          <span className="status-disconnected">Disconnected from server</span>
        )}
      </div>

      <div className="controls">
        {!isSharing ? (
          <button
            onClick={startScreenShare}
            className="share-button"
          >
            Start Screen Share
          </button>
        ) : (
          <button
            onClick={stopScreenShare}
            className="stop-button"
          >
            Stop Sharing
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Hidden video element - needed for frame capture but not displayed to user */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1280px',
          height: '720px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />

      <AdvicePanel
        isVisible={isSharing}
        options={currentOptions}
        emotion={currentEmotion}
      />
    </div>
  )
}

export default ScreenShare
