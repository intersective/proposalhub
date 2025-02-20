import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function PATCH(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.profile?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const data = await request.json();
    
    // If we're removing from team
    if (data.isTeamMember === false) {
      // Find and delete team membership
      const teamMembershipSnapshot = await adminDb.collection('teams')
        .where('teamId', '==', session.user.profile.organizationId)
        .where('teamType', '==', 'organization')
        .where('contactId', '==', params.memberId)
        .get();

      if (!teamMembershipSnapshot.empty) {
        await teamMembershipSnapshot.docs[0].ref.delete();
      }

      return NextResponse.json({ success: true });
    }

    // Update contact details
    const contactRef = adminDb.collection('contacts').doc(params.memberId);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      return new NextResponse('Contact not found', { status: 404 });
    }

    // Get team membership
    const teamMembershipSnapshot = await adminDb.collection('teams')
      .where('teamId', '==', session.user.profile.organizationId)
      .where('teamType', '==', 'organization')
      .where('contactId', '==', params.memberId)
      .get();

    if (teamMembershipSnapshot.empty) {
      return new NextResponse('Team member not found', { status: 404 });
    }

    // Update the contact document
    await contactRef.update({
      ...data,
      updatedAt: new Date()
    });

    // Get the updated document
    const updatedDoc = await contactRef.get();
    
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      teamMembershipId: teamMembershipSnapshot.docs[0].id
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 