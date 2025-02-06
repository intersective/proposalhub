import { NextRequest, NextResponse } from 'next/server';
import { searchClients } from '../../../lib/companyDatabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const query = searchParams.get('q');
    const companyId = searchParams.get('companyId');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const clients = await searchClients(query, companyId || undefined);
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    return NextResponse.json(
      { error: 'Failed to search clients' },
      { status: 500 }
    );
  }
} 