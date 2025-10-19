'use client';

import { useAuth } from './lib/firebase/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ConversationList from './components/ConversationList';

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
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
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>My Conversations</h1>
          <div className="user-info">
            <p>{user.email}</p>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
        <ConversationList />
      </aside>
      <main className="main-content">
        <div className="empty-state-main">
          <h2>Welcome to Your Markdown Viewer</h2>
          <p>Select a conversation from the sidebar to view its content.</p>
        </div>
      </main>
    </div>
  );
}
