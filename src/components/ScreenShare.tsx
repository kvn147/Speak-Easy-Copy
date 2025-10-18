import { useState, useRef, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import AdvicePanel from './AdvicePanel'
import './ScreenShare.css'

function ScreenShare() {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameIntervalRef = useRef<number | null>(null)

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

  const startScreenShare = async () => {
    try {
      setError(null)

      // Request screen sharing with audio and reduced quality
      // Resolution: Target 1280x720 (720p), max 1920x1080
      // Frame Rate: Target 15 fps, max 24 fps (down from typical 30-60 fps)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
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
    // Connect to server
    const socket = io('http://localhost:3001')
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

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
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

      {/* Hidden video element - needed for MediaRecorder but not displayed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      />

      <AdvicePanel isVisible={isSharing} />
    </div>
  )
}

export default ScreenShare
