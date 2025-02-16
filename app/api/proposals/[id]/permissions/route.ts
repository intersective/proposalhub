import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';

interface Permission {
  permittedEntity: string;
  permittedEntityId: string;
  targetEntity: string;
  targetEntityId: string;
  role: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection('permissions')
      .where('targetEntity', '==', 'proposal')
      .where('targetEntityId', '==', id)
      .get();

    const permissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return new Response(JSON.stringify(permissions), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
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
    const body = await req.json() as Permission;
 
    // Find existing permission
    const existingPermissionSnapshot = await adminDb
      .collection('permissions')
      .where('permittedEntity', '==', body.permittedEntity)
      .where('permittedEntityId', '==', body.permittedEntityId)
      .where('targetEntity', '==', 'proposal')
      .where('targetEntityId', '==', id)
      .get();

    if (!existingPermissionSnapshot.empty) {
      // Update existing permission
      const docRef = existingPermissionSnapshot.docs[0].ref;
      await docRef.update({ role: body.role });
    } else {
      // Create new permission
      await adminDb.collection('permissions').add({
        permittedEntity: body.permittedEntity,
        permittedEntityId: body.permittedEntityId,
        targetEntity: body.targetEntity,
        targetEntityId: body.targetEntityId,
        role: body.role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating/updating permission:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return new Response('Contact ID is required', { status: 400 });
    }

    const snapshot = await adminDb
      .collection('permissions')
      .where('permittedEntity', '==', 'contact')
      .where('permittedEntityId', '==', contactId)
      .where('targetEntity', '==', 'proposal')
      .where('targetEntityId', '==', id)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 