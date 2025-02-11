import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('clients').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data()?.lastUpdated.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const now = new Date();

    await adminDb.collection('clients').doc(id).update({
      ...data,
      lastUpdated: now
    });

    const updatedDoc = await adminDb.collection('clients').doc(id).get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      lastUpdated: updatedDoc.data()?.lastUpdated.toDate(),
      createdAt: updatedDoc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
} 