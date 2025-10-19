'use client'

import { useRef, useEffect } from 'react'
import { Socket } from 'socket.io-client'

interface ScreenShareMediaProps {
  isSharing: boolean
  socketRef: React.MutableRefObject<Socket | null>
  onStreamStart: () => void
  onStreamStop: () => void
  onError: (error: string) => void
}

export default function ScreenShareMedia({
  isSharing,
  socketRef,
  onStreamStart,
  onStreamStop,
  onError
}: ScreenShareMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
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
    const processor = audioContext.createScriptProcessor(8192, 1, 1)
    audioProcessorRef.current = processor

    processor.onaudioprocess = (e) => {
      if (!socketRef.current) return

      // Get the raw audio data (Float32Array)
      const inputData = e.inputBuffer.getChannelData(0)

      // Convert Float32Array to Int16Array (PCM 16-bit)
      const pcmData = new Int16Array(inputData.length)
      for (let i = 0; i < inputData.length; i++) {
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

  const startCapture = async () => {
    try {
      // Guard: Check if media APIs are available
      if (!navigator?.mediaDevices?.getDisplayMedia) {
        onError('Screen sharing is not supported in this browser or environment')
        return
      }

      // Request screen sharing with audio and reduced quality
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

      onStreamStart()

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
      }, 2000)

      // Set up audio capture for transcription
      setupAudioCapture(stream)

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopCapture()
      })

    } catch (err) {
      console.error('Error starting screen share:', err)

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          onError('Screen sharing permission denied. Please allow screen sharing in your browser.')
        } else if (err.name === 'NotFoundError') {
          onError('No screen sharing source available.')
        } else if (err.name === 'NotSupportedError') {
          onError('Screen sharing is not supported in this browser.')
        } else if (err.name === 'AbortError') {
          onError('Screen sharing was cancelled.')
        } else {
          onError(`Failed to start screen sharing: ${err.message}`)
        }
      } else {
        onError('Failed to start screen sharing. Please check permissions.')
      }
    }
  }

  const stopCapture = () => {
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

    onStreamStop()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current)
      }
      stopAudioCapture()
    }
  }, [])

  // Expose start/stop methods via effect
  useEffect(() => {
    if (isSharing && !streamRef.current) {
      startCapture()
    } else if (!isSharing && streamRef.current) {
      stopCapture()
    }
  }, [isSharing])

  return (
    <>
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
    </>
  )
}
