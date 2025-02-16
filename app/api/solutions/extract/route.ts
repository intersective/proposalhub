import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { extractSolutionFromProposal } from '@/app/lib/database/solutionDatabase';

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { proposalId } = await req.json();
    
    if (!proposalId) {
      return new Response('No proposal ID provided', { status: 400 });
    }

    const solutionId = await extractSolutionFromProposal(proposalId, session.user.profile.id);
    
    return new Response(JSON.stringify({ id: solutionId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error extracting solution:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 