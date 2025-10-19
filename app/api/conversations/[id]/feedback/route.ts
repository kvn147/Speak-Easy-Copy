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
    console.log(dialogueContent)
    // Generate speaking feedback using Gemini
    const prompt = `Analyze the following conversation and provide constructive speaking feedback. Focus on:
1. Communication clarity and effectiveness
2. Conversation flow and engagement
3. Areas of strength
4. Specific suggestions for improvement
5. Overall speaking style assessment

Provide actionable, encouraging feedback in a professional tone. Keep the feedback under 300 words.

Conversation:
${dialogueContent}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const feedback = response.text;

    console.log('✅ Generated feedback:', feedback.substring(0, 5000) + '...');
    console.log(feedback)

    // Update the conversation file with the new feedback
    await updateConversationFile(userId, id, { feedback });
    
    console.log('✅ Updated conversation file with feedback');

    return NextResponse.json({ 
      success: true, 
      feedback 
    });

  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    );
  }
}
