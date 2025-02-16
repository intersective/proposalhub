import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { generateContent } from '@/app/lib/generateContent';

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Get user's organization
    const userSnapshot = await adminDb
      .collection('contacts')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return new Response('User not found', { status: 404 });
    }

    const organizationId = userSnapshot.docs[0].data().organizationId;

    // Get RFPs for the organization
    const rfpsSnapshot = await adminDb
      .collection('rfps')
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .get();

    const rfps = rfpsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return new Response(JSON.stringify(rfps), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const method = formData.get('method') as 'url' | 'file' | 'manual';

    // Get user's organization
    const userSnapshot = await adminDb
      .collection('contacts')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return new Response('User not found', { status: 404 });
    }

    const organizationId = userSnapshot.docs[0].data().organizationId;

    let rfpData: any = {
      organizationId,
      createdAt: new Date(),
      createdBy: session.user.email,
      status: 'draft',
      source: method
    };

    if (method === 'url') {
      const url = formData.get('url') as string;
      if (!url) {
        return new Response('URL is required', { status: 400 });
      }

      // Extract RFP data from URL
      const extractedData = await generateContent({
        type: 'rfp',
        url
      });

      rfpData = {
        ...rfpData,
        ...extractedData,
        sourceUrl: url
      };
    } else if (method === 'file') {
      const file = formData.get('file') as File;
      if (!file) {
        return new Response('File is required', { status: 400 });
      }

      // Upload file to storage and get URL
      // TODO: Implement file upload
      const fileUrl = '';

      // Extract RFP data from file
      const extractedData = await generateContent({
        type: 'rfp',
        file
      });

      rfpData = {
        ...rfpData,
        ...extractedData,
        sourceFile: fileUrl
      };
    }

    // Create RFP
    const rfpRef = await adminDb.collection('rfps').add(rfpData);
    const rfp = {
      id: rfpRef.id,
      ...rfpData
    };

    return new Response(JSON.stringify(rfp), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating RFP:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 