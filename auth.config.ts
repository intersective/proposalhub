import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import LinkedIn from "next-auth/providers/linkedin"

export default { 
    providers: [MicrosoftEntraID, Google, Apple, LinkedIn],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isProtected = 
                nextUrl.pathname.startsWith('/proposals') ||
                nextUrl.pathname.startsWith('/admin')
            
            if (isProtected) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    }
} satisfies NextAuthConfig