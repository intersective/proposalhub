import { NextResponse } from 'next/server'
import { adminDb } from '@/app/lib/firebaseAdmin';
import { auth } from '@/auth';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const doc = await adminDb.collection('organizations').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const data = await request.json();
    const now = new Date();

    const checkOrg = await adminDb.collection('organizations').doc(id).get();
    if (!checkOrg.exists || checkOrg.data()?.ownerOrganizationId !== session.user.profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
   
    await adminDb.collection('organizations').doc(id).update({
      ...data,
      updatedAt: now
    });

    const updatedDoc = await adminDb.collection('organizations').doc(id).get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete all contacts associated with this organization first
    const contactsSnapshot = await adminDb
      .collection('contacts')
      .where('organizationId', '==', id)
      .get();
    
    const batch = adminDb.batch();
    contactsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the organization
    batch.delete(adminDb.collection('organizations').doc(id).ref);
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const data = await request.json();
    const now = new Date();

    const checkOrg = await adminDb.collection('organizations').doc(id).get();
    if (!checkOrg.exists || checkOrg.data()?.ownerOrganizationId !== session.user.profile?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Only update the fields that are provided in the request
    const updateData = {
      ...data,
      updatedAt: now
    };
   
    await adminDb.collection('organizations').doc(id).update(updateData);

    const updatedDoc = await adminDb.collection('organizations').doc(id).get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error patching organization:', error);
    return NextResponse.json(
      { error: 'Failed to patch organization' },
      { status: 500 }
    );
  }
} 