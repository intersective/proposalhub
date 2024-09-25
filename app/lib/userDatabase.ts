// lib/userDatabase.ts
import { db } from './firebase';
import { query, where, collection, doc, getDoc, getDocs, addDoc, updateDoc } from 'firebase/firestore';
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
  const userRef = await addDoc(collection(db, 'users'), user);
  const userDoc = await getDoc(userRef);
  return { id: userRef.id, ...userDoc.data() } as User;
}

export const getUserById = async (id: string) => { 
  // Query Firestore for the user by ID
  // Return user data or null
  const userDoc = await getDoc(doc(db, 'users', id));
  return userDoc.exists() ? prepareUser(userDoc.id, userDoc.data()) : null;
}

export const getUserByLoginCode = async (loginCode: string) => {
  // Query Firestore for the user by login code
  // Return user data or null
  if (!loginCode) {
    return null;
  }

  const userQuery = query(collection(db, 'users'), where('login.code', '==', loginCode));
  const querySnapshot = await getDocs(userQuery);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return userDoc.exists() ? prepareUser(userDoc.id, userDoc.data()) : null;

}

export const getUserByEmail = async (email: string) => {
  // Query Firestore for the user by email
  // Return user data or null
  if (!email) { 
    return null;
  }

  const userQuery = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(userQuery);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return userDoc.exists() ? prepareUser(userDoc.id, userDoc.data()) : null;
};

export const getUserByUserId = async (userId: string) => {
  if (!userId) { 
    return null;
  }
  const userQuery = query(collection(db, 'users'), where('userId', '==', userId));
  const querySnapshot = await getDocs(userQuery);
  if (querySnapshot.empty) {
    return null;
  }
  const userDoc = querySnapshot.docs[0];
  return userDoc.exists() ? prepareUser(userDoc.id, userDoc.data()) : null;
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
  await updateDoc(doc(db, 'users', id), { login: { code: code, proposalId: proposalId } });
};

export const saveUserChallenge = async (id: string, challenge: string) => { 
  await updateDoc(doc(db, 'users', id), { currentChallenge: challenge });
};

export const updateUserCredentials = async (id: string, credential: Credential) => {
  // get user by ID
  // update user's credentials array with new credential
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
    // is there already a credential with this crendential.credentialID?
    const existingCredential = user.credentials?.find((cred: Credential) => cred.credentialID === credential.credentialID);
    if (existingCredential) {
      throw new Error(`Credential with ID ${credential.credentialID} already exists`);
    }
  }
  
  await updateDoc(doc(db, 'users', id), {
    credentials: [newCredential], // Or append to existing credentials
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
  // update the counter for the credential with the given credentialID
  // also convert credentialPublicKey from Uint8Array to base64 string so we can save it in Firestore
  const updatedCredentials = (user.credentials ?? []).map((cred: any) =>
    cred.credentialID === credentialID
      ? {
          ...cred,
          counter,
          credentialPublicKey: Buffer.from(cred.credentialPublicKey).toString('base64'),
        }
      : cred  
  );
  await updateDoc(doc(db, 'users', id), { credentials: updatedCredentials });
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
  await updateDoc(doc(db, 'users', user.id), {
      proposals: [...user.proposals || [], proposalId],
  });
};

// remove a proposal from the user's list of proposals
export const removeUserProposal = async (email: string, proposalId: string) => {
  const user = await getUserByEmail(email) as User;
  if (!user || !user.id) {
    throw new Error(`User with email ${email} not found`);
  }
  
  await updateDoc(doc(db, 'users', user.id), {
    proposals: (user.proposals || []).filter((id: string) => id !== proposalId),
  });

  };

  export const prepareUser = (id: string, data: any) => {
    // map data.credentials to convert credentialPublicKey from base64 string to Uint8Array
    if (data.credentials) {
      data.credentials = data.credentials.map((cred: any) => ({
        ...cred,
        credentialPublicKey: new Uint8Array(Buffer.from(cred.credentialPublicKey, 'base64')),
      }));
    }
    return { id, ...data } as User
  };
