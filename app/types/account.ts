import { Contact } from '@/app/types/contact';
import { Organization } from "@/app/types/organization";

export type SystemRole = 'owner' | 'admin' | 'member';

export interface UserRole {
  contactId: string;
  organizationId: string;
  role: SystemRole;
}

// result type for the user query
export interface UserProfile extends Contact {
  organization: Organization;
  role: SystemRole;
  account: Omit<AccountRecord, 'id' | 'organizationId' | 'stripeCustomerId' | 'createdAt' | 'updatedAt'>;
}

export interface UserOrganizations extends UserProfile {
  organizations: {
    id: string;
    name: string;
    role: SystemRole;
    logoUrl?: string;
  }[];
}

export interface AccountRecord {
  id: string;
  organizationId: string; // active organization
  subscriptionTier: 'free' | 'basic' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  billingContactId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account extends AccountRecord {
  id: string;
  organization: Organization;
  billingContact: Contact;
}