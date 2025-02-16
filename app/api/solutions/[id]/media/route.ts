import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { uploadSolutionMedia, deleteSolutionMedia } from '@/app/lib/database/solutionDatabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.profile?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mediaAsset = await uploadSolutionMedia(params.id, file.name, buffer);
    
    return new Response(JSON.stringify(mediaAsset), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading media:', error);
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
    const { mediaId } = await req.json();
    
    if (!mediaId) {
      return new Response('No media ID provided', { status: 400 });
    }

    await deleteSolutionMedia(params.id, mediaId);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting media:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 