import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET() {
  try {
    // Get drafts from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const querySnapshot = await adminDb
      .collection('proposals')
      .where('status', '==', 'draft')
      .where('lastUpdated', '>=', thirtyDaysAgo)
      .orderBy('lastUpdated', 'desc')
      .limit(10)
      .get();

    const drafts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate()
    }));

    return NextResponse.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft proposals' },
      { status: 500 }
    );
  }
} 