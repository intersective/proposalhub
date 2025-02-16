import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import SolutionEditorClient from './SolutionEditorClient';
import { auth } from '@/auth';

export default async function SolutionEditorPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect('/signin');
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SolutionEditorClient solutionId={params.id} />
    </Suspense>
  );
} 