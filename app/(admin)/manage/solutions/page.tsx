import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import SolutionsPageClient from './SolutionsPageClient';
import { auth } from '@/auth';

export default async function SolutionsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SolutionsPageClient />
    </Suspense>
  );
} 