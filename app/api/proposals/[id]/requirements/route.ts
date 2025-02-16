import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const doc = await adminDb.collection('proposals').doc(id).get();
    
    if (!doc.exists) {
      return new Response('Proposal not found', { status: 404 });
    }

    const data = doc.data();
    const requirements = {
      organization: data?.organization || null,
      leadContact: data?.leadContact || null,
      overview: data?.overview || '',
      requirements: data?.requirements || '',
      timeline: data?.timeline || '',
      budget: data?.budget || '',
      notes: data?.notes || '',
      referenceDocuments: data?.referenceDocuments || []
    };

    return new Response(JSON.stringify(requirements), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const updates = await req.json();
    
    // Update the proposal document
    await adminDb.collection('proposals').doc(id).update({
      ...updates,
      updatedAt: new Date()
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating requirements:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 