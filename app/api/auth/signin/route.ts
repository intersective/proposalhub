import { signIn } from "@/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const { provider, email, callbackUrl } = await req.json()

    try {
        const response = await signIn(provider, { 
            email, 
            redirect: false,
            callbackUrl
        })
        return NextResponse.json({ success: true, response })
    } catch (error) {
        console.error(`${provider} sign-in error:`, error)
        return NextResponse.json(
            { error: `Failed to sign in with ${provider}` },
            { status: 500 }
        )
    }
} 