// pages/api/verify-authentication.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { rpID, origin } from '../../lib/webauthnConfig';
import { User, getUserByEmail, updateUserCredentialCounter, getUserChallenge } from '../../lib/userDatabase';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

export const POST = async (req: NextRequest) => {
  const { email, assertionResponse } = await req.json();
  const user = await getUserByEmail(email) as User;
  if (!user || !user.id) {
    return NextResponse.json({ verified: false, error: 'User not found' }, { status: 400 });
  }
  console.log('In verify-authentication, user:', user);
  const expectedChallenge = await getUserChallenge(user.id);
  if (!expectedChallenge) {
    return NextResponse.json({ verified: false, error: 'Challenge not found' }, { status: 400 });
  }

  const dbAuthenticator = user.credentials?.find(
      (cred: { credentialID: string }) => cred.credentialID === assertionResponse.id
  );
  console.log('In verify-authentication, dbAuthenticator:', dbAuthenticator);
  if (!dbAuthenticator) {
    return NextResponse.json({ verified: false, error: 'Authenticator not found' }, { status: 400 });
  }

  try {
    // credentialPublicKey is stored as a base64url string in the database
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID || '',
      requireUserVerification: true,
      credential: {
        publicKey: dbAuthenticator.credentialPublicKey,
        id: dbAuthenticator.credentialID,
        counter: dbAuthenticator.counter || 0
      },
    });
    console.log('In verify-authentication, verification:', verification);
    if (verification.verified) {
      // Update counter
      await updateUserCredentialCounter(user.id, dbAuthenticator.credentialID, verification.authenticationInfo.newCounter);

      // Set a session cookie
      const response = NextResponse.json({ verified: true }, { status: 200 });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_PRIVATE_KEY!, {
        expiresIn: '1d', algorithm: 'RS256'
      });

      response.headers.set('Set-Cookie', serialize('admin_auth', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24, // 1 day
      }));
      return response;
    } else {
      return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error during authentication verification:', error);
    return NextResponse.json({ verified: false, error: 'Authentication verification failed' }, { status: 500 });
  }
};