import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.profile?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First get all team memberships for this organization
    const teamSnapshot = await adminDb.collection('teams')
      .where('teamId', '==', session.user.profile.organizationId)
      .where('teamType', '==', 'organization')
      .get();

    // Get all the contactIds
    const contactIds = teamSnapshot.docs.map(doc => doc.data().contactId);

    // Then get all the contact details
    const contacts = await Promise.all(
      contactIds.map(async (contactId) => {
        const contactDoc = await adminDb.collection('contacts').doc(contactId).get();
        return {
          id: contactDoc.id,
          ...contactDoc.data(),
          teamMembershipId: teamSnapshot.docs.find(doc => doc.data().contactId === contactId)?.id
        };
      })
    );

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.profile?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    
    if (data.contactId) {
      // Check if contact exists
      const contactRef = adminDb.collection('contacts').doc(data.contactId);
      const contactDoc = await contactRef.get();
      
      if (!contactDoc.exists) {
        return new NextResponse('Contact not found', { status: 404 });
      }

      // Check if already a team member
      const existingTeamMember = await adminDb.collection('teams')
        .where('teamId', '==', session.user.profile.organizationId)
        .where('teamType', '==', 'organization')
        .where('contactId', '==', data.contactId)
        .get();

      if (!existingTeamMember.empty) {
        return new NextResponse('Contact is already a team member', { status: 400 });
      }

      // Add to team
      const teamMembershipRef = await adminDb.collection('teams').add({
        teamId: session.user.profile.organizationId,
        teamType: 'organization',
        contactId: data.contactId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({
        id: contactDoc.id,
        ...contactDoc.data(),
        teamMembershipId: teamMembershipRef.id
      });
    } else {
      // Creating new contact and adding to team
      const contactRef = await adminDb.collection('contacts').add({
        ...data,
        organizationId: session.user.profile.organizationId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add to team
      const teamMembershipRef = await adminDb.collection('teams').add({
        teamId: session.user.profile.organizationId,
        teamType: 'organization',
        contactId: contactRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        id: contactRef.id,
        ...data,
        teamMembershipId: teamMembershipRef.id
      });
    }
  } catch (error) {
    console.error('Error managing team member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  const { contactId } = await params;
  
  if (!session?.user?.profile?.organizationId) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Find the team membership
    const teamMembershipSnapshot = await adminDb.collection('teams')
      .where('teamId', '==', session.user.profile.organizationId)
      .where('teamType', '==', 'organization')
      .where('contactId', '==', contactId)
      .get();

    if (teamMembershipSnapshot.empty) {
      return new Response('Team member not found', { status: 404 });
    }

    // Delete the team membership
    await teamMembershipSnapshot.docs[0].ref.delete();

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error removing team member:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 