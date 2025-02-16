import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';

interface ProposalView {
  id: string;
  viewerId: string;
  sectionId?: string;
  duration: number;
  timestamp: Date;
}

interface ProposalData {
  id: string;
  status: 'draft' | 'published' | 'archived';
  requirements?: {
    organization: any;
    leadContact: any;
  };
  team?: any[];
  sections?: {
    id: string;
    content: string;
  }[];
  reviews?: any[];
  layout?: {
    template: string;
  };
  permissions?: any[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the proposal
    const proposalDoc = await adminDb.collection('proposals').doc(id).get();
    if (!proposalDoc.exists) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposal = {
      id: proposalDoc.id,
      ...proposalDoc.data()
    } as ProposalData;

    // If proposal is in draft status, return todo list
    if (proposal.status === 'draft') {
      const todoList = [
        {
          id: 'requirements',
          title: 'Gather Requirements',
          description: 'Define project scope, timeline, and budget',
          completed: Boolean(proposal.requirements?.organization && proposal.requirements?.leadContact),
          tab: 'requirements'
        },
        {
          id: 'team',
          title: 'Choose Team Members',
          description: 'Select the team that will deliver the project',
          completed: Boolean(proposal.team?.length > 0),
          tab: 'team'
        },
        {
          id: 'content',
          title: 'Draft the Proposal',
          description: 'Write and structure your proposal content',
          completed: Boolean(proposal.sections?.some(s => s.content && s.content.trim() !== '')),
          tab: 'content'
        },
        {
          id: 'review',
          title: 'Review & Improve',
          description: 'Have AI and/or team members review the proposal',
          completed: Boolean(proposal.reviews?.length > 0),
          tab: 'content'
        },
        {
          id: 'layout',
          title: 'Choose a Layout',
          description: 'Select and customize your proposal layout',
          completed: Boolean(proposal.layout?.template),
          tab: 'layout'
        },
        {
          id: 'recipients',
          title: 'Add Recipients',
          description: 'Add people who will receive the proposal',
          completed: Boolean(proposal.permissions?.length > 0),
          tab: 'share'
        },
        {
          id: 'publish',
          title: 'Publish',
          description: 'Publish and share your proposal',
          completed: false,
          tab: 'share'
        }
      ];

      return NextResponse.json({ type: 'todo', items: todoList });
    }
    
    // If proposal is published, return metrics
    const viewsSnapshot = await adminDb
      .collection('proposals')
      .doc(id)
      .collection('views')
      .get();

    const views = viewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate()
    })) as ProposalView[];

    // Calculate metrics
    const metrics = {
      totalViews: views.length,
      uniqueViewers: new Set(views.map(v => v.viewerId)).size,
      averageViewDuration: views.reduce((acc, v) => acc + (v.duration || 0), 0) / views.length,
      viewsBySection: views.reduce((acc, v) => {
        if (v.sectionId) {
          acc[v.sectionId] = (acc[v.sectionId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      firstViewedAt: views.length > 0 ? Math.min(...views.map(v => v.timestamp.getTime())) : null,
      lastViewedAt: views.length > 0 ? Math.max(...views.map(v => v.timestamp.getTime())) : null
    };

    return NextResponse.json({ type: 'metrics', data: metrics });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
} 