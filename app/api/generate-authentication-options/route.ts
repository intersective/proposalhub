// pages/api/generate-authentication-options.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { rpID } from '../../lib/webauthnConfig';
import { User, getUserByEmail, saveUserChallenge } from '../../lib/userDatabase';

export const POST = async (req: NextRequest) => {
  console.log('Starting authentication options generation...');
  const { email } = await req.json();
  console.log('Received email:', email);
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  
  console.log('Looking up user by email...');
  const user = await getUserByEmail(email) as User;
  console.log('User lookup result:', { 
    found: !!user, 
    hasId: !!user?.id,
    role: user?.role,
    hasCredentials: user?.credentials?.length > 0 
  });

  if (!user || !user.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }
  
  // if the user role is not admin, or editor, return a 403
  if (!user.role || user.role !== 'admin' && user.role !== 'editor') {
    return NextResponse.json({ error: 'User does not have permission to login' }, { status: 403 });
  }

  if (!user.credentials || user.credentials.length === 0) {
    return NextResponse.json({ error: 'No credentials found for user'}, { status: 401 });
  }

  console.log('Generating authentication options...');
  const options = await generateAuthenticationOptions({
    rpID: rpID || 'default-rp-id',
    userVerification: 'preferred',
    allowCredentials: user.credentials.map((cred: { credentialID: string }) => ({
      id: cred.credentialID,
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
