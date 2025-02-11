import authConfig from '@/auth.config'
import NextAuth from 'next-auth'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    // Add your protected routes here
    '/proposals/:path*',
    '/admin/:path*',
    // Exclude auth-related routes and public assets
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
}