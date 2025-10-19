# Firebase Setup Guide

Follow these steps to configure Firebase for your Markdown Viewer application.

## Prerequisites
- A Google account
- Node.js 18+ installed

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "markdown-viewer")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for the project to be created

## Step 2: Enable Authentication

1. In the Firebase Console, select your project
2. Click **"Authentication"** in the left sidebar
3. Click **"Get started"**
4. Go to the **"Sign-in method"** tab
5. Click on **"Email/Password"**
6. Toggle **"Enable"** to ON
7. Click **"Save"**

## Step 3: Get Web App Credentials

1. In the Firebase Console project overview, click the **Web icon (</>) **
2. Register your app with a nickname (e.g., "markdown-viewer-web")
3. **Do NOT** check "Also set up Firebase Hosting"
4. Click **"Register app"**
5. Copy the `firebaseConfig` object that appears
6. Keep this information handy for Step 5

The config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 4: Generate Firebase Admin SDK Service Account

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Go to the **"Service accounts"** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the confirmation dialog
6. A JSON file will be downloaded - **keep this file secure!**
7. Open the JSON file and note these values:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 5: Configure Environment Variables

1. In your project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in the values:

   **From Step 3 (Web App Config):**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

   **From Step 4 (Service Account JSON):**
   ```env
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here (keep the \n characters)\n-----END PRIVATE KEY-----\n"
   ```

   **Important:** The private key must include the `\n` newline characters and be wrapped in quotes.

3. Save the `.env.local` file

## Step 6: Add .env.local to .gitignore

Make sure your `.env.local` file is in `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

## Step 7: Install Dependencies

```bash
npm install
```

## Step 8: Create Example Markdown Files

The app reads markdown files from the `conversations/{userId}/` directory structure. After signing up, you can manually create a conversation file:

1. Start the app (see Step 9)
2. Sign up with an email and password
3. Check your browser console or Firebase Console for your user ID
4. Create a directory structure:
   ```bash
   mkdir -p conversations/{your-user-id}
   ```
5. Create a markdown file (e.g., `conversations/{your-user-id}/test-conversation.md`):
   ```markdown
   ---
   title: My First Conversation
   date: 2025-10-18T12:00:00Z
   summary: This is a test conversation
   feedback: Great conversation!
   ---

   # Dialogue

   ## User
   Hello, how are you?

   ## Assistant
   I'm doing well, thank you! How can I help you today?
   ```

## Step 9: Run the Application

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 10: Test the Application

1. You'll be redirected to the login page
2. Click "Sign Up" to create a new account
3. Enter an email and password (minimum 6 characters)
4. After signing up, you'll be logged in automatically
5. You should see your conversations in the sidebar
6. Click on a conversation to view its content

## Troubleshooting

### "Cannot find module 'firebase'" errors
Run `npm install` to ensure all dependencies are installed.

### Authentication not working
- Double-check your `.env.local` file has the correct Firebase credentials
- Ensure Email/Password authentication is enabled in Firebase Console
- Restart the dev server after changing `.env.local`

### API routes returning 401/403 errors
- Verify the Firebase Admin SDK credentials in `.env.local`
- Check that the private key includes `\n` characters and is properly quoted
- Ensure the service account has the necessary permissions

### No conversations showing
- Create markdown files in `conversations/{userId}/` directory
- Check that the markdown files have the correct frontmatter format
- Verify file permissions allow Node.js to read them

## Security Notes

1. **Never commit** your `.env.local` file or Firebase service account JSON
2. The `.env.local` file contains sensitive credentials
3. Keep your Firebase Admin SDK private key secure
4. Use Firebase Security Rules in production to add additional protection
5. Consider implementing rate limiting for authentication endpoints

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add all environment variables from `.env.local` to your hosting platform's environment variables
2. Ensure the `conversations/` directory structure exists or is created dynamically
3. Consider using cloud storage (Firebase Storage, S3) instead of filesystem for markdown files
4. Set up proper Firebase Security Rules
5. Enable Firebase App Check for additional security

## Next Steps

- Customize the UI styling in `app/globals.css`
- Add more conversation management features
- Implement markdown editing capabilities
- Add conversation search functionality
- Set up automated backups for markdown files
