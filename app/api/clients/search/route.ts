import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const companyId = searchParams.get('companyId');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let query = adminDb.collection('clients')
      .where('name', '>=', q)
      .where('name', '<=', q + '\uf8ff')
      .orderBy('name')
      .limit(10);

    if (companyId) {
      query = adminDb.collection('clients')
        .where('companyId', '==', companyId)
        .where('name', '>=', q)
        .where('name', '<=', q + '\uf8ff')
        .orderBy('name')
        .limit(10);
    }

    const snapshot = await query.get();
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    return NextResponse.json({ error: 'Failed to search clients' }, { status: 500 });
  }
} 