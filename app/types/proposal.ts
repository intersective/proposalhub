

export interface ProposalResponse {
    id: string;
    title?: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    updatedAt: string;
    sections: Array<{
      id: string;
      title: string;
      content: string | Record<string, string>;
      type: 'text' | 'fields';
      images?: {
        background?: string[];
        content?: string[];
      };
    }>;
  }
  
  export interface ProposalRecord {
    id: string;
    title?: string;
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    ownerOrganizationId: string;
    forOrganizationId: string;
    forContactId: string;
    sections: Array<{
      id: string;
      title: string;
      content: string | Record<string, string>;
      type: 'text' | 'fields';
      images?: {
        background?: string[];
        content?: string[];
      };
    }>;
  }

