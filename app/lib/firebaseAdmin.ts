import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { initFirestore } from "@auth/firebase-adapter";

// Initialize Firebase Admin
const apps = getApps();

let adminApp;
if (!apps.length) {
  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
} else {
  adminApp = apps[0];
}

if (!adminApp) {
  throw new Error('Firebase Admin app not initialized');
}

const adminStorage = getStorage(adminApp);
const adminDb = initFirestore(adminApp);

export { adminDb, adminStorage }; 