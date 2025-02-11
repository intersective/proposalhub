import { NextRequest, NextResponse } from 'next/server';
import { createCompany } from '@/app/lib/companyDatabase';
import { adminDb } from '@/app/lib/firebaseAdmin';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('companies')
      .orderBy('lastUpdated', 'desc')
      .get();

    const companies = await Promise.all(snapshot.docs.map(async doc => {
      const [proposalsSnapshot, clientsSnapshot] = await Promise.all([
        adminDb.collection('proposals')
          .where('companyId', '==', doc.id)
          .count()
          .get(),
        adminDb.collection('clients')
          .where('companyId', '==', doc.id)
          .count()
          .get()
      ]);

      return {
        id: doc.id,
        ...doc.data(),
        proposalCount: proposalsSnapshot.data().count,
        clientCount: clientsSnapshot.data().count,
        lastUpdated: doc.data().lastUpdated.toDate(),
        createdAt: doc.data().createdAt.toDate()
      };
    }));

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyData = await req.json();
    const company = await createCompany(companyData);
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
} 