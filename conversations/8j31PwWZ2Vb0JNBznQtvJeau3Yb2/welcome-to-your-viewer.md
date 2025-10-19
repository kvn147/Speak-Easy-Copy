---
title: Welcome to Your Markdown Viewer
date: 2025-10-19T04:58:06.796Z
summary: Introduction to your personal conversation viewer with features and capabilities
feedback: This is a great starting point to understand the system!
---

# Dialogue

## User
Hello! What is this application?

## Assistant
Welcome to your personal Markdown Viewer! This is a Notion-inspired application that lets you view and organize your conversations in a beautiful, secure environment.

Each conversation is stored as a markdown file on disk, and only you can see your own conversations. The system uses Firebase Authentication to ensure your privacy.

## User
What features are available?

## Assistant
Here are the key features:

### 📝 Markdown Support
- Full GitHub-flavored markdown rendering
- Code syntax highlighting
- Tables, lists, and formatting
- Links and images

### 🔒 Security
- Firebase Authentication
- User-isolated file storage
- JWT token verification on API routes
- Only you can access your conversations

### 🎨 User Interface
- Notion-inspired clean design
- Sidebar navigation
- Responsive layout
- Dark mode coming soon!

### 📊 Conversation Structure
Each conversation includes:
- **Dialogue** - The main conversation content
- **Summary** - High-level overview
- **Feedback** - Notes and reflections

## User
How do I add more conversations?

## Assistant
Currently, conversations are markdown files stored in the `conversations/{your-user-id}/` directory.

To add a new conversation:
1. Create a new `.md` file in your user directory
2. Add frontmatter with title, date, summary, and feedback
3. Write your dialogue content
4. Refresh the page to see it appear!

Future updates will include a built-in editor for creating conversations directly in the app.
