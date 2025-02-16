import { Inter } from 'next/font/google'
import './globals.css'
import { NextAuthProvider } from '@/app/providers'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ProposalHub',
  description: 'Create and manage proposals with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
        <ToastContainer position="bottom-right" />
      </body>
    </html>
  )
}