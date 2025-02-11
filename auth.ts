import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { firestore } from "@/app/lib/firebaseAuth"
import authConfig from "@/auth.config"


export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: FirestoreAdapter(firestore),
    session: { strategy: "jwt" },
    ...authConfig,
})