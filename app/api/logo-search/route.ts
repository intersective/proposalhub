import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/app/lib/firebaseAdmin';
import { v4 as uuid } from 'uuid';

async function tryLinkedInLogo(companyName: string) {
  try {
    // LinkedIn's company search API
    const response = await fetch(`https://api.linkedin.com/v2/companies?q=search&keywords=${encodeURIComponent(companyName)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    const company = data.elements?.[0];
    if (!company?.logoUrl) return null;

    return company.logoUrl;
  } catch (error) {
    console.log('LinkedIn logo search failed:', error);
    return null;
  }
}

async function tryClearbitLogo(companyName: string) {
  try {
    // Clearbit's Logo API
    const response = await fetch(`https://logo.clearbit.com/${encodeURIComponent(companyName.toLowerCase().replace(/[^a-z0-9]/g, ''))}.com`);
    
    if (!response.ok) return null;

    // Clearbit returns the logo directly
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type');

    return { buffer, contentType };
  } catch (error) {
    console.log('Clearbit logo search failed:', error);
    return null;
  }
}

async function tryGoogleCustomSearch(companyName: string) {
  try {
    // Google Custom Search API focused on company logos
    const response = await fetch(
      `https://customsearch.googleapis.com/customsearch/v1?` + 
      `key=${process.env.GOOGLE_SEARCH_API_KEY}` +
      `&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}` +
      `&q=${encodeURIComponent(companyName + ' company logo')}` +
      `&searchType=image` +
      `&imgType=logo` +
      `&num=1`
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    const logoUrl = data.items?.[0]?.link;
    if (!logoUrl) return null;

    // Download the logo
    const imageResponse = await fetch(logoUrl);
    if (!imageResponse.ok) return null;

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get('content-type');

    return { buffer, contentType };
  } catch (error) {
    console.log('Google Custom Search failed:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Try each method in sequence
    let logoBuffer: Buffer | null = null;
    let contentType: string | null = null;

    // 1. Try LinkedIn
    console.log('Trying LinkedIn...');
    const linkedInUrl = await tryLinkedInLogo(query);
    if (linkedInUrl) {
      const response = await fetch(linkedInUrl);
      if (response.ok) {
        logoBuffer = Buffer.from(await response.arrayBuffer());
        contentType = response.headers.get('content-type');
      }
    }

    // 2. Try Clearbit if LinkedIn failed
    if (!logoBuffer) {
      console.log('Trying Clearbit...');
      const clearbitResult = await tryClearbitLogo(query);
      if (clearbitResult) {
        logoBuffer = clearbitResult.buffer;
        contentType = clearbitResult.contentType;
      }
    }

    // 3. Try Google Custom Search as last resort
    if (!logoBuffer) {
      console.log('Trying Google Custom Search...');
      const googleResult = await tryGoogleCustomSearch(query);
      if (googleResult) {
        logoBuffer = googleResult.buffer;
        contentType = googleResult.contentType;
      }
    }

    if (!logoBuffer || !contentType) {
      return NextResponse.json({ error: 'No logo found' }, { status: 404 });
    }

    // Upload to Firebase Storage
    const bucket = adminStorage.bucket();
    const extension = contentType.split('/')[1] || 'png';
    const filename = `logos/${uuid()}.${extension}`;
    const fileRef = bucket.file(filename);

    await fileRef.save(logoBuffer, {
      metadata: { contentType },
    });

    // Get public URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error searching for logo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to find or download logo' },
      { status: 500 }
    );
  }
}