import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase/adminConfig';
import { generateExampleConversations } from '@/app/lib/generateExamples';

/**
 * POST /api/init-user
 * Creates example markdown files for a new user
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 /api/init-user called');
    
    // Get the authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔐 Token received, verifying...');

    // Verify the token
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log('✅ Token verified for user:', userId);

    // Generate example conversations for this user
    console.log('📝 Generating example conversations...');
    generateExampleConversations(userId);
    console.log('✅ Example conversations created successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Example conversations created',
      userId 
    });
  } catch (error: any) {
    console.error('❌ Error initializing user:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json(
      { error: 'Failed to initialize user', details: error.message },
      { status: 500 }
    );
  }
}
