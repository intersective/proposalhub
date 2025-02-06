import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT_MODELS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4-0125-preview",
  "gpt-4-1106-preview"
];

interface ExtractionResult {
  extractedInfo: {
    name: string | null;
    company: string | null;
    email: string | null;
    linkedIn: string | null;
  };
  modelUsed: string;
}

interface BackgroundResult {
  companyBackground: string;
  clientBackground: string;
  modelUsed: string;
}

interface ProposalSectionsResult {
  sections: Record<string, string>;
  modelUsed: string;
}

interface ClientInfoWithBackground {
  name: string | null;
  company: string | null;
  email: string | null;
  linkedIn: string | null;
  companyBackground?: string;
  clientBackground?: string;
}

async function tryExtraction(message: string, modelIndex: number = 0): Promise<ExtractionResult> {
  if (modelIndex >= GPT_MODELS.length) {
    throw new Error('All models failed to extract information');
  }

  try {
    const extractionResponse = await openai.chat.completions.create({
      model: GPT_MODELS[modelIndex],
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts client names, company names, and contact information from text. Return the information in JSON format with 'name', 'company', 'email', and 'linkedIn' fields. If you're not sure about any field, leave it as null."
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = extractionResponse.choices[0].message.content;
    if (!content) {
      return tryExtraction(message, modelIndex + 1);
    }

    const extractedInfo = JSON.parse(content);
    if (!extractedInfo.name && !extractedInfo.company) {
      return tryExtraction(message, modelIndex + 1);
    }

    return {
      extractedInfo,
      modelUsed: GPT_MODELS[modelIndex]
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return tryExtraction(message, modelIndex + 1);
  }
}

async function getBackgrounds(company: string | null, name: string | null, modelIndex: number = 0): Promise<BackgroundResult> {
  if (modelIndex >= GPT_MODELS.length) {
    throw new Error('All models failed to get backgrounds');
  }

  try {
    const backgroundResponse = await openai.chat.completions.create({
      model: GPT_MODELS[modelIndex],
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides brief backgrounds for companies and professionals. Return the information in JSON format with 'companyBackground' and 'clientBackground' fields. Keep each background under 200 words."
        },
        {
          role: "user",
          content: `Please provide background information for:\nCompany: ${company || 'Unknown'}\nProfessional: ${name || 'Unknown'}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = backgroundResponse.choices[0].message.content;
    if (!content) {
      return getBackgrounds(company, name, modelIndex + 1);
    }

    const backgrounds = JSON.parse(content);
    if (!backgrounds.companyBackground && !backgrounds.clientBackground) {
      return getBackgrounds(company, name, modelIndex + 1);
    }

    return {
      ...backgrounds,
      modelUsed: GPT_MODELS[modelIndex]
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return getBackgrounds(company, name, modelIndex + 1);
  }
}

async function generateInitialProposal(message: string, clientInfo: ClientInfoWithBackground, modelIndex: number = 0): Promise<ProposalSectionsResult> {
  if (modelIndex >= GPT_MODELS.length) {
    throw new Error('All models failed to generate proposal sections');
  }

  try {
    const proposalResponse = await openai.chat.completions.create({
      model: GPT_MODELS[modelIndex],
      messages: [
        {
          role: "system",
          content: `You are a proposal writing expert. Based on the client information and problem statement provided, generate initial content for key proposal sections. Return a JSON object with the following keys: 'executiveSummary', 'projectBackground', 'projectScope', 'proposedApproach', 'projectTimeline', 'deliverables', 'pricing', 'team', 'conclusion'. Keep each section concise but informative.

Client Info:
${JSON.stringify(clientInfo, null, 2)}`
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = proposalResponse.choices[0].message.content;
    if (!content) {
      return generateInitialProposal(message, clientInfo, modelIndex + 1);
    }

    const sections = JSON.parse(content);
    return {
      sections,
      modelUsed: GPT_MODELS[modelIndex]
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return generateInitialProposal(message, clientInfo, modelIndex + 1);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, section, type } = await req.json();

    if (type === 'company') {
      // Use AI to find company information
      const companyResponse = await openai.chat.completions.create({
        model: GPT_MODELS[0],
        messages: [
          {
            role: "system",
            content: "You are a business research expert. Extract and summarize key information about companies. Return the information in JSON format with the following fields: name, website, sector, size, background. Keep the background concise but informative."
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = companyResponse.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from AI');
      }

      const companyInfo = JSON.parse(content);
      return NextResponse.json({ companyInfo });
    }

    if (section) {
      // Handle section-specific improvements
      const { content, modelUsed } = await generateSectionContent(message, section);
      return NextResponse.json({
        content,
        models: {
          extraction: modelUsed
        }
      });
    }

    // First, use progressive model approach to extract info
    const { extractedInfo, modelUsed: extractionModel } = await tryExtraction(message);

    // Get backgrounds for both company and client
    const { companyBackground, clientBackground, modelUsed: backgroundModel } = 
      await getBackgrounds(extractedInfo.company, extractedInfo.name);

    // Generate initial proposal sections
    const { sections: proposalSections, modelUsed: proposalModel } = 
      await generateInitialProposal(message, {
        ...extractedInfo,
        companyBackground,
        clientBackground
      });

    return NextResponse.json({
      clientInfo: {
        name: extractedInfo.name,
        company: extractedInfo.company,
        email: extractedInfo.email,
        linkedIn: extractedInfo.linkedIn,
        background: clientBackground,
        companyBackground
      },
      proposalSections,
      models: {
        extraction: extractionModel,
        background: backgroundModel,
        proposal: proposalModel
      }
    });

  } catch (error) {
    console.error('Error processing info:', error);
    return NextResponse.json({ 
      error: 'Failed to process information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateSectionContent(message: string, section: string, modelIndex: number = 0): Promise<{ content: string, modelUsed: string }> {
  if (modelIndex >= GPT_MODELS.length) {
    throw new Error('All models failed to generate section content');
  }

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODELS[modelIndex],
      messages: [
        {
          role: "system",
          content: `You are a proposal writing expert. The user wants to improve the ${section} section of their proposal. 
Provide an improved version based on their input.
IMPORTANT: 
- Do not include any meta-commentary about the changes
- Do not include section titles or headers
- Do not include any explanatory text at the end
- Focus purely on the content itself
- Return just the raw content that should appear in the section`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content || content.length < 50) {
      return generateSectionContent(message, section, modelIndex + 1);
    }

    // Clean up the content
    const cleanContent = content
      // Remove any markdown headers
      .replace(/^#+ .*$/gm, '')
      // Remove any "revised" prefix
      .replace(/^(?:revised|updated|improved|new)\s+/i, '')
      // Remove any meta commentary at the end
      .replace(/\n---+\n[\s\S]*$/, '')
      // Trim whitespace
      .trim();

    return {
      content: cleanContent,
      modelUsed: GPT_MODELS[modelIndex]
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return generateSectionContent(message, section, modelIndex + 1);
  }
} 