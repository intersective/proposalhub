import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const organizationId = searchParams.get('organizationId');
  const ownerOrganizationId = session.user.profile?.organizationId;
  
  if (!ownerOrganizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    // Build the base query
    const contactsRef = adminDb.collection('contacts');
    let baseQuery = contactsRef
    .where('ownerOrganizationId', '==', ownerOrganizationId);

    if (organizationId) {
      // Create the query with organization filter
      baseQuery = baseQuery
      .where('organizationId', '==', organizationId)
    }

    // Add name search if query provided
    if (q) {
      baseQuery = baseQuery
        .where('name', '>=', q)
        .where('name', '<=', q + '\uf8ff');
    }
    
    baseQuery = baseQuery.orderBy('name').limit(10);

    const snapshot = await baseQuery.get();
    const contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
  }
} 