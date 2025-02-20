import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import OpportunitiesPageClient from './OpportunitiesPageClient';
import { auth } from '@/auth';

export default async function RFPsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OpportunitiesPageClient />
    </Suspense>
  );
} 