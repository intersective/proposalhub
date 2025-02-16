"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import Image from 'next/image';
import NextAuth from 'next-auth';
import authConfig from '@/auth.config'
  
const { signIn } = NextAuth(authConfig);

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/manage/proposals';
  
  const checkPasskey = async () => {
    try {
      const response = await fetch('/api/auth/passkey/start-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        return false;
      }
      const options = await response.json();
      if (!options || !options.allowCredentials || options.allowCredentials.length === 0) return;

      const assertion = await startAuthentication(options);
      if (!assertion) {
        return false;
      }
      const verificationResponse = await fetch('/api/auth/passkey/verify-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertion, options, email }),
      });

      if (verificationResponse.ok) {
        const result = await verificationResponse.json();
        console.log('verificationResponse', result);
        if (result.verified) {
         
          // Redirect to the returned URL
          if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
            return true;
          }
          return true;
        }
      }
      console.log('verificationResponse not ok');
      return false;
    } catch (error) {
      console.error('Passkey check failed:', error);
      return false;
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailSent(false);

    try {
      // check if the user has a passkey
      const passkeyVerified = await checkPasskey();
      console.log('passkeyVerified', passkeyVerified);
      if (passkeyVerified) {
        return;
      }
     
      
      // if we get here, the user doesn't have a passkey
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'nodemailer', email, callbackUrl })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send magic link');
      }

      setEmailSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send magic link');
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8  dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </form>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {emailSent && (
            <div className="text-green-500 text-sm text-center">
              Check your email for a sign-in link!
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <Image className="h-5 w-5 mr-2" src="/images/auth/google.svg" width={20} height={20} alt="Google logo" />
              Google
            </button>

            <button
              onClick={() => signIn('apple', { callbackUrl })}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <Image className="h-5 w-5 mr-2" src="/images/auth/apple.svg" width={20} height={20} alt="Apple logo" />
              Apple
            </button>

            <button
              onClick={() => signIn('linkedin', { callbackUrl })}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <Image className="h-5 w-5 mr-2" src="/images/auth/linkedin.svg" width={20} height={20} alt="LinkedIn logo" />
              LinkedIn
            </button>

            <button
              onClick={() => signIn('azure-ad', { callbackUrl })}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <Image className="h-5 w-5 mr-2" src="/images/auth/microsoft.svg" width={20} height={20} alt="Microsoft logo" />
              Microsoft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 