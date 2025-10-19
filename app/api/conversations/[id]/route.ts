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
    console.log(`[API] GET /api/conversations/${id}`);

    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[API] Unauthorized request for conversation ${id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log(`[API] User ${userId} requesting conversation ${id}`);

    const conversationId = id;

    // Check if user has access to this conversation
    console.log(`[API] Checking access for user ${userId} to conversation ${conversationId}`);
    const hasAccess = await canAccessConversation(userId, conversationId);
    if (!hasAccess) {
      console.warn(`[API] Access denied for user ${userId} to conversation ${conversationId}`);
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this conversation' },
        { status: 403 }
      );
    }

    // Get the conversation
    console.log(`[API] Fetching conversation data for ${conversationId}`);
    const conversation = await getConversationById(userId, conversationId);

    if (!conversation) {
      console.warn(`[API] Conversation ${conversationId} not found`);
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Successfully retrieved conversation ${conversationId}, dialogue length: ${conversation.dialogue?.length || 0}`);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('[API] Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}
