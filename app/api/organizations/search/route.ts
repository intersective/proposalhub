import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { Organization } from '@/app/types/organization';
import { Option } from '@/app/components/shared/SearchableDropdown';

export async function GET(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.profile?.organizationId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const ownerOrganizationId = session.user.profile.organizationId;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.toLowerCase() || '';
    
    if (!query) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const snapshot = await adminDb
        .collection('organizations')
        .where('ownerOrganizationId', '==', ownerOrganizationId)
        .where('nameLower', '>=', query)
        .where('nameLower', '<=', query + '\uf8ff')
        .limit(10)
        .get();
    if (snapshot.empty) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get contact counts for each organization
    const organizations = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const org = { id: doc.id, ...doc.data() } as Organization;
        
        // Get contact count
        const contactsSnapshot = await adminDb
          .collection('contacts')
          .where('organizationId', '==', doc.id)
          .count()
          .get();

        const contactCount = contactsSnapshot.data()?.count || 0;

        // Format the result as an Option with HTML
        const result: Option = {
          label: org.name,
          value: org.id,
          count: contactCount,
          data: org,
          html: `
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0 w-8 h-8 relative">
                ${org.logoUrl 
                  ? `<img src="${org.logoUrl}" alt="${org.name}" class="rounded-md object-contain w-full h-full" />`
                  : `<div class="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>`
                }
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-gray-900 dark:text-white truncate">
                  ${org.name}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                  <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>${contactCount} contacts</span>
                </div>
              </div>
            </div>
          `
        };

        return result;
      })
    );

    return new Response(JSON.stringify(organizations), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error searching organizations:', error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 