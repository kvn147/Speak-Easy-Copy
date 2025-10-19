'use client';

import { useAuth } from './lib/firebase/AuthContext';
import { useState } from 'react';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Image from 'next/image';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show authentication forms if not logged in
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="brand-header">
              <Image 
                src="/assets/images/speak-easy-icon.png" 
                alt="SpeakEasy Logo" 
                width={48} 
                height={48}
                className="logo"
              />
              <h1>SpeakEasy</h1>
            </div>
            <p>Sign in to record conversations and view your conversation history</p>
          </div>

          {isLogin ? <LoginForm /> : <RegisterForm />}

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setIsLogin(!isLogin)} className="toggle-button">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show main app if logged in
  return (
    <div className="notion-home">
      {/* Top Navigation Bar */}
      <nav className="notion-nav">
        <div className="nav-left">
          <Image
            src="/assets/images/speak-easy-icon.png"
            alt="SpeakEasy Logo"
            width={28}
            height={28}
            className="nav-logo"
          />
          <span className="nav-title">SpeakEasy</span>
        </div>
        <div className="nav-right">
          <span className="nav-user">{user.email}</span>
          <button onClick={logout} className="nav-logout">
            Logout
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="notion-hero">
        <h1 className="hero-title">Welcome back 👋</h1>
        <p className="hero-subtitle">Your AI-powered conversation assistant</p>
      </div>

      {/* Main Action Cards */}
      <div className="notion-container">
        <div className="notion-cards">
          <a href="/live-session" className="notion-card notion-card-primary">
            <div className="card-icon">🎥</div>
            <div className="card-content">
              <h3>Start Live Session</h3>
              <p>Real-time conversation coaching with emotion detection and AI advice</p>
            </div>
            <div className="card-arrow">→</div>
          </a>

          <a href="/conversations" className="notion-card">
            <div className="card-icon">📚</div>
            <div className="card-content">
              <h3>View Conversations</h3>
              <p>Browse and analyze your conversation history</p>
            </div>
            <div className="card-arrow">→</div>
          </a>
        </div>

        {/* Condensed Features Section */}
        <div className="notion-features">
          <h2>Features</h2>
          <div className="features-compact">
            <span className="feature-tag">🎭 Emotion Detection</span>
            <span className="feature-tag">🎤 Transcription</span>
            <span className="feature-tag">🤖 AI Advice</span>
            <span className="feature-tag">📝 Summaries</span>
            <span className="feature-tag">💬 Feedback</span>
            <span className="feature-tag">📰 News</span>
          </div>
        </div>
      </div>
    </div>
  );
}
