'use client';

import { useAuth } from '../lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ScreenShare from '../components/ScreenShare';

export default function LiveSessionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="notion-live-session">
      {/* Notion-style Top Nav */}
      <nav className="notion-nav">
        <div className="nav-left">
          <button onClick={() => router.push('/')} className="nav-back">
            ←
          </button>
          <span className="nav-title">Live Session</span>
        </div>
        <div className="nav-right">
          <span className="nav-user">{user.email}</span>
        </div>
      </nav>

      {/* Motivational Quote */}
      <div className="motivational-quote">
        <p className="quote-text">"The art of communication is the language of leadership."</p>
        <p className="quote-author">— James Humes</p>
      </div>

      {/* Main Content */}
      <div className="notion-session-content">
        <ScreenShare user={user} />
      </div>
    </div>
  );
}
