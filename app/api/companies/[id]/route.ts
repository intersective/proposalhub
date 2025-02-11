import { NextResponse } from 'next/server'
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection('companies').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data()?.lastUpdated.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const now = new Date();

    await adminDb.collection('companies').doc(id).update({
      ...data,
      lastUpdated: now
    });

    const updatedDoc = await adminDb.collection('companies').doc(id).get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
      lastUpdated: updatedDoc.data()?.lastUpdated.toDate(),
      createdAt: updatedDoc.data()?.createdAt.toDate()
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
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
    
    // Delete all clients associated with this company first
    const clientsSnapshot = await adminDb
      .collection('clients')
      .where('companyId', '==', id)
      .get();
    
    const batch = adminDb.batch();
    clientsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Delete the company
    batch.delete(adminDb.collection('companies').doc(id));
    
    // Commit the batch
    await batch.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
} 