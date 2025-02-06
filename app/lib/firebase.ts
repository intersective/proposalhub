// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

console.log('Initializing Firebase with config:', {
  hasApiKey: !!process.env.FIREBASE_API_KEY,
  hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
  hasSenderId: !!process.env.FIREBASE_SENDER_ID,
  hasAppId: !!process.env.FIREBASE_APP_ID,
  hasMeasurementId: !!process.env.FIREBASE_MEASUREMENT_ID
});

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

let auth;
let db;
let storage;

// Initialize Firebase
try {
  console.log('Attempting to initialize Firebase app...');
  const app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  console.log('Initializing Firebase services...');
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  console.log('Firebase services initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

export { auth, db, storage };