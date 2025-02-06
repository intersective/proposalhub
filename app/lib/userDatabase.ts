// lib/userDatabase.ts
import { adminDb } from './firebaseAdmin';
import { v4 as uuid } from 'uuid';

export interface Credential {
  credentialID: string;
  counter: number;
  credentialPublicKey: Uint8Array;
  transports: string[];
}

export interface User {
  id?: string;
  userId: string;
  email: string;
  role?: string;
  credentials?: Credential[];
  currentChallenge?: string;
  proposals?: string[];
  login?: {
    code?: string;
    proposalId?: string;
  };
}

export const createUser = async (email: string) => { 
  // Create a new user
  // use UUID to generate unique ID
  const userId = uuid();
  const user = {
    userId: userId.toString(),
    email,
    proposals: [],
  } as User;
  const userRef = await adminDb.collection('users').add(user);
  const userDoc = await userRef.get();
  return { id: userRef.id, ...userDoc.data() } as User;
}

export const getUserById = async (id: string) => { 
  // Query Firestore for the user by ID
  // Return user data or null
  const userDoc = await adminDb.collection('users').doc(id).get();
  return userDoc.exists ? prepareUser(userDoc.id, userDoc.data()) : null;
}

export const getUserByLoginCode = async (loginCode: string) => {
  // Query Firestore for the user by login code
  // Return user data or null
  if (!loginCode) {
    return null;
  }

  const querySnapshot = await adminDb.collection('users')
    .where('login.code', '==', loginCode)
    .get();
    
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return userDoc.exists ? prepareUser(userDoc.id, userDoc.data()) : null;
}

export const getUserByEmail = async (email: string) => {
  console.log('Getting user by email:', email);
  // Query Firestore for the user by email
  // Return user data or null
  if (!email) { 
    console.log('No email provided');
    return null;
  }

  try {
    console.log('Querying Firestore for user...');
    const querySnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .get();
    console.log('Query completed. Found documents:', querySnapshot.size);
    
    if (querySnapshot.empty) {
      console.log('No user found with email:', email);
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    console.log('User document exists:', userDoc.exists);
    return userDoc.exists ? prepareUser(userDoc.id, userDoc.data()) : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const getUserByUserId = async (userId: string) => {
  if (!userId) { 
    return null;
  }
  const querySnapshot = await adminDb.collection('users')
    .where('userId', '==', userId)
    .get();
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return userDoc.exists ? prepareUser(userDoc.id, userDoc.data()) : null;
};

// the proposals key contains a list of all proposal IDs that the user has been invited to
export const getUserProposals = async (userId: string) => {
  const user = await getUserByUserId(userId);
  return user?.proposals || [];
};

export const getUserChallenge = async (id: string) => {
  const user = await getUserById(id);
  return user?.currentChallenge;
};

export const saveUserLoginCode = async (id: string, code: string, proposalId: string) => {
  console.log('saving code', id, code, proposalId);
  await adminDb.collection('users').doc(id).update({ 
    login: { code: code, proposalId: proposalId } 
  });
};

export const saveUserChallenge = async (id: string, challenge: string) => { 
  console.log('Saving user challenge for ID:', id);
  try {
    await adminDb.collection('users').doc(id).update({ 
      currentChallenge: challenge 
    });
    console.log('Challenge saved successfully');
  } catch (error) {
    console.error('Error saving user challenge:', error);
    throw error;
  }
};

export const updateUserCredentials = async (id: string, credential: Credential) => {
  const user = await getUserById(id) as User;
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }
  const newCredential = {
    credentialID: credential.credentialID,
    counter: credential.counter,
    credentialPublicKey: Buffer.from(credential.credentialPublicKey).toString('base64'),
    transports: credential.transports,
  };

  if (user.credentials?.length === 0) {
    const existingCredential = user.credentials?.find(
      (cred: Credential) => cred.credentialID === credential.credentialID
    );
    if (existingCredential) {
      throw new Error(`Credential with ID ${credential.credentialID} already exists`);
    }
  }
  
  await adminDb.collection('users').doc(id).update({
    credentials: [newCredential],
  });
};

export const updateUserCredentialCounter = async (
  id: string,
  credentialID: string,
  counter: number
) => {
  const user = await getUserById(id) as User;
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }
  const updatedCredentials = (user.credentials ?? []).map((cred: Credential) =>
    cred.credentialID === credentialID
      ? {
          ...cred,
          counter,
          credentialPublicKey: Buffer.from(cred.credentialPublicKey).toString('base64'),
        }
      : cred  
  );
  await adminDb.collection('users').doc(id).update({ 
    credentials: updatedCredentials 
  });
};

// add a proposal to the user's list of proposals
export const addUserProposal = async (email: string, proposalId: string) => {
  let user = await getUserByEmail(email) as User;
  if (!user) {
    user = await createUser(email);
  }
  
  if (!user || !user.id) {
    throw new Error(`User ID is undefined for email ${email}`);
  }
  await adminDb.collection('users').doc(user.id).update({
    proposals: [...user.proposals || [], proposalId],
  });
};

// remove a proposal from the user's list of proposals
export const removeUserProposal = async (email: string, proposalId: string) => {
  const user = await getUserByEmail(email) as User;
  if (!user || !user.id) {
    throw new Error(`User with email ${email} not found`);
  }
  
  await adminDb.collection('users').doc(user.id).update({
    proposals: (user.proposals || []).filter((id: string) => id !== proposalId),
  });
};

export const prepareUser = (id: string, data: any) => {
  console.log('Preparing user data:', { id, hasCredentials: !!data.credentials });
  if (data.credentials) {
    try {
      data.credentials = data.credentials.map((cred: Credential) => ({
        ...cred,
        credentialPublicKey: new Uint8Array(Buffer.from(cred.credentialPublicKey, 'base64')),
      }));
      console.log('Credentials prepared successfully');
    } catch (error) {
      console.error('Error preparing credentials:', error);
      throw error;
    }
  }
  return { id, ...data } as User;
};
