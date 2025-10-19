import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase/adminConfig';
import { getConversationById, canAccessConversation } from '@/app/lib/markdown';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id } = await params;
    
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const conversationId = id;

    // Check if user has access to this conversation
    if (!canAccessConversation(userId, conversationId)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this conversation' },
        { status: 403 }
      );
    }

    // Get the conversation
    const conversation = await getConversationById(userId, conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
