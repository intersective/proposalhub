import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import { adminStorage } from '@/app/lib/firebaseAdmin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // Use DALL-E to generate a logo
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a modern, minimalist, professional logo for a company called "${query}". The logo should be simple, memorable, and work well at different sizes. Use a clean design that reflects professionalism and trust. The logo should be on a white background.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    });

    if (!response.data[0].b64_json) {
      throw new Error('No image generated');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(response.data[0].b64_json, 'base64');

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const filename = `logos/${uuid()}.png`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/png',
      },
    });

    // Get the public URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    return new Response(JSON.stringify({ url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error searching for logo:', error);
    return new Response(JSON.stringify({ error: 'Failed to search for logo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}