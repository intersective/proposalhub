import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { firestore } from "@/app/lib/firebaseAuth"
import authConfig from "./auth.config"
import { getUserByEmail } from "@/app/lib/database/userDatabase"
import Nodemailer from "next-auth/providers/nodemailer"
import { getUserProfileByUserId } from "./app/lib/database/accountDatabase"
import { UserProfile } from "./app/types/account"
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      profile?: UserProfile | null
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: FirestoreAdapter(firestore),
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user && user.id) {
                token.id = user.id;
                token.email = user.email || null;
                token.name = user.name || null;
                token.image = user.image || null;
                const userProfile = await getUserProfileByUserId(user.id);
                console.log('userProfile', userProfile);
                token.userProfile = userProfile || null;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.profile = null;
                session.user.email = token.email as string;
                session.user.name = token.name as string | null;
                session.user.image = token.image as string | null;
                if (token.userProfile) {
                    session.user.profile = token.userProfile as UserProfile;
                    session.user.email = session.user.profile.email as string;
                    session.user.name = session.user.profile.firstName + " " + session.user.profile.lastName as string | null;
                    session.user.image = session.user.profile.image as string | null;
                } 
               
            }
            return session;
        },
        async signIn({ user, account }) {
            console.log('signIn callback', user, account);
            // For passkey authentication
            if (account?.provider === "passkey") {
                return true;
            }

            if (!user.email || !user.id) {
                return false;
            }

            // For all other providers, check if user exists and has proper role
            const userData = await getUserProfileByUserId(user.id);
            console.log('userData', userData);
            if (!userData) {
                return false;
            }
            return userData.role === "owner" || userData.role === "admin" || userData.role === "member";
        }
    },
    providers: [
        ...authConfig.providers.map(provider => {
            if (provider.id === "credentials") {
                return {
                    ...provider,
                    async authorize(credentials: Record<string, unknown>) {
                        const userId = credentials?.userId as string
                        const verified = credentials?.verified as boolean

                        if (!verified || !userId) {
                            return null
                        }

                        const user = await getUserByEmail(userId)
                        if (!user) {
                            return null
                        }

                        return {
                            id: userId,
                            email: user.email,
                            name: null,
                            image: null,
                        }
                    },
                }
            }
            return provider
        }),
        Nodemailer({
            name: "Email",
            server: {
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
            },
            from: process.env.EMAIL_FROM,
            normalizeIdentifier(identifier: string): string {
                // Get the first two elements only,
                // separated by `@` from end of string
                const [local, domain] = identifier.toLowerCase().trim().split("@").reverse()
                return `${domain}@${local}`
            }
        })
    ]
})