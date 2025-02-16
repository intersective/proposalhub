import { adminDb } from '@/app/lib/firebaseAdmin';
import { AccountRecord, UserRole, UserProfile } from '@/app/types/account';
import { FieldValue } from 'firebase-admin/firestore';

export async function createAccount(account: Omit<AccountRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountRecord> {
  const accountsRef = adminDb.collection('accounts');
  const docRef = await accountsRef.add({
    ...account,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  const docSnap = await docRef.get();
  return mapAccountFromDoc(docSnap);
}

export async function getAccountByOrgId(organizationId: string): Promise<AccountRecord | null> {
  const accountsRef = adminDb.collection('accounts');
  const querySnapshot = await accountsRef.where('organizationId', '==', organizationId).get();
  
  if (querySnapshot.empty) {
    return null;
  }

  return mapAccountFromDoc(querySnapshot.docs[0]);
}

export async function updateAccount(id: string, account: Partial<AccountRecord>): Promise<AccountRecord> {
  const accountRef = adminDb.collection('accounts').doc(id);
  await accountRef.update({
    ...account,
    updatedAt: FieldValue.serverTimestamp()
  });

  const docSnap = await accountRef.get();
  return mapAccountFromDoc(docSnap);
}

export async function addUserRole(role: UserRole): Promise<void> {
  const userRolesRef = adminDb.collection('userRoles');
  await userRolesRef.add({
    ...role,
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function removeUserRole(contactId: string, organizationId: string): Promise<void> {
  const userRolesRef = adminDb.collection('userRoles');
  const querySnapshot = await userRolesRef
    .where('contactId', '==', contactId)
    .where('organizationId', '==', organizationId)
    .get();
  
  const batch = adminDb.batch();
  querySnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export async function getUserProfile(contactId: string): Promise<UserProfile | null> {
  try {
    // Get contact info
    const contactRef = adminDb.collection('contacts').doc(contactId);
    const contactSnap = await contactRef.get();
    
    if (!contactSnap.exists) {
      console.log('contactSnap failed for contactId:', contactId);
      return null;
    }

    const contactData = contactSnap.data()!;
    const organizationId = contactData?.organizationId;

    if (!organizationId) {
      console.log('organizationId failed for organizationId:', organizationId);
      return null;
    }

    // Get organization and role in parallel
    const [orgSnap, permissionsSnap] = await Promise.all([
      adminDb.collection('organizations').doc(organizationId).get(),
      adminDb.collection('permissions')
        .where('permittedEntity', '==', 'contact')
        .where('permittedId', '==', contactId)
        .where('targetEntity', '==', 'organization')
        .where('targetEntityId', '==', organizationId)
        .limit(1)
        .get()
    ]);

    if (!orgSnap.exists || permissionsSnap.empty) {
      console.log('orgSnap.exists failed for orgSnap:', orgSnap.exists);
      console.log('permissionsSnap.empty failed for permissionsSnap:', permissionsSnap.empty);
      return null;
    }

    // Get account info
    const accountSnap = await adminDb.collection('accounts')
      .where('organizationId', '==', organizationId)
      .limit(1)
      .get();

    if (accountSnap.empty) {
      console.log('accountSnap.empty failed for organizationId:', organizationId);
      return null;
    }

    const accountData = accountSnap.docs[0].data();
    const orgData = orgSnap.data()!;

    const userProfile: UserProfile = {
      id: contactId,
      organizationId,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      phone: contactData.phone,
      title: contactData.title,
      image: contactData.image,
      createdAt: contactData.createdAt.toDate(),
      updatedAt: contactData.updatedAt.toDate(),
      organization: {
        id: organizationId,
        name: orgData.name,
        logoUrl: orgData.logoUrl,
        background: orgData.background,
        website: orgData.website,
        sector: orgData.sector,
        size: orgData.size,
        address: orgData.address,
        createdAt: orgData.createdAt.toDate(),
        updatedAt: orgData.updatedAt.toDate()
      },
      role: permissionsSnap.docs[0].data().role,
      account: {
        subscriptionTier: accountData.subscriptionTier,
        billingContactId: accountData.billingContactId
      }
    };

    console.log('userProfile:', userProfile);
    return userProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  const userRef = adminDb.collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) { 
    return null;
  }

  const userData = userSnap.data()!;
  const contactId = userData.contactId; 
  
  return getUserProfile(contactId);
}

export async function getOrganizationsByContactId(contactId: string) {
  try {
    // Get all organizations the contact has access to
    const permissionsSnapshot = await adminDb.collection('permissions')
      .where('permittedEntity', '==', 'contact')
      .where('permittedEntityId', '==', contactId)
      .where('targetEntity', '==', 'organization')
      .get();

    const organizationIds = permissionsSnapshot.docs.map(doc => doc.data().targetEntityId);
    console.log('contactId', contactId, 'organizationIds:', organizationIds);
    
    if (organizationIds.length === 0) {
      console.log('No organizations found for contactId:', contactId);
      return [];
    }

    // Get organization details using Promise.all to fetch each org
    const organizations = await Promise.all(
      organizationIds.map(async (orgId) => {
        const orgDoc = await adminDb.collection('organizations').doc(orgId).get();
        if (!orgDoc.exists) return null;
        
        const orgData = orgDoc.data()!;
        const permission = permissionsSnapshot.docs.find(
          pDoc => pDoc.data().targetEntityId === orgId
        );
        
        return {
          id: orgDoc.id,
          name: orgData.name,
          logoUrl: orgData.logoUrl,
          role: permission?.data().role
        };
      })
    );

    // Filter out any null values from non-existent docs
    return organizations.filter((org): org is NonNullable<typeof org> => org !== null);
  } catch (error) {
    console.error('Error getting organizations:', error);
    return [];
  }
}

function mapAccountFromDoc(doc: FirebaseFirestore.DocumentSnapshot): AccountRecord {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');
  
  return {
    id: doc.id,
    organizationId: data.organizationId,
    subscriptionTier: data.subscriptionTier,
    stripeCustomerId: data.stripeCustomerId,
    billingContactId: data.billingContactId,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  };
} 