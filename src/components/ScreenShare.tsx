import { useState, useRef, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import AdvicePanel from './AdvicePanel'
import ScreenShareMedia from './ScreenShareMedia.client'
import './ScreenShare.css'

function ScreenShare() {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [currentOptions, setCurrentOptions] = useState<string[]>([
    'Start your conversation naturally',
    'Be yourself and stay engaged',
    'Listen actively to what they share',
    'I\'ll provide live tips as we go'
  ])
  const [currentEmotion, setCurrentEmotion] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)

  // Check if we're in the browser (for SSR compatibility)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleStreamStart = () => {
    setIsSharing(true)
    setError(null)
  }

  const handleStreamStop = () => {
    setIsSharing(false)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const toggleSharing = () => {
    setIsSharing(!isSharing)
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
      socket.disconnect()
    }
  }, [])

  // Don't render interactive elements during SSR
  if (!isMounted) {
    return (
      <div className="screen-share-container">
        <h1>Screen Sharing for Emotion Detection</h1>
        <div className="loading-message">Loading screen share interface...</div>
      </div>
    )
  }

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
            onClick={toggleSharing}
            className="share-button"
            disabled={!isMounted}
          >
            Start Screen Share
          </button>
        ) : (
          <button
            onClick={toggleSharing}
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

      {/* Client-side media handling component */}
      {isMounted && (
        <ScreenShareMedia
          isSharing={isSharing}
          socketRef={socketRef}
          onStreamStart={handleStreamStart}
          onStreamStop={handleStreamStop}
          onError={handleError}
        />
      )}

      <AdvicePanel
        isVisible={isSharing}
        options={currentOptions}
        emotion={currentEmotion}
      />
    </div>
  )
}

export default ScreenShare
