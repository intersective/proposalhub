import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb, adminStorage } from '@/app/lib/firebaseAdmin';
import { analyzeDocument, DocumentAnalysisResult } from '@/app/lib/documentAnalysis';
import { convertToMarkdown } from '@/app/lib/fileConversion';

interface OpportunityData extends Partial<DocumentAnalysisResult> {
  organizationId: string;
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'active' | 'archived';
  source: 'url' | 'file' | 'manual';
  sourceUrl?: string;
  sourceFile?: string;
}

export async function GET() {
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

    // Get opportunities for the organization
    const opportunitiesSnapshot = await adminDb
      .collection('opportunities')
      .where('organizationId', '==', organizationId)
      .orderBy('createdAt', 'desc')
      .get();

    const opportunities = opportunitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return new Response(JSON.stringify(opportunities), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
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

    let opportunityData: OpportunityData = {
      organizationId,
      createdAt: new Date(),
      createdBy: session.user.email!,
      status: 'draft',
      source: method
    };

    if (method === 'url') {
      const url = formData.get('url') as string;
      if (!url) {
        return new Response('URL is required', { status: 400 });
      }

      // Extract opportunity data from URL
      const extractedData = await analyzeDocument(
        url,
        [],
        'url'
      );

      opportunityData = {
        ...opportunityData,
        ...extractedData,
        sourceUrl: url
      };
    } else if (method === 'file') {
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response('File is required', { status: 400 });
      }
      const mimeType = file.type;
      // get file data as data that can be uploaded to storage
      const fileData = await file.arrayBuffer();
      const fileDataString = Buffer.from(fileData).toString('base64');
      // store file in storage
      const [fileRef] = await adminStorage.bucket().upload(fileDataString);
      const [fileUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Long-lived URL
      });

      // get file text if the file is of a format that can be converted to text
      // file needs to be a blob
      const fileBlob = new Blob([fileData]);
      const result = await convertToMarkdown(fileBlob, mimeType);

      // Extract opportunity data from file
      const extractedData = await analyzeDocument(
        result.content,
        [],
        'markdown'
      );

      opportunityData = {
        ...opportunityData,
        ...extractedData,
        sourceFile: fileUrl
      };
    }

    // Create opportunity
    const opportunityRef = await adminDb.collection('opportunities').add(opportunityData);
    const opportunity = {
      id: opportunityRef.id,
      ...opportunityData
    };

    return new Response(JSON.stringify(opportunity), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 