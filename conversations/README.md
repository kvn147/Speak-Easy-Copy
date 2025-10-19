# Conversations Directory

This directory stores user conversation markdown files.

## Structure

```
conversations/
├── {userId-1}/
│   ├── conversation-1.md
│   ├── conversation-2.md
│   └── ...
├── {userId-2}/
│   ├── conversation-1.md
│   └── ...
└── .gitkeep
```

## Security

- Each user has their own subdirectory identified by their Firebase UID
- Users can only access files in their own directory
- API routes verify authentication before serving files

## File Format

Each conversation file should be a markdown file with frontmatter:

```markdown
---
title: Conversation Title
date: 2025-10-18T12:00:00Z
summary: Brief summary
feedback: User feedback
---

# Dialogue

Your conversation content here...
```

## DO NOT COMMIT USER DATA

- User directories are gitignored
- Only this README and .gitkeep are tracked
- Never commit actual conversation files to version control
