import { NextRequest, NextResponse } from 'next/server';
import { updateCompany } from '../../../lib/companyDatabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyData = await req.json();
    const company = await updateCompany(params.id, companyData);
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
} 