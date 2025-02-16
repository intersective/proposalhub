import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

interface Document {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    // TODO: Implement file upload to storage service
    // For now, we'll just create a mock document record
    const documentId = uuidv4();
    const document: Document = {
      id: documentId,
      name: file.name,
      url: `https://storage.example.com/${documentId}/${file.name}`, // Mock URL
      uploadedAt: new Date(),
      uploadedBy: session.user.email
    };

    // Add document to the proposal's referenceDocuments array
    await adminDb.collection('proposals').doc(id).update({
      referenceDocuments: FieldValue.arrayUnion(document)
    });

    return new Response(JSON.stringify(document), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const session = await auth();
  const { id, documentId } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Get the proposal document
    const doc = await adminDb.collection('proposals').doc(id).get();
    
    if (!doc.exists) {
      return new Response('Proposal not found', { status: 404 });
    }

    const data = doc.data();
    const documents = data?.referenceDocuments || [];
    const documentToRemove = documents.find((doc: Document) => doc.id === documentId);

    if (!documentToRemove) {
      return new Response('Document not found', { status: 404 });
    }

    // TODO: Delete file from storage service

    // Remove document from the proposal's referenceDocuments array
    await adminDb.collection('proposals').doc(id).update({
      referenceDocuments: FieldValue.arrayRemove(documentToRemove)
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error removing document:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 