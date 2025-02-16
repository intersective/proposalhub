import { Organization } from './organization';

export type SolutionSection = {
  id: string;
  title: string;
  content: string;
  mediaAssets?: string[]; // URLs to media assets
};

export type SolutionStatus = 'draft' | 'published' | 'archived';

export interface SolutionRecord {
  id: string;
  organizationId: string;
  title: string;
  status: SolutionStatus;
  sections: {
    description: SolutionSection;
    benefits: SolutionSection;
    painPoints: SolutionSection;
    timeline: SolutionSection;
    competitivePosition: SolutionSection;
    pricing: SolutionSection;
  };
  mediaAssets: {
    id: string;
    url: string;
    type: string;
    name: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Solution extends SolutionRecord {
  organization: Organization;
}

export interface SolutionResponse extends Omit<Solution, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
} 