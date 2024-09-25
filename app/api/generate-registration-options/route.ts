// pages/api/generate-registration-options.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { rpName, rpID } from '../../lib/webauthnConfig';
import { User, getUserById, saveUserChallenge } from '../../lib/userDatabase';

export const POST = async (req: NextRequest) => {
  const { id } = await req.json();
  let user = await getUserById(id) as User;

  if (!user || !user.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 });
  }

  const options = await generateRegistrationOptions({
    rpName: rpName || 'Default RP Name',
    rpID: rpID || 'default-rp-id',
    userName: user.email,
    userDisplayName: user.email,
    attestationType: 'none',
    excludeCredentials: (user.credentials ?? []).map(passkey => ({
      id: passkey.credentialID,
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
