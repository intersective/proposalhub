import { NextRequest, NextResponse } from 'next/server';
import { getUserProposals } from '../../lib/userDatabase';

export const POST = async (req: NextRequest) => {
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ message: 'UserId is required' }, { status: 400 });
    }

    const proposals = await getUserProposals(userId);
    return NextResponse.json(proposals, { status: 200 });
}