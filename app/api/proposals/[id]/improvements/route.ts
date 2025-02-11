import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 });
    }

    const snapshot = await adminDb
      .collection('proposals')
      .doc(id)
      .collection('improvements')
      .where('sectionId', '==', sectionId)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const improvements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    }));

    return NextResponse.json(improvements);
  } catch (error) {
    console.error('Error fetching improvements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch improvements' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const improvementId = searchParams.get('improvementId');

    if (!improvementId) {
      return NextResponse.json({ error: 'Improvement ID is required' }, { status: 400 });
    }

    await adminDb
      .collection('proposals')
      .doc(id)
      .collection('improvements')
      .doc(improvementId)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting improvement:', error);
    return NextResponse.json(
      { error: 'Failed to delete improvement' },
      { status: 500 }
    );
  }
} 