import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '../../../../lib/documentAnalysis';
import { adminDb } from '../../../../lib/firebaseAdmin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, type } = await req.json();

    // Get the existing proposal
    const proposalDoc = await adminDb.collection('proposals').doc(id).get();
    if (!proposalDoc.exists) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const proposal = {
      id: proposalDoc.id,
      ...proposalDoc.data(),
      sections: proposalDoc.data()?.sections || []
    };

    // Analyze the document and match sections
    const analysis = await analyzeDocument(content, proposal.sections, type);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json(
      { error: 'Failed to analyze document' },
      { status: 500 }
    );
  }
} 