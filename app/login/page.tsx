"use client";
// pages/login.tsx
import { useState } from 'react';
import {
  startAuthentication,
} from '@simplewebauthn/browser';


const Login: React.FC = () => {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    const response = await fetch('/api/auth/generate-authentication-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    // if we got a 400 error, user doesn't exist
    if (response.status === 400) {
        alert('User not found');
        return;
    }

    // the user exists but does not have associated credentials
    // call the api endpoint send-login-link with the post body parameter: passkey
    if (response.status === 401) {
      await fetch('/api/auth/send-login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'registration',
          email: email,
          proposalId: -1,
        }),
      });
      return alert('No credentials found for user. A registration link has been sent to your email.');
    }

    const options = await response.json();
    console.log('Options:', options);
    const assertionResponse = await startAuthentication(options);
    console.log('Assertion response:', assertionResponse);
    const verificationResponse = await fetch('/api/auth/verify-authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        assertionResponse,
      }),
    });
    const verification = await verificationResponse.json();

    if (verification.verified) {
        // Authentication successful
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';} 
    else {
        // Handle error
        alert('Authentication failed');
    }
  };

return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
        <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-8 rounded shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
            <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 mb-4 border border-gray-300 rounded dark: text-black"
            />
            <button
                onClick={handleLogin}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
                Login
            </button>
        </div>
    </div>
);
};

export default Login;