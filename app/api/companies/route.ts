import { NextRequest, NextResponse } from 'next/server';
import { createCompany } from '../../lib/companyDatabase';
import { adminDb } from '../../lib/firebaseAdmin';

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection('companies')
      .orderBy('lastUpdated', 'desc')
      .get();

    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
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