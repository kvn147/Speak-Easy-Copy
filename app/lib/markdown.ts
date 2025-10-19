import matter from 'gray-matter';
import { uploadToS3, downloadFromS3, listUserFiles, getConversationKey } from './s3';

export interface Conversation {
  id: string;
  title: string;
  date: string;
  userId: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  date: string;
  dialogue: string;
  feedback: string;
  summary: string;
  userId: string;
}

/**
 * Get all conversations for a specific user
 */
export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  // List all files in user's S3 folder
  const s3Keys = await listUserFiles(userId);

  if (s3Keys.length === 0) {
    return [];
  }

  const conversations = await Promise.all(
    s3Keys.map(async (key) => {
      const filename = key.split('/').pop() || '';
      const conversationId = filename.replace('.md', '');

      // Download and parse the file
      const fileContents = await downloadFromS3(key);
      if (!fileContents) {
        return null;
      }

      const { data } = matter(fileContents);

      return {
        id: conversationId,
        title: data.title || conversationId,
        date: data.date || new Date().toISOString(),
        userId,
      };
    })
  );

  // Filter out null values and sort by date, newest first
  const validConversations = conversations.filter((c): c is Conversation => c !== null);
  validConversations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return validConversations;
}

/**
 * Get a specific conversation by ID for a user
 */
export async function getConversationById(
  userId: string,
  conversationId: string
): Promise<ConversationDetail | null> {
  const key = getConversationKey(userId, conversationId);
  const fileContents = await downloadFromS3(key);

  if (!fileContents) {
    return null;
  }

  const { data, content } = matter(fileContents);

  return {
    id: conversationId,
    title: data.title || conversationId,
    date: data.date || new Date().toISOString(),
    dialogue: data.dialogue || content,
    feedback: data.feedback || '',
    summary: data.summary || '',
    userId,
  };
}

/**
 * Check if a user has access to a conversation
 */
export async function canAccessConversation(userId: string, conversationId: string): Promise<boolean> {
  const key = getConversationKey(userId, conversationId);
  const content = await downloadFromS3(key);
  return content !== null;
}

/**
 * Create example conversation files for a user (helper for testing)
 */
export async function createExampleConversations(userId: string): Promise<void> {
  const exampleConversation = `---
title: Welcome Conversation
date: ${new Date().toISOString()}
summary: Introduction to the markdown viewer
feedback: Great first conversation!
---

# Dialogue

## User
Hello! How does this system work?

## Assistant
Welcome! This is a Notion-like markdown viewer with Firebase authentication. Each conversation is stored as a markdown file in S3, and only you can see your own conversations.

## User
That sounds great! What features are available?

## Assistant
You can:
- View all your conversations in a sidebar
- Read markdown-formatted dialogue
- See feedback and summaries for each conversation
- Secure authentication ensures privacy
- All conversations stored securely in AWS S3
`;

  const key = getConversationKey(userId, 'welcome-conversation');
  await uploadToS3(key, exampleConversation);
}

/**
 * Read a conversation file and return its content
 */
export async function readConversationFile(
  userId: string,
  conversationId: string
): Promise<{ content: string; frontmatter: any } | null> {
  const key = getConversationKey(userId, conversationId);
  const fileContents = await downloadFromS3(key);

  if (!fileContents) {
    return null;
  }

  const { data, content } = matter(fileContents);

  return {
    content,
    frontmatter: data,
  };
}

/**
 * Update a conversation file with new frontmatter data
 */
export async function updateConversationFile(
  userId: string,
  conversationId: string,
  updates: { summary?: string; feedback?: string }
): Promise<boolean> {
  const key = getConversationKey(userId, conversationId);
  const fileContents = await downloadFromS3(key);

  if (!fileContents) {
    return false;
  }

  const { data, content } = matter(fileContents);

  // Merge updates into frontmatter
  const updatedData = {
    ...data,
    ...updates,
  };

  // Reconstruct the file with updated frontmatter
  const updatedFile = matter.stringify(content, updatedData);
  await uploadToS3(key, updatedFile);

  return true;
}
