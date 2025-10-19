# Gemini API Setup Guide

This guide will walk you through setting up the Gemini API for AI-powered auto-summarization and speaking feedback features.

## Prerequisites

- A Google account
- The project already has `@google/genai` installed (Gemini 2.5 API)

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key" or "Get Started"
3. Sign in with your Google account
4. Click "Create API Key" 
5. Select a Google Cloud project (or create a new one)
6. Copy your API key (keep it secure!)

## Step 2: Add API Key to Environment

1. Open your `.env.local` file in the project root
2. Find the line: `GEMINI_API_KEY=your_gemini_api_key_here`
3. Replace `your_gemini_api_key_here` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyC...your_actual_key_here
   ```
4. Save the file

## Step 3: Restart Your Development Server

After adding the API key, restart your Next.js dev server:

```bash
npm run dev
```

## Features

### Auto-Summarization
- Powered by **Gemini 2.5 Flash** model
- Analyzes conversation dialogues
- Generates concise summaries (under 200 words)
- Focuses on main topics, key decisions, and takeaways
- Updates the conversation markdown file automatically

### Speaking Feedback
- Powered by **Gemini 2.5 Flash** model
- Provides constructive communication feedback
- Analyzes clarity, engagement, and conversation flow
- Identifies strengths and areas for improvement
- Offers actionable suggestions
- Professional and encouraging tone

## Usage

1. Navigate to any conversation in your viewer
2. Click the **"✨ Generate Summary"** button to auto-generate a summary
3. Click the **"💬 Get Speaking Feedback"** button to receive speaking analysis
4. The generated content will automatically save to the markdown file
5. Refresh to see the updated content in the Summary and Feedback sections

## API Endpoints

### POST `/api/conversations/[id]/summarize`
Generates an AI-powered summary of the conversation dialogue.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Response:**
```json
{
  "success": true,
  "summary": "Generated summary text..."
}
```

### POST `/api/conversations/[id]/feedback`
Generates AI-powered speaking feedback for the conversation.

**Headers:**
- `Authorization: Bearer <firebase-id-token>`

**Response:**
```json
{
  "success": true,
  "feedback": "Generated feedback text..."
}
```

## Security Notes

- Never commit your `.env.local` file to version control
- The `.gitignore` file already excludes `.env.local`
- API keys are server-side only and never exposed to the client
- All endpoints require Firebase authentication

## Troubleshooting

### "Failed to generate summary/feedback"
- Verify your API key is correct in `.env.local`
- Check that you've restarted the dev server after adding the key
- Ensure your Google Cloud project has the Generative AI API enabled

### "Unauthorized" error
- Make sure you're logged in
- Check that your Firebase authentication is working
- Verify the token is being sent correctly

### Rate Limiting
- Gemini API has rate limits for free tier
- Consider implementing caching or rate limiting for production
- Monitor your usage in Google AI Studio

## Cost

- **Gemini 2.5 Flash** has a generous free tier
- Free tier: 15 requests per minute, 1500 requests per day
- Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)
- Each conversation generates 2 API calls (summary + feedback) if both features are used

## Next Steps

- Implement caching to avoid regenerating summaries
- Add loading indicators during generation
- Customize prompts for your specific use case
- Integrate with your video transcription app workflow
