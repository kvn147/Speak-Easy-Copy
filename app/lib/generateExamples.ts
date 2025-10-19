import fs from 'fs';
import path from 'path';

const CONVERSATIONS_DIR = path.join(process.cwd(), 'conversations');

export interface ExampleConversation {
  filename: string;
  content: string;
}

/**
 * Generate example conversation markdown files for a new user
 */
export function generateExampleConversations(userId: string): void {
  const userDir = path.join(CONVERSATIONS_DIR, userId);

  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  // Generate multiple example conversations
  const examples = getExampleConversations();

  examples.forEach((example) => {
    const filePath = path.join(userDir, example.filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, example.content, 'utf8');
    }
  });
}

/**
 * Get example conversation templates
 */
function getExampleConversations(): ExampleConversation[] {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();

  return [
    {
      filename: 'welcome-to-your-viewer.md',
      content: `---
title: Welcome to Your Markdown Viewer
date: ${now}
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
Currently, conversations are markdown files stored in the \`conversations/{your-user-id}/\` directory.

To add a new conversation:
1. Create a new \`.md\` file in your user directory
2. Add frontmatter with title, date, summary, and feedback
3. Write your dialogue content
4. Refresh the page to see it appear!

Future updates will include a built-in editor for creating conversations directly in the app.
`,
    },
    {
      filename: 'learning-react-hooks.md',
      content: `---
title: Learning React Hooks
date: ${yesterday}
summary: A conversation about understanding and using React Hooks effectively
feedback: Great technical discussion with practical examples
---

# Dialogue

## User
Can you explain React Hooks to me? I'm a bit confused about useState and useEffect.

## Assistant
Of course! React Hooks are functions that let you use React features in functional components.

### useState
\`useState\` lets you add state to functional components:

\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

- \`count\` is the current state value
- \`setCount\` is the function to update it
- \`0\` is the initial value

### useEffect
\`useEffect\` lets you perform side effects:

\`\`\`javascript
useEffect(() => {
  // This runs after render
  document.title = \`Count: \${count}\`;
}, [count]); // Only re-run when count changes
\`\`\`

## User
What about cleanup in useEffect?

## Assistant
Great question! useEffect can return a cleanup function:

\`\`\`javascript
useEffect(() => {
  const timer = setInterval(() => {
    console.log('Tick');
  }, 1000);

  // Cleanup function
  return () => {
    clearInterval(timer);
  };
}, []);
\`\`\`

The cleanup function runs:
1. Before the effect runs again
2. When the component unmounts

This prevents memory leaks!

## User
This is really helpful. What are some common mistakes?

## Assistant
Common mistakes with Hooks:

1. **Calling Hooks conditionally**
   ❌ Don't do this:
   \`\`\`javascript
   if (condition) {
     useState(0); // Wrong!
   }
   \`\`\`

2. **Missing dependencies**
   ❌ Don't do this:
   \`\`\`javascript
   useEffect(() => {
     console.log(count);
   }, []); // count is missing from deps!
   \`\`\`

3. **Not cleaning up subscriptions**
   Always return cleanup functions for:
   - Timers
   - Event listeners
   - WebSocket connections

✅ Always follow the Rules of Hooks!
`,
    },
    {
      filename: 'project-planning-session.md',
      content: `---
title: Project Planning Session - Q4 2025
date: ${lastWeek}
summary: Planning session for Q4 2025 project goals and milestones
feedback: Productive session with clear action items and timeline
---

# Dialogue

## User
Let's plan out the Q4 roadmap for our markdown viewer project.

## Assistant
Excellent! Let's break this down into phases:

## Phase 1: Core Features (Weeks 1-2)
- ✅ Firebase Authentication
- ✅ Markdown rendering
- ✅ User-isolated storage
- ✅ Conversation list view
- ✅ Individual conversation viewer

## Phase 2: Enhanced Features (Weeks 3-4)
- [ ] In-app markdown editor
- [ ] Search functionality
- [ ] Tags and categories
- [ ] Export conversations

## Phase 3: Polish (Weeks 5-6)
- [ ] Dark mode
- [ ] Mobile optimization
- [ ] Performance improvements
- [ ] Analytics dashboard

## User
What about collaboration features?

## Assistant
Great idea! Here's a proposed Phase 4:

## Phase 4: Collaboration (Weeks 7-8)
- [ ] Share conversations with other users
- [ ] Real-time collaborative editing
- [ ] Comments and annotations
- [ ] Team workspaces

### Technical Considerations:
1. **Firebase Firestore** for real-time data
2. **Firebase Storage** for file uploads
3. **WebSocket** or **Firebase Realtime Database** for live updates
4. **Role-based access control** (Owner, Editor, Viewer)

## User
What's the priority for Phase 2?

## Assistant
Based on user value and technical complexity, I'd prioritize:

### High Priority
1. **In-app markdown editor** - Most requested feature
2. **Search functionality** - Essential for usability

### Medium Priority
3. **Tags and categories** - Nice organizational feature
4. **Export conversations** - Good for data portability

### Timeline
- Week 3: Editor foundation
- Week 3.5: Search implementation
- Week 4: Tags + Export

Does this align with your vision?

## User
Perfect! Let's also add keyboard shortcuts.

## Assistant
Excellent addition! Here are some useful shortcuts:

### Navigation
- \`Cmd/Ctrl + K\` - Quick search
- \`Cmd/Ctrl + B\` - Toggle sidebar
- \`Cmd/Ctrl + N\` - New conversation

### Editing (future editor)
- \`Cmd/Ctrl + S\` - Save
- \`Cmd/Ctrl + B\` - Bold
- \`Cmd/Ctrl + I\` - Italic
- \`Cmd/Ctrl + K\` - Insert link

I'll add this as a sub-task for Phase 2!

### Action Items:
1. Create detailed specs for editor
2. Research markdown editor libraries
3. Design keyboard shortcut system
4. User testing plan
`,
    },
    {
      filename: 'debugging-firebase-auth.md',
      content: `---
title: Debugging Firebase Authentication Issues
date: ${yesterday}
summary: Troubleshooting common Firebase authentication problems and solutions
feedback: Helpful debugging session with clear resolution steps
---

# Dialogue

## User
I'm getting "auth/configuration-not-found" errors. What does this mean?

## Assistant
This error typically means Email/Password authentication isn't enabled in your Firebase Console.

### Solution:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

## User
Fixed! But now I'm getting CORS errors on API routes.

## Assistant
CORS errors with Firebase usually happen when:

### Common Causes:
1. **Wrong Auth Domain** - Check your \`.env.local\`
   \`\`\`
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   \`\`\`

2. **Missing Authorized Domains** in Firebase Console:
   - Go to Authentication → Settings → Authorized domains
   - Add \`localhost\` for development
   - Add your production domain

3. **Token Verification Issues** - Make sure Admin SDK is configured

## User
How do I verify my Admin SDK is working?

## Assistant
You can test the Admin SDK with this checklist:

### Verification Steps:

1. **Check Environment Variables**
   \`\`\`bash
   # Print (carefully!) to verify they're loaded
   echo $FIREBASE_ADMIN_PROJECT_ID
   \`\`\`

2. **Test Token Verification**
   Your API routes should log errors. Check:
   \`\`\`javascript
   console.error('Error verifying token:', error);
   \`\`\`

3. **Verify Service Account Permissions**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Ensure the service account has "Firebase Admin SDK Administrator Service Agent" role

4. **Check Private Key Format**
   - Must be wrapped in quotes
   - Must include \`\\n\` characters
   - Should start with \`-----BEGIN PRIVATE KEY-----\`

## User
Everything works now! Any tips to prevent these issues?

## Assistant
Absolutely! Here are some best practices:

### Development Setup
\`\`\`bash
# 1. Copy example env file
cp .env.local.example .env.local

# 2. Never commit .env.local
echo ".env.local" >> .gitignore

# 3. Document required env vars in README
\`\`\`

### Error Handling
\`\`\`typescript
// Add detailed error logging
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  console.error('Auth error:', error.code, error.message);
  // Show user-friendly message
}
\`\`\`

### Testing Checklist
- [ ] Firebase config loaded correctly
- [ ] Authentication provider enabled
- [ ] Admin SDK credentials valid
- [ ] Authorized domains configured
- [ ] API routes return 200 for valid tokens

Keep this checklist handy for future debugging!
`,
    },
  ];
}
