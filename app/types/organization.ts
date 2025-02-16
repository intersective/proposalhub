export interface OrganizationRecord {
  id: string;
  ownerOrganizationId?: string;
  name: string;
  background?: string;
  logoUrl?: string;
  website?: string;
  sector?: string;
  size?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  createdAt: Date;
  updatedAt: Date;
} 

export interface Organization extends OrganizationRecord {
  proposalCount?: number;
  contactCount?: number;
}
