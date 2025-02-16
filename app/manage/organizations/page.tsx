import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import OrganizationsPageClient from './OrganizationsPageClient';
import { auth } from '@/auth';

export default async function OrganizationsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrganizationsPageClient />
    </Suspense>
  );
} 