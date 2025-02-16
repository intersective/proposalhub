import { NextRequest, NextResponse } from 'next/server';
import { createContact } from '@/app/lib/database/organizationDatabase';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { auth } from '@/auth';

// This route is used to fetch all contacts for a given organization
// The organizationId must be owned by the current user's organization
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization');
  console.log('organizationId', organizationId);
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const ownerOrganizationId = session.user.profile?.organizationId;
  console.log('ownerOrganizationId', ownerOrganizationId);
  try {
    // Check if the organizationId is owned by the current user's organization
    const organizationDoc = await adminDb
      .collection('organizations')
      .doc(organizationId)
      .get();

    if (!organizationDoc.exists) {
      console.error('Organization not found');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationData = organizationDoc.data();
    if (organizationData?.ownerOrganizationId !== ownerOrganizationId) {
      console.error('Organization not owned by user');
      return NextResponse.json({ error: 'Unauthorized access to organization' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }

  try {
    const contactsSnapshot = await adminDb
      .collection('contacts')
      .where('organizationId', '==', organizationId)
      .orderBy('nameLower', 'asc')
      .get();

    if (contactsSnapshot.empty) {
      return NextResponse.json({ error: 'No contacts found' }, { status: 404 });
    }

    const contacts = contactsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(contacts);
  }  catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contactData = await req.json();
    
    // Validate required fields
    if (!contactData.name || !contactData.organizationId) {
      return NextResponse.json(
        { error: 'Name and organizationId are required fields' },
        { status: 400 }
      );
    }

    const contact = await createContact(contactData);
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
} 