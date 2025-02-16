import { adminDb } from '../firebaseAdmin';
import { CollectionReference, Query } from 'firebase-admin/firestore';
import { Organization } from '@/app/types/organization';
import { Contact } from '@/app/types/contact';

export async function searchOrganizations(query: string) {
  try {
    // First try exact match on name
    let snapshot = await adminDb
      .collection('organizations')
      .where('name', '==', query)
      .limit(5)
      .get();

    // If no exact match, try starts with
    if (snapshot.empty) {
      snapshot = await adminDb
        .collection('organizations')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(5)
        .get();
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data().updatedAt.toDate(),
      createdAt: doc.data().createdAt.toDate()
    })) as Organization[];
  } catch (error) {
    console.error('Error searching organizations:', error);
    throw error;
  }
}

export async function searchContacts(query: string, organizationId?: string) {
  try {
    let baseQuery = adminDb.collection('contacts') as CollectionReference | Query;
    
    if (organizationId) {
      baseQuery = baseQuery.where('organizationId', '==', organizationId);
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
      updatedAt: doc.data().updatedAt.toDate(),
      createdAt: doc.data().createdAt.toDate()
    })) as Contact[];
  } catch (error) {
    console.error('Error searching contacts:', error);
    throw error;
  }
}

export async function createOrganization(organization: Omit<Organization, 'id' | 'updatedAt' | 'createdAt'>) {
  try {
    const now = new Date();
    const organizationRef = await adminDb.collection('organizations').add({
      ...organization,
      updatedAt: now,
      createdAt: now
    });
    
    return {
      id: organizationRef.id,
      ...organization,
      updatedAt: now,
      createdAt: now
    } as Organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
}

export async function createContact(contact: Omit<Contact, 'id' | 'updatedAt' | 'createdAt'>) {
  try {
    const now = new Date();
    const contactRef = await adminDb.collection('contacts').add({
      ...contact,
      updatedAt: now,
      createdAt: now
    });
    
    return {
      id: contactRef.id,
      ...contact,
      updatedAt: now,
      createdAt: now
    } as Contact;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
}

export async function getOrganizationById(id: string) {
  try {
    const doc = await adminDb.collection('organizations').doc(id).get();
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data()?.updatedAt.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    } as Organization;
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
}

export async function getContactById(id: string) {
  try {
    const doc = await adminDb.collection('contacts').doc(id).get();
    if (!doc.exists) return null;
    
    return {
      id: doc.id,
      ...doc.data(),
      updatedAt: doc.data()?.updatedAt.toDate(),
      createdAt: doc.data()?.createdAt.toDate()
    } as Contact;
  } catch (error) {
    console.error('Error getting contact:', error);
    throw error;
  }
}

export async function updateOrganization(id: string, organization: Partial<Omit<Organization, 'id' | 'updatedAt' | 'createdAt'>>) {
  try {
    const now = new Date();
    await adminDb.collection('organizations').doc(id).update({
      ...organization,
      updatedAt: now
    });
    
    const updatedDoc = await adminDb.collection('organizations').doc(id).get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      updatedAt: updatedDoc.data()?.updatedAt.toDate(),
      createdAt: updatedDoc.data()?.createdAt.toDate()
    } as Organization;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
} 

export async function getRoleByContactId(contactId: string, organizationId: string) {
  const doc = await adminDb.collection('permissions')
  .where('contactId', '==', contactId)
  .where('organizationId', '==', organizationId)
  .limit(1).get();
  if (doc.empty) return null;
  return doc.docs[0].data()?.role;
}