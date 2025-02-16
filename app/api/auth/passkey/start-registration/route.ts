// pages/api/auth/passkey/start-registration.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { rpName, rpID } from '@/app/lib/webauthnConfig';
import { User, getUserById, saveUserChallenge } from '@/app/lib/database/userDatabase';

export const POST = async (req: NextRequest) => {
  const { id } = await req.json();
  const user = await getUserById(id) as User;

  if (!user || !user.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const options = await generateRegistrationOptions({
    rpName: rpName || 'Default RP Name',
    rpID: rpID || 'default-rp-id',
    userID: user.userId,
    userName: user.email,
    userDisplayName: user.email,
    attestationType: 'none',
    excludeCredentials: (user.credentials ?? []).map(passkey => ({
      id: Buffer.from(passkey.credentialID, 'base64'),
      type: 'public-key',
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });
  console.log('Options from generateRegOptions:', options);
  // Save the challenge to the user's session or database
  await saveUserChallenge(user.id, options.challenge);

  return NextResponse.json(options, { status: 200 });
};
