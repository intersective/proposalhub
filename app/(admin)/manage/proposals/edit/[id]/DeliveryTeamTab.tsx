'use client';

import { useState, useEffect } from 'react';
import { ProposalRecord } from '@/app/types/proposal';
import { PermissionRecord } from '@/app/types/permission';

export default function DeliveryTeamTab({ proposalId }: { proposalId: string }) {
    const [proposal, setProposal] = useState<ProposalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [companyContacts, setCompanyContacts] = useState<Array<{ id: string; name: string; email: string; role?: string }>>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    
    return (
        <div>
            <h1>Delivery Team</h1>
        </div>
    )
}