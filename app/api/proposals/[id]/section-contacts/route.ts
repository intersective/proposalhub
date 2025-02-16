import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { Contact } from '@/app/types/contact';

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
      .collection('proposals')
      .doc(id)
      .collection('section-contacts')
      .get();

    const sectionContacts: Record<string, Contact[]> = {};
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!sectionContacts[data.sectionId]) {
        sectionContacts[data.sectionId] = [];
      }
      
      // Get contact details
      const contactDoc = await adminDb
        .collection('contacts')
        .doc(data.contactId)
        .get();
        
      if (contactDoc.exists) {
        sectionContacts[data.sectionId].push({
          id: contactDoc.id,
          ...contactDoc.data()
        } as Contact);
      }
    }

    return new Response(JSON.stringify(sectionContacts), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching section contacts:', error);
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
    const body = await req.json();
    const { sectionId, contactId } = body;

    if (!sectionId || !contactId) {
      return new Response('Section ID and Contact ID are required', { status: 400 });
    }

    // Check if contact already exists in section
    const existingDoc = await adminDb
      .collection('proposals')
      .doc(id)
      .collection('section-contacts')
      .where('sectionId', '==', sectionId)
      .where('contactId', '==', contactId)
      .get();

    if (!existingDoc.empty) {
      return new Response('Contact already exists in section', { status: 400 });
    }

    // Add contact to section
    await adminDb
      .collection('proposals')
      .doc(id)
      .collection('section-contacts')
      .add({
        sectionId,
        contactId,
        createdAt: new Date(),
        createdBy: session.user.email
      });

    // Get contact details for response
    const contactDoc = await adminDb
      .collection('contacts')
      .doc(contactId)
      .get();

    if (!contactDoc.exists) {
      return new Response('Contact not found', { status: 404 });
    }

    return new Response(JSON.stringify({
      id: contactDoc.id,
      ...contactDoc.data()
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding section contact:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 