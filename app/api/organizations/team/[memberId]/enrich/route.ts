import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminDb } from '@/app/lib/firebaseAdmin';
import puppeteer from 'puppeteer';

interface LinkedInProfileData {
  headline?: string;
  summary?: string;
  positions?: {
    title: string;
    company: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }[];
  skills?: string[];
  certifications?: {
    name: string;
    authority?: string;
    url?: string;
  }[];
  education?: {
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }[];
}

async function scrapeLinkedInProfile(linkedInUrl: string, userId: string): Promise<LinkedInProfileData> {
  // Get the user's LinkedIn session
  const sessionDoc = await adminDb.collection('linkedinSessions').doc(userId).get();
  if (!sessionDoc.exists) {
    throw new Error('LinkedIn session not found. Please authenticate first.');
  }

  const sessionData = sessionDoc.data();
  if (!sessionData?.expiresAt) {
    throw new Error('Invalid session data');
  }
  
  if (new Date() > new Date(sessionData.expiresAt.toDate())) {
    throw new Error('LinkedIn session expired. Please authenticate again.');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set the stored cookies
    await page.setCookie(...sessionData.cookies);
    
    // Navigate to the profile
    await page.goto(linkedInUrl);
    await page.waitForSelector('.pv-top-card');

    // Extract the data
    const profileData = await page.evaluate(() => {
      const getTextContent = (selector: string) => {
        const element = document.querySelector(selector);
        return element ? element.textContent?.trim() : undefined;
      };

      // Get positions
      const positions = Array.from(document.querySelectorAll('.experience-section .pv-position-entity')).map(position => {
        const titleElement = position.querySelector('.pv-entity__summary-info h3');
        const companyElement = position.querySelector('.pv-entity__secondary-title');
        const dateRangeElement = position.querySelector('.pv-entity__date-range span:nth-child(2)');
        const descriptionElement = position.querySelector('.pv-entity__description');

        return {
          title: titleElement?.textContent?.trim() || '',
          company: companyElement?.textContent?.trim() || '',
          description: descriptionElement?.textContent?.trim(),
          dateRange: dateRangeElement?.textContent?.trim() || ''
        };
      });

      // Get education
      const education = Array.from(document.querySelectorAll('.education-section .pv-education-entity')).map(edu => {
        const schoolElement = edu.querySelector('.pv-entity__school-name');
        const degreeElement = edu.querySelector('.pv-entity__degree-name .pv-entity__comma-item');
        const fieldElement = edu.querySelector('.pv-entity__fos .pv-entity__comma-item');
        const dateRangeElement = edu.querySelector('.pv-entity__dates span:nth-child(2)');

        return {
          school: schoolElement?.textContent?.trim() || '',
          degree: degreeElement?.textContent?.trim(),
          field: fieldElement?.textContent?.trim(),
          dateRange: dateRangeElement?.textContent?.trim() || ''
        };
      });

      // Get skills
      const skills = Array.from(document.querySelectorAll('.pv-skill-category-entity__name-text')).map(skill => 
        skill.textContent?.trim() || ''
      );

      // Get certifications
      const certifications = Array.from(document.querySelectorAll('.certifications-section .pv-certification-entity')).map(cert => {
        const nameElement = cert.querySelector('.pv-certification-name');
        const authorityElement = cert.querySelector('.pv-certification-info__authority');

        return {
          name: nameElement?.textContent?.trim() || '',
          authority: authorityElement?.textContent?.trim()
        };
      });

      return {
        headline: getTextContent('.pv-top-card-section__headline'),
        summary: getTextContent('.pv-about-section .pv-about__summary-text'),
        positions,
        education,
        skills,
        certifications
      };
    });

    // Transform the scraped data to match our interface
    return {
      headline: profileData.headline,
      summary: profileData.summary,
      positions: profileData.positions.map(p => ({
        title: p.title,
        company: p.company,
        description: p.description,
        // Parse date range string to extract start and end dates
        startDate: p.dateRange.split(' – ')[0],
        endDate: p.dateRange.split(' – ')[1]
      })),
      education: profileData.education.map(e => ({
        school: e.school,
        degree: e.degree,
        field: e.field,
        startDate: e.dateRange.split(' – ')[0],
        endDate: e.dateRange.split(' – ')[1]
      })),
      skills: profileData.skills,
      certifications: profileData.certifications.map(c => ({
        name: c.name,
        authority: c.authority
      }))
    };
  } finally {
    await browser.close();
  }
}

async function enrichWithAI(profileData: LinkedInProfileData): Promise<LinkedInProfileData> {
  try {
    // Use AI to enhance and clean up the scraped data
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'You are a professional data curator. Clean and enhance professional profile information.'
        }, {
          role: 'user',
          content: `Clean and enhance this professional profile data, maintaining the same structure but improving descriptions and standardizing formats:
          ${JSON.stringify(profileData, null, 2)}`
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }
    throw new Error('Failed to enhance with AI');
  } catch (error) {
    console.error('Error enhancing with AI:', error);
    return profileData; // Return original data if AI enhancement fails
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.profile?.organizationId) {
      console.log('No organization ID found',  session);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = session.user.profile.organizationId;
    const memberDoc = await adminDb.collection('contacts').doc(memberId).get();
    
    if (!memberDoc.exists || memberDoc.data()?.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const member = memberDoc.data() as { linkedIn?: string };
    if (!member.linkedIn) {
      return NextResponse.json(
        { error: 'LinkedIn URL not provided' },
        { status: 400 }
      );
    }

    try {
      // 1. Scrape LinkedIn profile using authenticated session
      const scrapedData = await scrapeLinkedInProfile(member.linkedIn, session.user.id);
      
      // 2. Enhance data with AI
      const enrichedData = await enrichWithAI(scrapedData);

      // 3. Update the team member document
      await adminDb.collection('contacts').doc(memberId).update({
        background: enrichedData.summary,
        title: enrichedData.headline,
        skills: enrichedData.skills,
        credentials: {
          degrees: enrichedData.education?.map(e => 
            `${e.degree || ''} ${e.field ? `in ${e.field}` : ''} from ${e.school}`
          ).filter(Boolean),
          pastRoles: enrichedData.positions?.map(p =>
            `${p.title} at ${p.company}`
          ),
          certifications: enrichedData.certifications?.map(c => c.name)
        },
        lastEnriched: new Date(),
        enrichmentSource: 'scraping+ai'
      });

      return NextResponse.json(enrichedData);
    } catch (error: Error | unknown) {
      if (error instanceof Error && error.message.includes('session')) {
        return NextResponse.json(
          { error: error.message, needsAuth: true },
          { status: 401 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error enriching team member:', error);
    return NextResponse.json(
      { error: 'Failed to enrich team member data' },
      { status: 500 }
    );
  }
} 