import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('contacts').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data()?.updatedAt.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
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

    await adminDb.collection('contacts').doc(id).update({
      ...data,
      updatedAt: now
    });

    const updatedDoc = await adminDb.collection('contacts').doc(id).get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      updatedAt: updatedDoc.data()?.updatedAt.toDate(),
      createdAt: updatedDoc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
} 