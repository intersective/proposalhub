import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Store the session ID in the database with an expiration
    await adminDb.collection('linkedinAuthSessions').doc(sessionId).set({
      userId: session.user.id,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    // Return the login URL with the session ID
    const loginUrl = `/api/linkedin/web/login?sessionId=${sessionId}`;

    return NextResponse.json({ url: loginUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
} 