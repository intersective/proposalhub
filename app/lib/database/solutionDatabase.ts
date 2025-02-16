import { adminDb } from '../firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { SolutionRecord } from '@/app/types/solution';
import { ProposalRecord } from '@/app/types/proposal';

const storage = getStorage();

export const createSolution = async (contactId: string, solution: Omit<SolutionRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Create a new solution document
    const solutionRef = await adminDb.collection('solutions').add({
        ...solution,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
    });
    const solutionId = solutionRef.id;

    // Add permissions for the creator
    await addSolutionToContact(contactId, solutionId, 'owner');

    return solutionId;
};

export const getSolutionsByContactId = async (contactId: string, organizationId?: string) => {
    // Query Firestore for the user's solutions
    const permissionsQuery = adminDb.collection('permissions')
        .where('permittedEntity', '==', 'contact')
        .where('permittedId', '==', contactId)
        .where('targetEntity', '==', 'solution');

    const permissionsSnap = await permissionsQuery.get();
    const solutionIds = permissionsSnap.docs.map(doc => doc.data().targetEntityId);

    if (solutionIds.length === 0) {
        return [];
    }

    // Get all solutions in parallel
    const solutionDocs = await Promise.all(
        solutionIds.map(id => adminDb.collection('solutions').doc(id).get())
    );

    // Filter out non-existent docs and those that don't match organizationId
    const solutions = solutionDocs
        .filter(doc => doc.exists)
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SolutionRecord))
        .filter(solution => !organizationId || solution.organizationId === organizationId);

    return solutions;
};

export const updateSolution = async (solutionId: string, updates: Partial<SolutionRecord>) => {
    const solutionRef = adminDb.collection('solutions').doc(solutionId);
    await solutionRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp()
    });

    const updatedDoc = await solutionRef.get();
    return {
        id: updatedDoc.id,
        ...updatedDoc.data()
    } as SolutionRecord;
};

export const deleteSolution = async (solutionId: string) => {
    // Delete the solution document
    await adminDb.collection('solutions').doc(solutionId).delete();

    // Delete all permissions related to this solution
    const permissionsQuery = await adminDb.collection('permissions')
        .where('targetEntity', '==', 'solution')
        .where('targetEntityId', '==', solutionId)
        .get();

    const batch = adminDb.batch();
    permissionsQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};

export const uploadSolutionMedia = async (solutionId: string, fileName: string, buffer: Buffer) => {
    const bucket = storage.bucket();
    const file = bucket.file(`solutions/${solutionId}/${fileName}`);

    // Upload file to Firebase Storage
    await file.save(buffer);
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Far future expiration
    });

    // Add the media asset to the solution document
    const mediaAsset = {
        id: fileName,
        url,
        type: fileName.split('.').pop() || '',
        name: fileName,
        createdAt: new Date()
    };

    await adminDb.collection('solutions').doc(solutionId).update({
        mediaAssets: FieldValue.arrayUnion(mediaAsset)
    });

    return mediaAsset;
};

export const deleteSolutionMedia = async (solutionId: string, mediaId: string) => {
    const bucket = storage.bucket();
    const file = bucket.file(`solutions/${solutionId}/${mediaId}`);

    // Delete file from Firebase Storage
    await file.delete();

    // Remove the media asset from the solution document
    const solutionRef = adminDb.collection('solutions').doc(solutionId);
    const solution = await solutionRef.get();
    const mediaAssets = (solution.data()?.mediaAssets || [])
        .filter((asset: { id: string }) => asset.id !== mediaId);

    await solutionRef.update({ mediaAssets });
};

// Permission management functions
export const addSolutionToContact = async (contactId: string, solutionId: string, role: string) => {
    await adminDb.collection('permissions').add({
        permittedEntity: 'contact',
        permittedId: contactId,
        targetEntity: 'solution',
        targetEntityId: solutionId,
        role,
        createdAt: FieldValue.serverTimestamp()
    });
};

export const removeSolutionFromContact = async (contactId: string, solutionId: string) => {
    const querySnapshot = await adminDb.collection('permissions')
        .where('permittedEntity', '==', 'contact')
        .where('permittedId', '==', contactId)
        .where('targetEntity', '==', 'solution')
        .where('targetEntityId', '==', solutionId)
        .get();

    const batch = adminDb.batch();
    querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};

export const extractSolutionFromProposal = async (proposalId: string, contactId: string) => {
    const proposalRef = adminDb.collection('proposals').doc(proposalId);
    const proposal = await proposalRef.get();
    
    if (!proposal.exists) {
        throw new Error('Proposal not found');
    }

    const proposalData = proposal.data() as ProposalRecord;
    
    // Create a new solution with data extracted from the proposal
    const solutionData: Omit<SolutionRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        organizationId: proposalData.forOrganizationId,
        title: `Solution from ${proposalData.title || 'Untitled Proposal'}`,
        status: 'draft',
        sections: {
            description: {
                id: 'description',
                title: 'Description',
                content: proposalData.sections.find((s) => s.id === 'projectScope')?.content.toString() || '',
            },
            benefits: {
                id: 'benefits',
                title: 'Benefits',
                content: proposalData.sections.find((s) => s.id === 'executiveSummary')?.content.toString() || '',
            },
            painPoints: {
                id: 'painPoints',
                title: 'Pain Points Addressed',
                content: proposalData.sections.find((s) => s.id === 'projectBackground')?.content.toString() || '',
            },
            timeline: {
                id: 'timeline',
                title: 'Implementation Timeline',
                content: proposalData.sections.find((s) => s.id === 'projectTimeline')?.content.toString() || '',
            },
            competitivePosition: {
                id: 'competitivePosition',
                title: 'Competitive Positioning',
                content: '',
            },
            pricing: {
                id: 'pricing',
                title: 'Pricing',
                content: proposalData.sections.find((s) => s.id === 'pricing')?.content.toString() || '',
            }
        },
        mediaAssets: []
    };

    return createSolution(contactId, solutionData);
}; 