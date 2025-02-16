import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createSolution, getSolutionsByContactId } from '@/app/lib/database/solutionDatabase';
import { SolutionRecord } from '@/app/types/solution';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const solutions = await getSolutionsByContactId(session.user.profile.id);
    
    return new Response(JSON.stringify(solutions), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const solutionId = await createSolution(session.user.profile.id, body);
    
    return new Response(JSON.stringify({ id: solutionId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating solution:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 