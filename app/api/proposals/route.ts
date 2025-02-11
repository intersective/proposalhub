import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { v4 as uuid } from 'uuid';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('proposals')
      .orderBy('lastUpdated', 'desc')
      .get();

    const proposals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));

    return NextResponse.json(proposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { status, sections } = await req.json();

    // Create a new proposal document
    const proposalId = uuid();
    const now = new Date();

    await adminDb.collection('proposals').doc(proposalId).set({
      id: proposalId,
      status: status || 'draft',
      sections: sections || [],
      createdAt: now,
      lastUpdated: now
    });

    return NextResponse.json({ id: proposalId });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}