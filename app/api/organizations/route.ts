import { NextRequest, NextResponse } from 'next/server';
import { createOrganization } from '@/app/lib/database/organizationDatabase';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { auth } from '@/auth';
export async function GET() {
  const session = await auth();
  if (!session?.user.profile?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const organizationId = session?.user.profile?.organizationId;
 
  console.log('organizationId', organizationId);
  let snapshot;
  try {
     snapshot = await adminDb
      .collection('organizations')
      .where('ownerOrganizationId', '==', organizationId)
      .orderBy('nameLower', 'asc')
      .get();
  }
  catch (error) {
    console.error('Error fetching organizations: 1', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations 1' },
      { status: 500 }
    );
  }
  try {
    const organizations = await Promise.all(snapshot.docs.map(async doc => {
      const [proposalsSnapshot, contactsSnapshot] = await Promise.all([
        adminDb.collection('proposals')
          .where('forOrganizationId', '==', doc.id)
          .where('ownerOrganizationId', '==', organizationId)
          .count()
          .get(),
        adminDb.collection('contacts')
          .where('organizationId', '==', doc.id)
          .count()
          .get()
      ]);

      return {
        id: doc.id,
        ...doc.data(),
        proposalCount: proposalsSnapshot.data().count,
        contactCount: contactsSnapshot.data().count
      };
    }));

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations2:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations2' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const organizationData = await req.json();
    const organization = await createOrganization(organizationData);
    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
} 