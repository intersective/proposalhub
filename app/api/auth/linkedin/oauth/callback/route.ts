import { adminDb } from '@/app/lib/firebaseAdmin';
import puppeteer from 'puppeteer';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return new Response(
      `
      <script>
        window.opener.postMessage({ type: 'LINKEDIN_AUTH_ERROR' }, '*');
        window.close();
      </script>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    // Verify state token
    const stateDoc = await adminDb.collection('linkedinAuthStates').doc(state).get();
    if (!stateDoc.exists) {
      throw new Error('Invalid state token');
    }

    const stateData = stateDoc.data();
    if (new Date() > new Date(stateData?.expiresAt.toDate())) {
      throw new Error('State token expired');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_ID || '',
        client_secret: process.env.LINKEDIN_SECRET || ''
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();

    // Launch browser and set up session
    const browser = await puppeteer.launch({ headless: true });
    const page = await   browser.newPage();

    // Navigate to LinkedIn and use the access token
    await page.goto('https://www.linkedin.com');
    await page.evaluate((token) => {
      localStorage.setItem('linkedin_oauth_token', token);
    }, access_token);

    // Get cookies for future requests
    const cookies = await page.cookies();
    await browser.close();

    // Store the session data
    await adminDb.collection('linkedinSessions').doc(stateData?.userId).set({
      accessToken: access_token,
      cookies: cookies,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    // Clean up the state token
    await adminDb.collection('linkedinAuthStates').doc(state).delete();

    // Return success to the opener window
    return new Response(
      `
      <script>
        window.opener.postMessage({
          type: 'LINKEDIN_AUTH_SUCCESS'
        }, '*');
        window.close();
      </script>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error in LinkedIn callback:', error);
    return new Response(
      `
      <script>
        window.opener.postMessage({ type: 'LINKEDIN_AUTH_ERROR' }, '*');
        window.close();
      </script>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
} 