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
    <div className="home-landing">
      <header className="landing-header">
        <div className="brand-header">
          <Image 
            src="/assets/images/speak-easy-icon.png" 
            alt="SpeakEasy Logo" 
            width={56} 
            height={56}
            className="logo"
          />
          <h1>SpeakEasy</h1>
        </div>
        <p className="subtitle">Real-time Conversation Assistant & Analysis Platform</p>
        <div className="user-info">
          <span>Welcome, {user.email}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="home-grid">
        <div className="feature-card">
          <div className="feature-icon">🎥</div>
          <h2>Live Session</h2>
          <p>Start a real-time screen sharing session with AI-powered conversation advice, emotion detection, and speech transcription.</p>
          <a href="/live-session" className="primary-button">
            Start Live Session
          </a>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📚</div>
          <h2>Conversation History</h2>
          <p>View, manage, and analyze your past conversations with AI-powered summaries and speaking feedback.</p>
          <a href="/conversations" className="primary-button">
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
  );
}
