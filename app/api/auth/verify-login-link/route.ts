import { NextRequest, NextResponse } from 'next/server';
import { User, getUserByLoginCode } from '@/app/lib/userDatabase';

export async function POST(req: NextRequest) {
    const { code } = await req.json();

    if (!code) {
        return NextResponse.json({ message: 'Login code is required' }, { status: 400 });
    }

    // save the login code in the db
    const user = await getUserByLoginCode(code) as User;
    if (!user || !user.login || !user.login.proposalId) {
        return NextResponse.json({ message: 'Invalid login code' }, { status: 400 });
    }
    return NextResponse.json(user, { status: 200 });
}