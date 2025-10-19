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
    <div>
      <nav className="live-session-nav">
        <button
          onClick={() => router.push('/')}
          className="nav-back-button"
        >
          ← Back to Home
        </button>
        <div className="nav-user-email">
          {user.email}
        </div>
      </nav>
      <div style={{ paddingTop: '60px' }}>
        <ScreenShare user={user} />
      </div>
    </div>
  );
}
