import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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

// Base directory for markdown files
const CONVERSATIONS_DIR = path.join(process.cwd(), 'conversations');

/**
 * Get all conversations for a specific user
 */
export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  const userDir = path.join(CONVERSATIONS_DIR, userId);

  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(userDir);
  const mdFiles = files.filter((file) => file.endsWith('.md'));

  const conversations: Conversation[] = mdFiles.map((filename) => {
    const filePath = path.join(userDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);

    return {
      id: filename.replace('.md', ''),
      title: data.title || filename.replace('.md', ''),
      date: data.date || new Date().toISOString(),
      userId,
    };
  });

  // Sort by date, newest first
  conversations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return conversations;
}

/**
 * Get a specific conversation by ID for a user
 */
export async function getConversationById(
  userId: string,
  conversationId: string
): Promise<ConversationDetail | null> {
  const filePath = path.join(CONVERSATIONS_DIR, userId, `${conversationId}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
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
export function canAccessConversation(userId: string, conversationId: string): boolean {
  const filePath = path.join(CONVERSATIONS_DIR, userId, `${conversationId}.md`);
  return fs.existsSync(filePath);
}

/**
 * Create example conversation files for a user (helper for testing)
 */
export function createExampleConversations(userId: string): void {
  const userDir = path.join(CONVERSATIONS_DIR, userId);
  
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

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
Welcome! This is a Notion-like markdown viewer with Firebase authentication. Each conversation is stored as a markdown file, and only you can see your own conversations.

## User
That sounds great! What features are available?

## Assistant
You can:
- View all your conversations in a sidebar
- Read markdown-formatted dialogue
- See feedback and summaries for each conversation
- Secure authentication ensures privacy
`;

  fs.writeFileSync(
    path.join(userDir, 'welcome-conversation.md'),
    exampleConversation
  );
}

/**
 * Read a conversation file and return its content
 */
export async function readConversationFile(
  userId: string,
  conversationId: string
): Promise<{ content: string; frontmatter: any } | null> {
  const filePath = path.join(CONVERSATIONS_DIR, userId, `${conversationId}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
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
  const filePath = path.join(CONVERSATIONS_DIR, userId, `${conversationId}.md`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);

  // Merge updates into frontmatter
  const updatedData = {
    ...data,
    ...updates,
  };

  // Reconstruct the file with updated frontmatter
  const updatedFile = matter.stringify(content, updatedData);
  fs.writeFileSync(filePath, updatedFile, 'utf8');

  return true;
}
