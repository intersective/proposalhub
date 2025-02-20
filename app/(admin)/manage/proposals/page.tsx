import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ProposalsPageClient from '@/app/(admin)/manage/proposals/ProposalsPageClient';
import { auth } from '@/auth';

export default async function ProposalsPage() {
  const session = await auth();
  console.log('proposal page session', session);
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProposalsPageClient />
    </Suspense>
  );
} 