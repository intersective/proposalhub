// lib/userDatabase.ts
import { adminDb } from '../firebaseAdmin';
import { v4 as uuid } from 'uuid';
import { UserRecord, Credential } from '@/app/types/user';

export const createUser = async (email: string) => { 
  // Create a new user
  // use UUID to generate unique ID
  const userId = uuid();
  const user = {
    userId: userId.toString(),
    email,
    proposals: [],
  } as UserRecord;
  const userRef = await adminDb.collection('users').add(user);
  const userDoc = await userRef.get();
  return { id: userRef.id, ...userDoc.data() } as UserRecord;
}

export const getUserById = async (id: string) => { 
  // Query Firestore for the user by ID
  // Return user data or null
  const userDoc = await adminDb.collection('users').doc(id).get();
  return userDoc.exists ? prepareUser(userDoc.id, userDoc.data() as UserRecord) : null;
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
  return userDoc.exists ? prepareUser(userDoc.id, userDoc.data() as UserRecord) : null;
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
    return userDoc.exists ? prepareUser(userDoc.id, userDoc.data() as UserRecord) : null;
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
  return userDoc.exists ? prepareUser(userDoc.id, userDoc.data() as UserRecord) : null;
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
  const user = await getUserById(id) as UserRecord;
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
  const user = await getUserById(id) as UserRecord;
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

export const prepareUser = (id: string, data: UserRecord) => {
  console.log('Preparing user data:', { id, email: data.email, hasCredentials: !!data.credentials });
  if (data.credentials) {
    try {
      data.credentials = data.credentials.map((cred: Credential) => ({
        ...cred,
        credentialPublicKey: new Uint8Array(Buffer.from(cred.credentialPublicKey.toString(), 'base64')),
      }));
      console.log('Credentials prepared successfully');
    } catch (error) {
      console.error('Error preparing credentials:', error);
      throw error;
    }
  }
  return { id, ...data } as UserRecord;
};
