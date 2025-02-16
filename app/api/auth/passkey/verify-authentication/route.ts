// pages/api/auth/passkey/verify-authentication.ts
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { firestore } from '@/app/lib/firebaseAuth';
import { NextResponse } from 'next/server';
import { Credential } from '@/app/types/user';
import { auth, signIn } from '@/auth';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const rpOrigin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assertion, options, email } = body;

    // Get credential from database
    const userDoc = await firestore
      .collection('users')
      .where('email', '==', email)
      .get();

    if (userDoc.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    const credentials = userDoc.docs[0].data().credentials;
    console.log('verify-authentication credentials', credentials);
    const credential = credentials.find((cred: Credential) => cred.credentialID === assertion.id);
    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 400 }
      );
    }
   
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge: options.challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: Buffer.from(credential.credentialPublicKey, 'base64'),
        credentialID: Buffer.from(credential.credentialID, 'base64'),
        counter: credential.counter,
      },
    });
    console.log('verify-authentication verification', verification);
    if (verification.verified) {
      // Update the authenticator's counter in the database
      await firestore
        .collection('users')
        .doc(userDoc.docs[0].id)
        .update({
          credentials: credentials.map((cred: Credential) => ({
            ...cred,
            counter: verification.authenticationInfo.newCounter,
          })),
        });

      const userData = userDoc.docs[0].data();
      console.log('signIn with passkey');
      const response = await signIn('passkey', {
        userId: userDoc.docs[0].id,
        email: userData.email,
        name: userData.name || null,
        image: userData.image || null,
        organizationId: userData.activeOrganizationId || null,
        verified: true,
        redirect: false,
        callbackUrl: '/manage/proposals'
      });
      console.log('signIn response', response);
      
      const session = await auth();
      console.log('getting session', session);
      return NextResponse.json({ 
        verified: true,
        redirectUrl: '/manage/proposals'
      });
    }
    console.log('verification failed', verification);
    return NextResponse.json({ verified: false });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    );
  }
}