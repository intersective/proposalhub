import { NextRequest } from 'next/server';
import { getAccountByOrgId, updateAccount, getOrganizationsByContactId } from '@/app/lib/database/accountDatabase'
import { getRoleByContactId } from '@/app/lib/database/organizationDatabase';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try { 
    // Get the user's profile for their active organization
    const profile = session.user.profile;
    
    if (!profile || !profile.id) {
      return new Response('Profile not found', { status: 404 });
    }

    // Get all organizations the user has access to
    const organizations = await getOrganizationsByContactId(profile.id);

    // Add organizations to the profile response
    const response = {
      ...profile,
      organizations
    };

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.profile) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { organizationId } = body;

    const account = await getAccountByOrgId(organizationId);
    
    if (!account) {
      return new Response('Account not found', { status: 404 });
    }

    // Check if user has permission to update account
    const role = await getRoleByContactId(session.user.profile.id, session.user.profile.organizationId);
    const hasPermission = role === 'owner';

    if (!hasPermission) {
      return new Response('Forbidden', { status: 403 });
    }

    const updatedAccount = await updateAccount(account.id, body);

    return new Response(JSON.stringify(updatedAccount), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating account:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 