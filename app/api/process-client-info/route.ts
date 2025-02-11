import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// do not change rhese
const GPT_MODELS = [
  "gpt-4o-mini",
  "o3-mini",
  "gpt-4o",
  "o1"
];

// interface ExtractionResult {
//   extractedInfo: {
//     name: string | null;
//     company: string | null;
//     email: string | null;
//     linkedIn: string | null;
//   };
//   modelUsed: string;
// }

// interface BackgroundResult {
//   companyBackground: string;
//   clientBackground: string;
//   modelUsed: string;
// }

// interface ProposalSectionsResult {
//   sections: Record<string, string>;
//   modelUsed: string;
// }

// interface ClientInfoWithBackground {
//   name: string | null;
//   company: string | null;
//   email: string | null;
//   linkedIn: string | null;
//   companyBackground?: string;
//   clientBackground?: string;
// }

// interface ImprovementSuggestion {
//   sectionId: string;
//   content: string;
//   context: string[];
//   timestamp: Date;
// }

// async function tryExtraction(message: string, modelIndex: number = 0): Promise<ExtractionResult> {
//   if (modelIndex >= GPT_MODELS.length) {
//     throw new Error('All models failed to extract information');
//   }

//   try {
//     const extractionResponse = await openai.chat.completions.create({
//       model: GPT_MODELS[modelIndex],
//       messages: [
//         {
//           role: "system",
//           content: "You are a helpful assistant that extracts client names, company names, and contact information from text. Return the information in JSON format with 'name', 'company', 'email', and 'linkedIn' fields. If you're not sure about any field, leave it as null."
//         },
//         {
//           role: "user",
//           content: message
//         }
//       ],
//       response_format: { type: "json_object" }
//     });

//     const content = extractionResponse.choices[0].message.content;
//     if (!content) {
//       return tryExtraction(message, modelIndex + 1);
//     }

//     const extractedInfo = JSON.parse(content);
//     if (!extractedInfo.name && !extractedInfo.company) {
//       return tryExtraction(message, modelIndex + 1);
//     }

//     return {
//       extractedInfo,
//       modelUsed: GPT_MODELS[modelIndex]
//     };
//   } catch (error) {
//     console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
//     return tryExtraction(message, modelIndex + 1);
//   }
// }

// async function getBackgrounds(company: string | null, name: string | null, modelIndex: number = 0): Promise<BackgroundResult> {
//   if (modelIndex >= GPT_MODELS.length) {
//     throw new Error('All models failed to get backgrounds');
//   }

//   try {
//     const backgroundResponse = await openai.chat.completions.create({
//       model: GPT_MODELS[modelIndex],
//       messages: [
//         {
//           role: "system",
//           content: "You are a helpful assistant that provides brief backgrounds for companies and professionals. Return the information in JSON format with 'companyBackground' and 'clientBackground' fields. Keep each background under 200 words."
//         },
//         {
//           role: "user",
//           content: `Please provide background information for:\nCompany: ${company || 'Unknown'}\nProfessional: ${name || 'Unknown'}`
//         }
//       ],
//       response_format: { type: "json_object" }
//     });

//     const content = backgroundResponse.choices[0].message.content;
//     if (!content) {
//       return getBackgrounds(company, name, modelIndex + 1);
//     }

//     const backgrounds = JSON.parse(content);
//     if (!backgrounds.companyBackground && !backgrounds.clientBackground) {
//       return getBackgrounds(company, name, modelIndex + 1);
//     }

//     return {
//       ...backgrounds,
//       modelUsed: GPT_MODELS[modelIndex]
//     };
//   } catch (error) {
//     console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
//     return getBackgrounds(company, name, modelIndex + 1);
//   }
// }

// async function generateInitialProposal(message: string, clientInfo: ClientInfoWithBackground, modelIndex: number = 0): Promise<ProposalSectionsResult> {
//   if (modelIndex >= GPT_MODELS.length) {
//     throw new Error('All models failed to generate proposal sections');
//   }

//   try {
//     const proposalResponse = await openai.chat.completions.create({
//       model: GPT_MODELS[modelIndex],
//       messages: [
//         {
//           role: "system",
//           content: `You are a proposal writing expert. Based on the client information and problem statement provided, generate initial content for key proposal sections. Return a JSON object with the following keys: 'executiveSummary', 'projectBackground', 'projectScope', 'proposedApproach', 'projectTimeline', 'deliverables', 'pricing', 'team', 'conclusion'. Keep each section concise but informative.

// Client Info:
// ${JSON.stringify(clientInfo, null, 2)}`
//         },
//         {
//           role: "user",
//           content: message
//         }
//       ],
//       response_format: { type: "json_object" }
//     });

//     const content = proposalResponse.choices[0].message.content;
//     if (!content) {
//       return generateInitialProposal(message, clientInfo, modelIndex + 1);
//     }

//     const sections = JSON.parse(content);
//     return {
//       sections,
//       modelUsed: GPT_MODELS[modelIndex]
//     };
//   } catch (error) {
//     console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
//     return generateInitialProposal(message, clientInfo, modelIndex + 1);
//   }
// }

// async function generateDraftContent(message: string, section: string, modelIndex: number = 0): Promise<{ content: string, modelUsed: string }> {
//   if (modelIndex >= GPT_MODELS.length) {
//     throw new Error('All models failed to generate draft content');
//   }

//   try {
//     const response = await openai.chat.completions.create({
//       model: GPT_MODELS[modelIndex],
//       messages: [
//         {
//           role: "system",
//           content: `You are a professional proposal writer. You will draft content for the ${section} section of a proposal.
//           - Write in a professional, clear, and engaging style
//           - Do not include the section title in the content
//           - Format the content in Markdown
//           - Do not include any meta-commentary or notes about the content
//           - Focus on being concise but comprehensive`
//         },
//         {
//           role: "user",
//           content: message
//         }
//       ]
//     });

//     const content = response.choices[0].message.content;
//     if (!content) {
//       throw new Error('No content returned from AI');
//     }

//     // Clean up the content
//     let cleanContent = content
//       // Remove wrapping markdown code blocks if they exist
//       .replace(/^```(?:markdown)?\n([\s\S]*)\n```$/m, '$1')
//       // Trim whitespace
//       .trim();

//     // Wrap in markdown code blocks if not already wrapped
//     // if (!cleanContent.startsWith('```markdown')) {
//     //   cleanContent = '```markdown\n' + cleanContent + '\n```';
//     // }

//     return {
//       content: cleanContent,
//       modelUsed: GPT_MODELS[modelIndex]
//     };
//   } catch (error) {
//     console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
//     return generateDraftContent(message, section, modelIndex + 1);
//   }
// }

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
- Format your response in Markdown
- Use appropriate markdown syntax for headings (##, ###), lists (-, *), emphasis (**bold**, *italic*), etc.
- Do not include any meta-commentary about the changes
- Do not include section titles or headers
- Do not include any explanatory text at the end
- Focus purely on the content itself`
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
      // Remove any markdown headers that include the section name
      .replace(new RegExp(`^#+ .*${section}.*$`, 'gmi'), '')
      // Remove any "revised" prefix
      .replace(/^(?:revised|updated|improved|new)\s+/i, '')
      // Remove any meta commentary at the end
      .replace(/\n---+\n[\s\S]*$/, '')
      // Remove wrapping markdown code blocks if they exist
      .replace(/^```(?:markdown)?\n([\s\S]*)\n```$/m, '$1')
      // Trim whitespace
      .trim();

    // Wrap in markdown code blocks if not already wrapped
    // if (!cleanContent.startsWith('```markdown')) {
    //   cleanContent = '```markdown\n' + cleanContent + '\n```';
    // }

    return {
      content: cleanContent,
      modelUsed: GPT_MODELS[modelIndex]
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return generateSectionContent(message, section, modelIndex + 1);
  }
}

export async function POST(req: Request) {
  try {
    const { message, type, section, proposalId, context } = await req.json();
    console.log(message, type, section, proposalId, context);
    if (type === 'company') {
      // Use AI to find company information
      const companyResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a business research expert. Extract and summarize key information about companies. Return the information in JSON format with the following fields: name, website, sector, size, background, primaryColor, secondaryColor. Keep the background concise but informative. For colors, analyze the company's brand and return appropriate hex color codes that match their brand identity. If unsure about colors, return null for both color fields."
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

    if (type === 'client') {
      // Use AI to find client information
      const clientResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional networking expert. Extract and summarize key information about professionals. Return the information in JSON format with the following fields: name, email, linkedIn, phone, role, background. Keep the background concise but informative."
          },
          {
            role: "user",
            content: message
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = clientResponse.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from AI');
      }

      const clientInfo = JSON.parse(content);
      return NextResponse.json({ clientInfo });
    }

    if (type === 'draft') {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional proposal writer. You will draft content for the ${section} section of a proposal.
            - Write in a professional, clear, and engaging style
            - Do not include the section title in the content
            - Format the content in Markdown
            - Do not include any meta-commentary or notes about the content
            - Focus on being concise but comprehensive`
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content returned from AI');
      }

      return NextResponse.json({ content });
    }

    if (type === 'improve' && section) {
      const result = await generateSectionContent(message, section);
      
      // Return the improved content directly
      return NextResponse.json({ content: result.content });
    }

    // Add support for regular chat messages
    if (!type || type === 'chat') {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful proposal writing assistant. Help users draft and improve their proposals by providing suggestions and guidance."
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from AI');
      }

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