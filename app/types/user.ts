// type for the credential object
export interface Credential {
    credentialID: string;
    counter: number;
    credentialPublicKey: Uint8Array;
    transports: string[];
  }
  
// record type for the user collection
export interface UserRecord {
    id?: string;
    contactId?: string;
    email: string;
    emailVerified?: boolean;
    credentials?: Credential[];
    currentChallenge?: string;
    activeOrganizationId?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }