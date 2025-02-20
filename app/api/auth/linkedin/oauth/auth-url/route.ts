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
    // Generate a unique state token
    const state = uuidv4();
    
    // Store the state token in the database with an expiration
    await adminDb.collection('linkedinAuthStates').doc(state).set({
      userId: session.user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    // Generate the LinkedIn OAuth URL
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.LINKEDIN_ID || '');
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'openid profile email');

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
} 