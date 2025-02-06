import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    const doc = await adminDb.collection('proposals').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
      sections: doc.data()?.sections || [],
      lastUpdated: doc.data()?.lastUpdated.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    const data = await req.json();
    const now = new Date();

    await adminDb.collection('proposals').doc(id).update({
      ...data,
      lastUpdated: now
    });

    const updatedDoc = await adminDb.collection('proposals').doc(id).get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      sections: updatedDoc.data()?.sections || [],
      lastUpdated: updatedDoc.data()?.lastUpdated.toDate(),
      createdAt: updatedDoc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    await adminDb.collection('proposals').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
} 