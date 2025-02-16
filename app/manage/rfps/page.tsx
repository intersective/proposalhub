import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import RFPsPageClient from './RFPsPageClient';
import { auth } from '@/auth';

export default async function RFPsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RFPsPageClient />
    </Suspense>
  );
} 