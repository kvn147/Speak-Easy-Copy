import { useState } from 'react'
import ScreenShare from './components/ScreenShare'
import './App.css'

function App() {
  const [view, setView] = useState<'home' | 'live-session'>('home')

  if (view === 'live-session') {
    return (
      <div className="App">
        <nav className="app-nav">
          <button onClick={() => setView('home')} className="nav-button">
            ← Back to Home
          </button>
        </nav>
        <ScreenShare />
      </div>
    )
  }

  return (
    <div className="App home-view">
      <header className="home-header">
        <h1>SpeakEasy</h1>
        <p className="subtitle">Real-time Conversation Assistant & Analysis Platform</p>
      </header>

      <div className="home-grid">
        <div className="feature-card">
          <div className="feature-icon">🎥</div>
          <h2>Live Session</h2>
          <p>Start a real-time screen sharing session with AI-powered conversation advice, emotion detection, and speech transcription.</p>
          <button onClick={() => setView('live-session')} className="primary-button">
            Start Live Session
          </button>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h2>Conversation History</h2>
          <p>View, manage, and analyze your past conversations with AI-powered summaries and speaking feedback.</p>
          <a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" className="primary-button">
            View Conversations
          </a>
        </div>
      </div>

      <div className="feature-list">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-emoji">🎭</span>
            <span>Real-time Emotion Detection</span>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">🎤</span>
            <span>Speech Transcription</span>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">🤖</span>
            <span>AI Conversation Advice</span>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">📝</span>
            <span>Conversation Summaries</span>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">💬</span>
            <span>Speaking Feedback</span>
          </div>
          <div className="feature-item">
            <span className="feature-emoji">📰</span>
            <span>News Recommendations</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
