import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { initFirestore } from "@auth/firebase-adapter";
import { DocumentData, Query, WhereFilterOp } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
};

// Initialize Firebase Admin
const apps = getApps();
const app = apps.length === 0 ? initializeApp(firebaseAdminConfig) : apps[0];

// Initialize Storage
export const adminStorage = getStorage(app);

const unsafeDb = initFirestore(app);

export { unsafeDb };

// Error handling utilities
export class FirestoreError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string
  ) {
    super(message);
    this.name = 'FirestoreError';
  }
}

export async function handleFirestoreError<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'failed-precondition' || error.code === 'resource-exhausted') {
        console.log('Missing Firestore Index. Creation URL:', 'details' in error ? error.details : 'No details provided');
        throw new FirestoreError(
          'Missing required Firestore index',
          error.code as string,
          'details' in error ? (error.details as string) : undefined
        );
      }
      throw new FirestoreError(
        'Firestore operation failed',
        error.code as string,
        'details' in error ? (error.details as string) : undefined
      );
    }
    throw error;
  }
}

// Wrap Firestore operations with error handling
export const adminDb = {
  collection: (path: string) => {
    const collection = unsafeDb.collection(path);
    
    const wrapQuery = (query: Query) => ({
      ...query,
      get: () => handleFirestoreError(() => query.get()),
      where: (fieldPath: string, opStr: WhereFilterOp, value: string | number | boolean | null | Date) => 
        wrapQuery(query.where(fieldPath, opStr, value)),
      orderBy: (...orderArgs: Parameters<Query['orderBy']>) => 
        wrapQuery(query.orderBy(...orderArgs)),
      limit: (limit: number) => 
        wrapQuery(query.limit(limit)),
      count: () => ({
        get: () => handleFirestoreError(() => query.count().get())
      })
    });

    return {
      ...collection,
      get: () => handleFirestoreError(() => collection.get()),
      add: (data: DocumentData) => handleFirestoreError(() => collection.add(data)),
      orderBy: (...args: Parameters<Query['orderBy']>) => wrapQuery(collection.orderBy(...args)),
      doc: (id: string) => {
        const doc = collection.doc(id);
        return {
          ...doc,
          ref: doc,
          get: () => handleFirestoreError(() => doc.get()),
          set: (data: DocumentData) => handleFirestoreError(() => doc.set(data)),
          update: (data: DocumentData) => handleFirestoreError(() => doc.update(data)),
          delete: () => handleFirestoreError(() => doc.delete()),
          collection: (path: string) => adminDb.collection(`${doc.path}/${path}`)
        };
      },
      where: (fieldPath: string, opStr: WhereFilterOp, value: string | number | boolean | null | Date) => 
        wrapQuery(collection.where(fieldPath, opStr, value))
    };
  },
  batch: () => unsafeDb.batch()
}; 