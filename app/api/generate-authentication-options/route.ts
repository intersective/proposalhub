// pages/api/generate-authentication-options.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { rpID } from '../../lib/webauthnConfig';
import { User, getUserByEmail, saveUserChallenge } from '../../lib/userDatabase';

export const POST = async (req: NextRequest) => {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  const user = await getUserByEmail(email) as User;

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

  const options = await generateAuthenticationOptions({
    rpID: rpID || 'default-rp-id',
    userVerification: 'preferred',
    allowCredentials: user.credentials.map((cred: { credentialID: string }) => ({
      id: cred.credentialID,
      type: 'public-key',
      transports: ['internal'],
    })),
  });
  console.log('Options:', options);
  await saveUserChallenge(user.id, options.challenge);

  return NextResponse.json(options, { status: 200 });
};
