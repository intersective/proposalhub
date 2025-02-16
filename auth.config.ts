import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import LinkedIn from "next-auth/providers/linkedin"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
    pages: {
        signIn: "/signin",
    },
    trustHost: true,
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
                domain: process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost'
            }
        }
    },
    providers: [
        Credentials({
            id: "passkey",
            name: "Passkey",
            credentials: {
                userId: { type: "text" },
                email: { type: "text" },
                name: { type: "text" },
                image: { type: "text" },
                verified: { type: "boolean" }
            },
            async authorize(credentials) {
                if (!credentials?.userId || !credentials?.verified) {
                    return null;
                }
                return {
                    id: credentials.userId.toString(),
                    email: credentials.email?.toString() || credentials.userId.toString(),
                    name: credentials.name?.toString() || null,
                    image: credentials.image?.toString() || null
                };
            }
        }),
        LinkedIn({
            clientId: process.env.LINKEDIN_ID!,
            clientSecret: process.env.LINKEDIN_SECRET!,
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Apple({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_SECRET!,
        }),
        MicrosoftEntraID({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        }),
    ],
} satisfies NextAuthConfig

export default authConfig