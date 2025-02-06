// lib/proposalDatabase.ts
import { adminDb } from './firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import { getUserByUserId } from './userDatabase';

const storage = getStorage();

export interface Proposal {
    id?: string;
    images?: string[];
    createdAt: Date;
    title?: string;
    description?: string;
    status?: 'draft' | 'submitted' | 'approved' | 'rejected';
    metadata?: Record<string, string | number | boolean>;
}

export const createProposal = async (userId: string, proposal: Proposal) => {
    // Create a new proposal document
    const proposalRef = await adminDb.collection('proposals').add(proposal);
    const proposalId = proposalRef.id;

    // Update the user document with the proposal ID
    const user = await getUserByUserId(userId);
    if (!user || !user.id) {
        throw new Error('User not found');
    }
    
    const userDoc = await adminDb.collection('users').doc(user.id).get();
    const userProposals = userDoc.data()?.proposals || [];
    await adminDb.collection('users').doc(user.id).update({
        proposals: [...userProposals, proposalId],
    });

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

export const getUserProposals = async (userId: string) => {
    // Query Firestore for the user's proposals
    // Return an array of proposal IDs
    const userDoc = await adminDb.collection('proposals').doc(userId).get();
    return userDoc.exists ? userDoc.data()?.proposals || [] : [];
};


