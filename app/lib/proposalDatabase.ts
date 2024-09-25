// lib/userDatabase.ts
import { db, storage } from './firebase';
import { getUserByUserId } from './userDatabase';
import { doc, collection, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const createProposal = async (userId: string, proposal: any) => {
    // Create a new proposal document
    const proposalRef = await addDoc(collection(db, 'proposals'), proposal);
    const proposalDoc = await getDoc(proposalRef);
    const proposalId = proposalRef.id;

    // Update the user document with the proposal ID
    const user = await getUserById(userId);
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userProposals = userDoc.data().proposals || [];
    userProposals.push(proposalId);
    await updateDoc(doc(db, 'users', userId), {
        proposals: userProposals,
    });

    return proposalId;
}


export const uploadProposalImages = async (proposalId: string, fileName: string, pdfImageBuffer: Buffer) => {

    const storageRef = ref(storage, fileName);

    // Upload image to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, pdfImageBuffer);
    const imageUrl = await getDownloadURL(uploadResult.ref);

    // Update the proposal document with the image URLs
    await updateDoc(doc(db, 'proposals', proposalId), {
        images,
    });


        // Store the proposal data in Firestore
        await setDoc(doc(db, 'proposals', proposalId), {
            images: imageUrls,
            createdAt: new Date(),
        });

    }
}

export const getUserProposals = async (userId: string) => {
  // Query Firestore for the user's proposals
  // Return an array of proposal IDs
  const userDoc = await getDoc(doc(db, 'proposals', userId));
  return userDoc.exists() ? userDoc.data().proposals : [];
}


