import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.profile?.organizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { firstName, lastName, linkedIn, organizationName } = await request.json();

    // Construct search query
    let searchQuery = `${firstName} ${lastName}`;
    if (linkedIn) {
      searchQuery += ` ${linkedIn}`;
    }
    if (organizationName) {
      searchQuery += ` at ${organizationName}`;
    }

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that searches for professional information about people. Return the information in a structured JSON format with the following fields: title (current job title), background (professional summary), linkedIn (LinkedIn profile URL if found), image (profile image URL if found), skills [{name: string, level: string}], workHistory [{company: string, title: string, startDate: string, endDate: string, description: string}], education [{institution: string, degree: string, startDate: string, endDate: string}], projects [{name: string, description: string, startDate: string, endDate: string}], publications [{title: string, authors: string, venue: string, year: string}], patents [{title: string, inventors: string, status: string, year: string}], awards [{title: string, organization: string, year: string}], certifications [{name: string, organization: string, year: string}] Only include fields where you have high confidence in the information.'
          },
          {
            role: 'user',
            content: `Find professional information about ${searchQuery}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from Perplexity API');
    }

    const data = await response.json();
    let enrichedData;
    
    try {
      // Parse the response content as JSON
      enrichedData = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing response:', error);
      // If parsing fails, return the raw text
      enrichedData = {
        background: data.choices[0].message.content
      };
    }

    // Update the team member with the enriched data
    const updateResponse = await fetch(`/api/organizations/team/${memberId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedData)
    });

    if (!updateResponse.ok) {
      throw new Error('Failed to update team member with enriched data');
    }

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Error enriching team member:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 