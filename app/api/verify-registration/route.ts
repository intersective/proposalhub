// pages/api/verify-registration.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { rpID, origin } from '../../lib/webauthnConfig';
import { updateUserCredentials, getUserChallenge } from '../../lib/userDatabase';

const verifyRegistration = async (req: NextRequest) => {
  const { id, attestationResponse, options } = await req.json();
  console.log('verifyRegistration:', attestationResponse);
  //const user = await getUserById(userId);
  const expectedChallenge = await getUserChallenge(id);

  if (!expectedChallenge) {
    return NextResponse.json({ verified: false, error: 'Expected challenge is missing' }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response: attestationResponse,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (verification.verified) {
    if (!verification.registrationInfo) {
      return NextResponse.json({ verified: false, error: 'Registration info is missing' }, { status: 400 });
    }
    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
    const newCredential = {
      webAuthnUserID: options.user.id,
      credentialID: credentialID,
      credentialPublicKey: credentialPublicKey,
      counter,
      transports: attestationResponse.response.transports ?? ['internal'],
    };
    await updateUserCredentials(id, newCredential);
    return NextResponse.json({ verified: true }, { status: 200 });
  } else {
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 400 });
  }
};

export const POST = verifyRegistration;