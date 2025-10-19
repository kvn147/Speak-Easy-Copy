---
title: Debugging Firebase Authentication Issues
date: 2025-10-18T04:58:06.796Z
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
1. **Wrong Auth Domain** - Check your `.env.local`
   ```
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   ```

2. **Missing Authorized Domains** in Firebase Console:
   - Go to Authentication → Settings → Authorized domains
   - Add `localhost` for development
   - Add your production domain

3. **Token Verification Issues** - Make sure Admin SDK is configured

## User
How do I verify my Admin SDK is working?

## Assistant
You can test the Admin SDK with this checklist:

### Verification Steps:

1. **Check Environment Variables**
   ```bash
   # Print (carefully!) to verify they're loaded
   echo $FIREBASE_ADMIN_PROJECT_ID
   ```

2. **Test Token Verification**
   Your API routes should log errors. Check:
   ```javascript
   console.error('Error verifying token:', error);
   ```

3. **Verify Service Account Permissions**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Ensure the service account has "Firebase Admin SDK Administrator Service Agent" role

4. **Check Private Key Format**
   - Must be wrapped in quotes
   - Must include `\n` characters
   - Should start with `-----BEGIN PRIVATE KEY-----`

## User
Everything works now! Any tips to prevent these issues?

## Assistant
Absolutely! Here are some best practices:

### Development Setup
```bash
# 1. Copy example env file
cp .env.local.example .env.local

# 2. Never commit .env.local
echo ".env.local" >> .gitignore

# 3. Document required env vars in README
```

### Error Handling
```typescript
// Add detailed error logging
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error: any) {
  console.error('Auth error:', error.code, error.message);
  // Show user-friendly message
}
```

### Testing Checklist
- [ ] Firebase config loaded correctly
- [ ] Authentication provider enabled
- [ ] Admin SDK credentials valid
- [ ] Authorized domains configured
- [ ] API routes return 200 for valid tokens

Keep this checklist handy for future debugging!
