import NextAuth from 'next-auth'
import authConfig from './auth.config'

export const { auth: middleware } = NextAuth(authConfig)
// export default auth((req) => {
//   const isLoggedIn = !!req.auth
//   const { pathname } = req.nextUrl

//   const isAuthRoute = pathname.startsWith('/signin') || 
//                      pathname.startsWith('/api/auth') ||
//                      pathname.startsWith('/register') ||
//                      pathname.startsWith('/verify')
  
//   const isProtectedRoute = pathname.startsWith('/manage')
//   //console.log('middleware', isLoggedIn, isAuthRoute, isProtectedRoute);
//   // Redirect authenticated users away from auth pages
//   if (isAuthRoute && isLoggedIn) {
//     return NextResponse.redirect(new URL('/manage/proposals', req.url))
//   }

//   // Redirect unauthenticated users to signin
//   if (isProtectedRoute && !isLoggedIn) {
//     const signInUrl = new URL('/signin', req.url)
//     signInUrl.searchParams.set('callbackUrl', pathname)
//     return NextResponse.redirect(signInUrl)
//   }

//   return NextResponse.next()
// })

export const config = {
  matcher: [
    '/manage/:path*',
    '/contact/:path*',
    '/signin',
    '/register/:path*',
  ]
}