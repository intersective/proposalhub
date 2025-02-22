import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import TeamPageClient from './TeamPageClient';
import { auth } from '@/auth';

export default async function TeamPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  if (!session.user.profile?.organizationId) {
    redirect('/onboarding');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamPageClient organizationId={session.user.profile.organizationId} />
    </Suspense>
  );
} 