'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import ConversationViewer from '@/app/components/ConversationViewer';
import ConversationList from '@/app/components/ConversationList';
import { useAuth } from '@/app/lib/firebase/AuthContext';
import Link from 'next/link';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link href="/">
              <h1>My Conversations</h1>
            </Link>
            <div className="user-info">
              <p>{user?.email}</p>
              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
          <ConversationList />
        </aside>
        <main className="main-content">
          <ConversationViewer conversationId={conversationId} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
