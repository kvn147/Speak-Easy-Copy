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
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        padding: '1rem 2rem',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          ← Back to Home
        </button>
        <div style={{ color: 'white', fontSize: '14px' }}>
          {user.email}
        </div>
      </nav>
      <div style={{ paddingTop: '60px' }}>
        <ScreenShare user={user} />
      </div>
    </div>
  );
}
