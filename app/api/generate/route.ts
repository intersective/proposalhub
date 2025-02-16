import { NextResponse } from 'next/server';
import { 
  generateSectionContent, 
  extractOrganizationInfo, 
  extractContactInfo, 
  generateDraftContent, 
  processChatMessage 
} from '@/app/lib/generateContent';

export async function POST(req: Request) {
  try {
    const { message, type, section, proposalId, context } = await req.json();
    console.log(message, type, section, proposalId, context);

    if (type === 'organization') {
      const organizationInfo = await extractOrganizationInfo(message);
      return NextResponse.json({ organizationInfo });
    }

    if (type === 'contact') {
      const contactInfo = await extractContactInfo(message);
      return NextResponse.json({ contactInfo });
    }

    if (type === 'draft') {
      const content = await generateDraftContent(message, section);
      return NextResponse.json({ content });
    }

    if (type === 'improve' && section) {
      const result = await generateSectionContent(message, section);
      return NextResponse.json({ content: result.content });
    }

    // Add support for regular chat messages
    if (!type || type === 'chat') {
      const content = await processChatMessage(message);
      return NextResponse.json({ content });
    }

    return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });
  } catch (error) {
    console.error('Error processing info:', error);
    return NextResponse.json({ 
      error: 'Failed to process information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 