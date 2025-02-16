import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection('organizations')
      .doc(id)
      .collection('team')
      .get();

    const contactIds = snapshot.docs.map(doc => doc.data().contactId);

    // Fetch contact details for each team member
    const contactsSnapshot = await adminDb
      .collection('contacts')
      .where('id', 'in', contactIds)
      .get();

    const contacts = contactsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return new Response(JSON.stringify(contacts), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { contactId } = await req.json();

    // Check if contact is already in team
    const existingMember = await adminDb
      .collection('organizations')
      .doc(id)
      .collection('team')
      .where('contactId', '==', contactId)
      .get();

    if (!existingMember.empty) {
      return new Response('Contact is already a team member', { status: 400 });
    }

    // Add contact to team
    await adminDb
      .collection('organizations')
      .doc(id)
      .collection('team')
      .add({
        contactId,
        addedAt: new Date(),
        addedBy: session.user.email
      });

    // Get contact details
    const contactDoc = await adminDb.collection('contacts').doc(contactId).get();
    const contact = { id: contactDoc.id, ...contactDoc.data() };

    return new Response(JSON.stringify(contact), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const session = await auth();
  const { id, contactId } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection('organizations')
      .doc(id)
      .collection('team')
      .where('contactId', '==', contactId)
      .get();

    if (snapshot.empty) {
      return new Response('Team member not found', { status: 404 });
    }

    // Delete team member
    await snapshot.docs[0].ref.delete();

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error removing team member:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 