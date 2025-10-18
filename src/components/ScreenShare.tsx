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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

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

      // Set up MediaRecorder for the entire stream (video + audio)
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
      }

      // Try different codecs if the preferred one is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        console.log('vp8,opus not supported, trying vp9')
        options.mimeType = 'video/webm;codecs=vp9,opus'
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        console.log('vp9 not supported, trying default')
        options.mimeType = 'video/webm'
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          console.log('Sending video chunk:', event.data.size, 'bytes')
          event.data.arrayBuffer().then((buffer) => {
            socketRef.current?.emit('video-chunk', buffer)
          })
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred')
      }

      // Start recording and send chunks every second
      mediaRecorder.start(1000) // Generate chunks every 1 second
      console.log('Recording started with mime type:', options.mimeType)

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
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    // Stop media streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    // Notify server to finalize recording
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

    socket.on('recording-saved', (data) => {
      console.log('Recording saved successfully:', data.filename)
      alert(`Recording saved: ${data.filename}`)
    })

    socket.on('recording-error', (data) => {
      console.error('Recording error:', data.message)
      setError(data.message)
    })

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
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
