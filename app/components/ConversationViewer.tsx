'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/lib/firebase/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ConversationDetail {
  id: string;
  title: string;
  date: string;
  dialogue: string;
  feedback: string;
  summary: string;
  userId: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  topic: string;
}

interface ConversationViewerProps {
  conversationId: string;
}

export default function ConversationViewer({ conversationId }: ConversationViewerProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [newsHeadlines, setNewsHeadlines] = useState<NewsArticle[]>([]);
  const [newsTopics, setNewsTopics] = useState<string[]>([]);

  // Debug logging for feedback
  useEffect(() => {
    console.log('🔍 Conversation feedback changed:', conversation?.feedback ? 'EXISTS' : 'NULL');
  }, [conversation?.feedback]);

  useEffect(() => {
    if (!user || !conversationId) return;

    const fetchConversation = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/conversations/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch conversation');
        }

        const data = await response.json();
        setConversation(data.conversation);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [user, conversationId]);

  const handleGenerateSummary = async () => {
    if (!user || !conversationId) return;

    setGeneratingSummary(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/conversations/${conversationId}/summarize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      
      // Update the conversation with the new summary
      if (conversation) {
        setConversation({
          ...conversation,
          summary: data.summary,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!user || !conversationId) return;

    setGeneratingFeedback(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/conversations/${conversationId}/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const data = await response.json();
      
      console.log('📝 Received feedback from API:', data.feedback);
      
      // Update the conversation with the new feedback
      if (conversation) {
        console.log('📝 Updating conversation state with feedback');
        setConversation({
          ...conversation,
          feedback: data.feedback,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingFeedback(false);
    }
  };

  const handleFetchNews = async () => {
    if (!user || !conversationId) return;

    setFetchingNews(true);
    setError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/conversations/${conversationId}/news`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      
      if (data.headlines && data.headlines.length > 0) {
        setNewsHeadlines(data.headlines);
        setNewsTopics(data.topics || []);
      } else {
        setError('No relevant news headlines found for this conversation');
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError('Failed to fetch news articles: ' + err.message);
    } finally {
      setFetchingNews(false);
    }
  };

  if (loading) {
    return (
      <div className="conversation-viewer loading">
        <div className="loading-spinner"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conversation-viewer error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="conversation-viewer not-found">
        <h2>Conversation Not Found</h2>
        <p>The requested conversation does not exist or you don't have access to it.</p>
      </div>
    );
  }

  return (
    <div className="conversation-viewer">
      <header className="conversation-header">
        <h1>{conversation.title}</h1>
        <time>{new Date(conversation.date).toLocaleDateString()}</time>
        <div className="ai-actions">
          <button 
            onClick={handleGenerateSummary} 
            disabled={generatingSummary}
            className="ai-button"
          >
            {generatingSummary ? (
              <>
                <span className="spinner"></span>
                Generating...
              </>
            ) : (
              '✨ Generate Summary'
            )}
          </button>
          <button 
            onClick={handleGenerateFeedback} 
            disabled={generatingFeedback}
            className="ai-button"
          >
            {generatingFeedback ? (
              <>
                <span className="spinner"></span>
                Generating...
              </>
            ) : (
            '💬 Get Speaking Feedback'
          )}
          </button>
          <button 
            onClick={handleFetchNews} 
            disabled={fetchingNews}
            className="ai-button"
          >
            {fetchingNews ? (
              <>
                <span className="spinner"></span>
                Finding News...
              </>
            ) : (
              '📰 Find Relevant Article'
            )}
          </button>
        </div>
      </header>

      {newsHeadlines.length > 0 && (
        <section className="conversation-section news-headlines-section">
          <h2>📰 We recommend you to read this:</h2>
          
          {newsTopics.length > 0 && (
            <div className="news-keywords">
              <p className="keywords-label">Topics: </p>
              <div className="keywords-list">
                {newsTopics.map((topic, index) => (
                  <span key={index} className="keyword-tag">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="headlines-grid">
            {newsHeadlines.map((headline, index) => (
              <a
                key={index}
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                className="headline-card"
              >
                <div className="headline-number">{index + 1}</div>
                <div className="headline-content">
                  <h3 className="headline-title">{headline.title}</h3>
                  <p className="headline-meta">
                    <span className="headline-source">{headline.source}</span>
                    <span className="headline-topic">{headline.topic}</span>
                  </p>
                  <p className="headline-description">{headline.description}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {conversation.summary && (
        <section className="conversation-section summary">
          <h2>Summary</h2>
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {conversation.summary}
            </ReactMarkdown>
          </div>
        </section>
      )}

      <section className="conversation-section dialogue">
        <h2>Dialogue</h2>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {conversation.dialogue}
          </ReactMarkdown>
        </div>
      </section>

      {conversation.feedback && (
        <section className="conversation-section feedback">
          <h2>💬 Speaking Feedback</h2>
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {conversation.feedback}
            </ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}
