import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const snapshot = await adminDb
      .collection('companies')
      .where('name', '>=', q)
      .where('name', '<=', q + '\uf8ff')
      .orderBy('name')
      .limit(10)
      .get();

    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
    }));

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error searching companies:', error);
    return NextResponse.json({ error: 'Failed to search companies' }, { status: 500 });
  }
} 