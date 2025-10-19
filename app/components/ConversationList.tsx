'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/lib/firebase/AuthContext';

interface Conversation {
  id: string;
  title: string;
  date: string;
  userId: string;
}

export default function ConversationList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/conversations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await response.json();
        setConversations(data.conversations);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (loading) {
    return <div className="sidebar-loading">Loading conversations...</div>;
  }

  if (error) {
    return <div className="sidebar-error">Error: {error}</div>;
  }

  return (
    <div className="conversation-list">
      <h2>Conversations</h2>
      {conversations.length === 0 ? (
        <p className="empty-state">No conversations yet</p>
      ) : (
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link href={`/conversation/${conversation.id}`}>
                <div className="conversation-item">
                  <h3>{conversation.title}</h3>
                  <time>{new Date(conversation.date).toLocaleDateString()}</time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
