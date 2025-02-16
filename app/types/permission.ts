export interface PermissionRecord {
    id: string;
    permittedEntity: string;
    permittedEntityId: string;
    targetEntity: string;
    targetEntityId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }