import { Contact } from '@/app/types/contact';

export type TeamType = 'organization' | 'proposal' | 'solution' | 'opportunity';

export interface TeamMembership {
  id: string;
  teamId: string;
  teamType: TeamType;
  contactId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember extends Contact {
  imageUrl?: string;
  name: string;
  title?: string;
  skills?: string[];
  credentials?: {
    degrees?: string[];
    pastRoles?: string[];
    certifications?: string[];
  };
  portfolio?: {
    id: string;
    title: string;
    url: string;
    description?: string;
  }[];
  teamMembershipId: string;
} 