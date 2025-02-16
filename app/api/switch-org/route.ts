import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getUserProfile } from '@/app/lib/database/accountDatabase';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { organizationId } = await req.json();
    const profile = await getUserProfile(session.user.id);

    if (!profile) {
      return new Response('Profile not found', { status: 404 });
    }

    // Check if user belongs to the organization
    const hasAccess = profile.accounts.some(acc => acc.organizationId === organizationId);

    if (!hasAccess) {
      return new Response('Forbidden', { status: 403 });
    }

    // Update session with new organization
    // Note: This assumes you have a way to update the session in your auth configuration
    // You might need to implement this based on your auth provider
    session.organizationId = organizationId;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 