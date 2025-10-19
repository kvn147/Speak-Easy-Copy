import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@/app/lib/firebase/adminConfig';
import { readConversationFile, updateConversationFile } from '@/app/lib/markdown';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Read the conversation file
    const conversation = await readConversationFile(userId, id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Extract dialogue content
    const dialogueContent = conversation.content.split('## Summary')[0].trim();

    // Generate summary using Gemini
    const prompt = `Please provide a concise summary of the following conversation. Focus on the main topics discussed, key decisions made, and important takeaways. Keep the summary under 200 words.

Conversation:
${dialogueContent}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const summary = response.text;

    // Update the conversation file with the new summary
    await updateConversationFile(userId, id, { summary });

    return NextResponse.json({ 
      success: true, 
      summary 
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
