'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import ConversationViewer from '@/app/components/ConversationViewer';
import ConversationList from '@/app/components/ConversationList';
import { useAuth } from '@/app/lib/firebase/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <Link href="/" className="sidebar-logo-link">
                <Image
                  src="/assets/images/speak-easy-icon.png"
                  alt="SpeakEasy Logo"
                  width={32}
                  height={32}
                  className="sidebar-logo"
                />
              </Link>
              <h1>My Conversations</h1>
            </div>
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
