import { Organization } from './organization';

export interface ContactRecord {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  background?: string;
  image?: string;
  linkedIn?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
} 

export interface Contact extends ContactRecord {
  organization?: Organization;
  role: string | null;
  name: string;
  imageUrl?: string;
  ownerOrganizationId: string;
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
}

