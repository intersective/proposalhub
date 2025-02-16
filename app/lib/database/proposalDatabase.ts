// lib/proposalDatabase.ts
import { adminDb } from '../firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { SystemRole } from '@/app/types/account';
import { ProposalRecord } from '@/app/types/proposal';
const storage = getStorage();


export const createProposal = async (contactId: string, proposal: ProposalRecord) => {
    // Create a new proposal document
    const proposalRef = await adminDb.collection('proposals').add(proposal);
    const proposalId = proposalRef.id;

    addProposalToContact(contactId, proposalId, 'owner');

    return proposalId;
}

export const uploadProposalImages = async (proposalId: string, fileName: string, pdfImageBuffer: Buffer) => {
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    // Upload image to Firebase Storage
    await file.save(pdfImageBuffer);
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future expiration
    });

    // Update the proposal document with the image URL
    await adminDb.collection('proposals').doc(proposalId).update({
        images: FieldValue.arrayUnion(url),
    });

    return url;
}

export const getProposalsByContactId = async (contactId: string, organizationId?: string) => {
    // Query Firestore for the user's proposals
    const permissionsQuery = adminDb.collection('permissions')
        .where('permittedEntity', '==', 'contact')
        .where('permittedEntityId', '==', contactId)
        .where('targetEntity', '==', 'proposal');

    const permissionsSnap = await permissionsQuery.get();
    const proposalIds = permissionsSnap.docs.map(doc => doc.data().targetEntityId);

    if (proposalIds.length === 0) {
        return [];
    }

    // Get all proposals in parallel
    const proposalDocs = await Promise.all(
        proposalIds.map(id => adminDb.collection('proposals').doc(id).get())
    );

    // Filter out non-existent docs and those that don't match organizationId
    const proposals = proposalDocs
        .filter(doc => doc.exists)
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ProposalRecord))
        .filter(proposal => !organizationId || proposal.ownerOrganizationId === organizationId);

    return proposals;
};


// add a proposal to the user's list of proposals
export const addProposalToContact = async (contactId: string, proposalId: string, role: SystemRole) => {
    
    // add an entry permissions table:
    // contactId: contactId
    // entity: proposal
    // entityId: proposalId
    // role: role
    await adminDb.collection('permissions').doc(contactId).set({
        contactId: contactId,
        entity: 'proposal',
        entityId: proposalId,
        role: role,
    });
};
  
// remove a proposal from the user's list of proposals
export const removeProposalFromContact = async (contactId: string, proposalId: string) => {
    // remove an entry from the permissions table:
    // contactId: contactId
    // entity: proposal
    // entityId: proposalId
    const querySnapshot = await adminDb.collection('permissions')
        .where('contactId', '==', contactId)
        .where('entity', '==', 'proposal')
        .where('entityId', '==', proposalId)
        .get();
    
    const batch = adminDb.batch();
    querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};

export const updateProposalContactRole = async (contactId: string, proposalId: string, role: SystemRole) => {
    const querySnapshot = await adminDb.collection('permissions')
    .where('contactId', '==', contactId)
    .where('entity', '==', 'proposal')
    .where('entityId', '==', proposalId)
    .get();

    const batch = adminDb.batch();
    querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
            role: role,
        });
    });
    await batch.commit();
};


