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
  const organizationId = searchParams.get('organizationId') || session.user.profile?.organizationId;
  const ownerOrganizationId = session.user.profile?.organizationId;
  if (!organizationId || !ownerOrganizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }
  // Check if the organizationId is owned by the current user's organization
  const organizationSnapshot = await adminDb
    .collection('organizations')
    .where('ownerOrganizationId', '==', ownerOrganizationId)
    .where('organizationId', '==', organizationId)
    .limit(1)
    .get();

  if (organizationSnapshot.empty) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  
  try {
    let query = adminDb.collection('contacts')
      .where('organizationId', '==', organizationId)
      .orderBy('name')
      .limit(10);
    if (q) {
      query = query
        .where('name', '>=', q)
        .where('name', '<=', q + '\uf8ff');
    }

    const snapshot = await query.get();
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