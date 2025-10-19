# Markdown Conversation Format Guide

This guide explains how to create your own conversation markdown files.

## File Location

Place your markdown files in: `conversations/{your-userId}/filename.md`

To find your userId:
1. Sign in to the app
2. Check Firebase Console → Authentication → Users
3. Copy your User UID

## File Structure

Every conversation file has two parts:

1. **Frontmatter** (YAML metadata at the top)
2. **Content** (Markdown body)

## Template

```markdown
---
title: Your Conversation Title
date: 2025-10-18T12:00:00Z
summary: A brief summary of what this conversation is about
feedback: Your thoughts, notes, or feedback about the conversation
---

# Dialogue

## User
Your question or message here...

## Assistant
The response here...

## User
Follow-up question...

## Assistant
Follow-up response...
```

## Frontmatter Fields

### Required Fields

- **title**: The conversation title (shown in sidebar)
  ```yaml
  title: Learning React Hooks
  ```

- **date**: ISO 8601 date string
  ```yaml
  date: 2025-10-18T14:30:00Z
  ```

### Optional Fields

- **summary**: High-level overview (displayed in a highlighted box)
  ```yaml
  summary: This conversation covers useState and useEffect basics
  ```

- **feedback**: Personal notes or reflections (displayed in a green box)
  ```yaml
  feedback: Very helpful explanation with good examples
  ```

## Content Formatting

The content after the frontmatter supports full Markdown:

### Headings
```markdown
# Main Heading
## Subheading
### Smaller Heading
```

### Text Formatting
```markdown
**bold text**
*italic text*
`inline code`
```

### Lists
```markdown
- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2
```

### Code Blocks
````markdown
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

### Blockquotes
```markdown
> This is a quote
> It can span multiple lines
```

### Links
```markdown
[Link text](https://example.com)
```

### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
```

## Conversation Dialog Format

Use `## User` and `## Assistant` headers to structure dialogue:

```markdown
## User
What is React?

## Assistant
React is a JavaScript library for building user interfaces...

## User
How do I get started?

## Assistant
You can start by creating a new React app with...
```

## Complete Example

```markdown
---
title: Understanding TypeScript Generics
date: 2025-10-18T09:00:00Z
summary: Deep dive into TypeScript generic types and their practical applications
feedback: Excellent examples that clarified a confusing topic!
---

# Dialogue

## User
Can you explain TypeScript generics? I find them confusing.

## Assistant
Generics allow you to write reusable code that works with multiple types!

Think of generics like a placeholder for a type:

```typescript
function identity<T>(arg: T): T {
  return arg;
}

// Usage
const num = identity<number>(42);
const str = identity<string>("hello");
```

The `<T>` is a type variable that gets replaced with the actual type.

## User
When would I use this in real code?

## Assistant
Great question! Here are common use cases:

### 1. Array Functions
```typescript
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

### 2. API Responses
```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Use with different data types
type UserResponse = ApiResponse<User>;
type ProductResponse = ApiResponse<Product>;
```

### 3. React Components
```typescript
interface Props<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: Props<T>) {
  return <>{items.map(renderItem)}</>;
}
```

## User
This makes so much more sense now. Thanks!

## Assistant
You're welcome! The key is that generics let you write type-safe code without duplicating logic for each type.

**Pro tip:** Start simple and add generics when you notice you're repeating code for different types.
```

## Tips

1. **File Naming**: Use descriptive, URL-friendly names
   - ✅ `learning-typescript-generics.md`
   - ✅ `2025-10-18-team-meeting.md`
   - ❌ `My Conversation!!!.md`

2. **Dates**: Use ISO 8601 format for consistency
   ```yaml
   date: 2025-10-18T14:30:00Z
   ```

3. **Summaries**: Keep them concise (1-2 sentences)

4. **Dialogue Structure**: Use consistent headers (`## User`, `## Assistant`)

5. **Code Blocks**: Always specify the language for syntax highlighting

## Finding Your User ID

To manually create files, you need your Firebase User UID:

### Method 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Authentication" → "Users"
4. Find your email and copy the User UID

### Method 2: Browser Console
1. Log in to the app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run: `firebase.auth().currentUser.uid`

## Testing Your File

After creating a markdown file:

1. Refresh the app
2. Your conversation should appear in the sidebar
3. Click it to view
4. If it doesn't appear, check:
   - File is in correct directory: `conversations/{userId}/`
   - Frontmatter is valid YAML
   - File has `.md` extension

## Advanced: Custom Fields

You can add custom fields to frontmatter:

```yaml
---
title: Custom Conversation
date: 2025-10-18T12:00:00Z
summary: Regular summary
feedback: Regular feedback
tags: [react, typescript, tutorial]
difficulty: intermediate
duration: 30min
---
```

Note: Custom fields won't be displayed by default but can be accessed by modifying the viewer components.

## Need Help?

- Check `conversations/README.md` for directory structure
- See example files generated on signup
- Review the viewer at `app/components/ConversationViewer.tsx` for rendering details
