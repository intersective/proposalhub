import { adminDb } from './firebaseAdmin';
import { CollectionReference, Query } from 'firebase-admin/firestore';

export interface Company {
  id: string;
  name: string;
  website?: string;
  sector?: string;
  size?: string;
  background?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  proposalCount?: number;
  clientCount?: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  linkedIn?: string;
  phone?: string;
  role?: string;
  background?: string;
  lastUpdated: Date;
  createdAt: Date;
}

export async function searchCompanies(query: string) {
  try {
    // First try exact match on name
    let snapshot = await adminDb
      .collection('companies')
      .where('name', '==', query)
      .limit(5)
      .get();

    // If no exact match, try starts with
    if (snapshot.empty) {
      snapshot = await adminDb
        .collection('companies')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(5)
        .get();
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
    })) as Company[];
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
}

export async function searchClients(query: string, companyId?: string) {
  try {
    let baseQuery = adminDb.collection('clients') as CollectionReference | Query;
    
    if (companyId) {
      baseQuery = baseQuery.where('companyId', '==', companyId);
    }

    // First try exact match on name
    let snapshot = await baseQuery
      .where('name', '==', query)
      .limit(5)
      .get();

    // If no exact match, try starts with
    if (snapshot.empty) {
      snapshot = await baseQuery
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(5)
        .get();
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated.toDate(),
      createdAt: doc.data().createdAt.toDate()
    })) as Client[];
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
}

export async function createCompany(company: Omit<Company, 'id' | 'lastUpdated' | 'createdAt'>) {
  try {
    const now = new Date();
    const companyRef = await adminDb.collection('companies').add({
      ...company,
      lastUpdated: now,
      createdAt: now
    });
    
    return {
      id: companyRef.id,
      ...company,
      lastUpdated: now,
      createdAt: now
    } as Company;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

export async function createClient(client: Omit<Client, 'id' | 'lastUpdated' | 'createdAt'>) {
  try {
    const now = new Date();
    const clientRef = await adminDb.collection('clients').add({
      ...client,
      lastUpdated: now,
      createdAt: now
    });
    
    return {
      id: clientRef.id,
      ...client,
      lastUpdated: now,
      createdAt: now
    } as Client;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function getCompanyById(id: string) {
  try {
    const doc = await adminDb.collection('companies').doc(id).get();
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data()?.lastUpdated.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    } as Company;
  } catch (error) {
    console.error('Error getting company:', error);
    throw error;
  }
}

export async function getClientById(id: string) {
  try {
    const doc = await adminDb.collection('clients').doc(id).get();
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data()?.lastUpdated.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    } as Client;
  } catch (error) {
    console.error('Error getting client:', error);
    throw error;
  }
}

export async function updateCompany(id: string, company: Partial<Omit<Company, 'id' | 'lastUpdated' | 'createdAt'>>) {
  try {
    const now = new Date();
    await adminDb.collection('companies').doc(id).update({
      ...company,
      lastUpdated: now
    });
    
    const updatedDoc = await adminDb.collection('companies').doc(id).get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      lastUpdated: updatedDoc.data()?.lastUpdated.toDate(),
      createdAt: updatedDoc.data()?.createdAt.toDate()
    } as Company;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
} 