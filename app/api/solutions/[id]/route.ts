import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { updateSolution, deleteSolution } from '@/app/lib/database/solutionDatabase';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const solutionRef = await adminDb.collection('solutions').doc(params.id).get();
    
    if (!solutionRef.exists) {
      return new Response('Solution not found', { status: 404 });
    }

    const solution = {
      id: solutionRef.id,
      ...solutionRef.data()
    };

    return new Response(JSON.stringify(solution), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching solution:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const updatedSolution = await updateSolution(params.id, body);
    
    return new Response(JSON.stringify(updatedSolution), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating solution:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await deleteSolution(params.id);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting solution:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 