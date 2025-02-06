import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../lib/companyDatabase';
import { adminDb } from '../../lib/firebaseAdmin';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('clients')
      .orderBy('lastUpdated', 'desc')
      .get();

    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientData = await req.json();
    
    // Validate required fields
    if (!clientData.name || !clientData.companyId) {
      return NextResponse.json(
        { error: 'Name and companyId are required fields' },
        { status: 400 }
      );
    }

    const client = await createClient(clientData);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
} 