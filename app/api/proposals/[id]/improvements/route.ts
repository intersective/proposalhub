import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { generateImprovement } from '@/app/lib/generateContent';
import { Section } from '@/app/types/section';

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

export async function POST(
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

    // Get the proposal to access the section content
    const proposalDoc = await adminDb.collection('proposals').doc(id).get();
    if (!proposalDoc.exists) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposal = proposalDoc.data();
    const section = proposal?.sections?.find((s: Section) => s.id === sectionId);
    
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Generate improvement using the new function
    const { content, modelUsed, context } = await generateImprovement(
      section,
      proposal?.sections
    );

    // Store the improvement in the database
    const improvementDoc = await adminDb
      .collection('proposals')
      .doc(id)
      .collection('improvements')
      .add({
        sectionId,
        content,
        modelUsed,
        timestamp: new Date(),
        context: context || []
      });

    // If the section has no content, indicate that this should be directly applied
    const directApply = !section.content || section.content.trim() === '';

    return NextResponse.json({
      id: improvementDoc.id,
      content,
      modelUsed,
      timestamp: new Date(),
      context,
      directApply
    });
  } catch (error) {
    console.error('Error creating improvement:', error);
    return NextResponse.json(
      { error: 'Failed to create improvement' },
      { status: 500 }
    );
  }
} 