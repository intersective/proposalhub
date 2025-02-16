import { NextRequest, NextResponse } from 'next/server';
import { getProposalsByContactId, createProposal } from '@/app/lib/database/proposalDatabase';
import { v4 as uuid } from 'uuid';
import { auth } from '@/auth';
import { ProposalRecord } from '@/app/types/proposal';
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.profile?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const proposals = await getProposalsByContactId(session.user.profile.id, session.user.profile.organizationId);
  console.log('proposals', proposals);
  if (!proposals) {
    console.log('No proposals found');
    return NextResponse.json({ error: 'No proposals found' }, { status: 404 });
  }
  return NextResponse.json(proposals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { status, sections } = await req.json();

    // Create a new proposal document
    const proposalId = uuid();
    const now = new Date();

    await createProposal(session.user.id, {
      id: proposalId,
      status: status || 'draft',
      sections: sections || [],
      createdAt: now,
      updatedAt: now
    } as ProposalRecord);

    return NextResponse.json({ id: proposalId });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}