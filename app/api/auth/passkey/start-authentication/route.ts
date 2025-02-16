// pages/api/auth/start-authentication.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { rpID } from '@/app/lib/webauthnConfig';
import { getUserByEmail, saveUserChallenge } from '@/app/lib/database/userDatabase';
import { UserRecord } from '@/app/types/user';

export const POST = async (req: NextRequest) => {
  console.log('Starting authentication options generation...');
  const { email } = await req.json();
  console.log('Received email:', email);
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  
  console.log('Looking up user by email...');
  const user = await getUserByEmail(email) as UserRecord;
  console.log('User lookup result:', { 
    found: !!user, 
    hasId: !!user?.id,
    hasCredentials: user?.credentials?.length ? user.credentials.length > 0 : false
  });

  if (!user || !user.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  if (!user.credentials || user.credentials.length === 0) {
    return NextResponse.json({ error: 'No credentials found for user'}, { status: 401 });
  }

  console.log('Generating authentication options...');
  const options = await generateAuthenticationOptions({
    rpID: rpID || 'default-rp-id',
    userVerification: 'preferred',
    allowCredentials: user.credentials.map((cred: { credentialID: string }) => ({
      id: Buffer.from(cred.credentialID, 'base64'),
      type: 'public-key',
      transports: ['internal'],
    })),
  });
  console.log('Generated options:', { 
    rpID: rpID,
    allowCredentialsCount: options.allowCredentials?.length
  });
  
  console.log('Saving user challenge...');
  try {
    await saveUserChallenge(user.id, options.challenge);
    console.log('Challenge saved successfully');
  } catch (error) {
    console.error('Error saving challenge:', error);
    return NextResponse.json({ error: 'Failed to save challenge' }, { status: 500 });
  }

  return NextResponse.json(options, { status: 200 });
};

