import { Suspense } from 'react';
import ProposalEditorClient from './ProposalEditorClient';
import { TabType } from './ProposalEditorClient';

interface Props {
  params: {
    id: string;
  };
  searchParams: {
    tab?: string;
  };
}

export default async function ProposalEditPage({ params, searchParams }: Props) {
  const validTabs: TabType[] = ['analysis', 'requirements', 'team', 'content', 'layout', 'share'];
  const { id } = await params;

  let { tab } = await searchParams;
  
  if (tab && validTabs.includes(tab as TabType)) {
    tab = tab as TabType;
  } else {
    tab = 'analysis' as TabType;
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    }>
      <ProposalEditorClient proposalId={id} initialTab={tab as TabType} />
    </Suspense>
  );
} 