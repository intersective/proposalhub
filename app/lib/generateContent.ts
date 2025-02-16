import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available GPT models in order of preference
const GPT_MODELS = [
  "gpt-4o-mini",
  "o3-mini",
  "gpt-4o",
  "o1"
];

interface ContentResult {
  content: string;
  modelUsed: string;
}

interface OrganizationInfo {
  name: string | null;
  website: string | null;
  sector: string | null;
  size: string | null;
  background: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface ContactInfo {
  name: string | null;
  email: string | null;
  linkedIn: string | null;
  phone: string | null;
  role: string | null;
  background: string | null;
}

interface Section {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'contact' | 'organization';
  images?: {
    background?: string[];
    content?: string[];
  };
}

interface ImprovementResult {
  content: string;
  modelUsed: string;
  context?: string[];
}

/**
 * Generates improved content for a section using OpenAI's GPT models
 */
export async function generateSectionContent(message: string, section: string, modelIndex: number = 0): Promise<ContentResult> {
  if (modelIndex >= GPT_MODELS.length) {
    throw new Error('All models failed to generate section content');
  }

  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODELS[modelIndex],
      messages: [
        {
          role: "system",
          content: `You are a proposal writing expert. The user wants to generate content for the ${section} section of their proposal.
IMPORTANT: 
- Format your response in Markdown
- Use appropriate markdown syntax for headings (##, ###), lists (-, *), emphasis (**bold**, *italic*), etc.
- Do not include any meta-commentary about the changes
- Do not include section titles or headers
- Do not include any explanatory text at the end
- Focus purely on the content itself
- Be specific and avoid generic or placeholder content
- Base your content only on the provided context and information`
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

    return {
      content: cleanContent,
      modelUsed: GPT_MODELS[modelIndex]
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return generateSectionContent(message, section, modelIndex + 1);
  }
}

/**
 * Generates an improvement for a proposal section, taking into account the current content and context
 */
export async function generateImprovement(
  section: Section,
  contextSections?: Section[],
  modelIndex: number = 0
): Promise<ImprovementResult> {
  if (modelIndex >= GPT_MODELS.length) {
    throw new Error('All models failed to generate improvement');
  }

  try {
    // Create context from other sections
    const context = contextSections
      ?.filter(s => s.id !== section.id && s.content && typeof s.content === 'string' && s.content.trim() !== '')
      ?.map(s => `${s.title}:\n${s.content}`)
      ?.join('\n\n');

    // Prepare message based on whether there's existing content
    const message = section.content 
      ? `Please improve the following ${section.title.toLowerCase()} section.\n\n` +
        `Current content:\n${section.content}\n\n` +
        (context ? `Context from other sections:\n${context}` : '')
      : `Please generate content for the ${section.title.toLowerCase()} section based on the following context and requirements:\n\n` +
        `Requirements:\n` +
        `- The content should be specific and detailed\n` +
        `- Avoid generic or placeholder content\n` +
        `- Focus on creating value-driven, persuasive content\n` +
        `- Ensure the content aligns with the overall proposal narrative\n\n` +
        (context ? `Context from other sections:\n${context}` : '');

    const response = await openai.chat.completions.create({
      model: GPT_MODELS[modelIndex],
      messages: [
        {
          role: "system",
          content: `You are a proposal writing expert. ${section.content ? 'Improve the provided content while maintaining its core message and adding value.' : 'Generate specific, valuable content based on the provided context and requirements.'}\n\n` +
          `IMPORTANT:\n` +
          `- Format your response in Markdown\n` +
          `- Use appropriate markdown syntax for headings (##, ###), lists (-, *), emphasis (**bold**, *italic*), etc.\n` +
          `- Do not include any meta-commentary about the changes\n` +
          `- Do not include section titles or headers\n` +
          `- Do not include any explanatory text\n` +
          `- Focus purely on the content itself\n` +
          `- Be specific and avoid generic content\n` +
          `- Base your content only on the provided context and information`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const content = response.choices[0].message.content;
    if (!content || content.length < 50) {
      return generateImprovement(section, contextSections, modelIndex + 1);
    }

    // Clean up the content
    const cleanContent = content
      // Remove any markdown headers that include the section name
      .replace(new RegExp(`^#+ .*${section.title}.*$`, 'gmi'), '')
      // Remove any "revised" prefix
      .replace(/^(?:revised|updated|improved|new)\s+/i, '')
      // Remove any meta commentary at the end
      .replace(/\n---+\n[\s\S]*$/, '')
      // Remove wrapping markdown code blocks if they exist
      .replace(/^```(?:markdown)?\n([\s\S]*)\n```$/m, '$1')
      // Trim whitespace
      .trim();

    return {
      content: cleanContent,
      modelUsed: GPT_MODELS[modelIndex],
      context: context ? [context] : undefined
    };
  } catch (error) {
    console.error(`Error with model ${GPT_MODELS[modelIndex]}:`, error);
    return generateImprovement(section, contextSections, modelIndex + 1);
  }
}

/**
 * Extracts organization information from text using OpenAI
 */
export async function extractOrganizationInfo(message: string): Promise<OrganizationInfo> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a business research expert. Extract and summarize key information about organizations. Return the information in JSON format with the following fields: name, website, sector, size, background, primaryColor, secondaryColor. Keep the background concise but informative. For colors, analyze the organization's brand and return appropriate hex color codes that match their brand identity. If unsure about colors, return null for both color fields."
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error extracting organization info:', error);
    throw error;
  }
}

/**
 * Extracts contact information from text using OpenAI
 */
export async function extractContactInfo(message: string): Promise<ContactInfo> {
  try {
    const response = await openai.chat.completions.create({
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

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Error extracting contact info:', error);
    throw error;
  }
}

/**
 * Generates draft content for a section using OpenAI
 */
export async function generateDraftContent(message: string, section: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
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

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from AI');
    }

    return content.trim();
  } catch (error) {
    console.error('Error generating draft content:', error);
    throw error;
  }
}

/**
 * Processes a chat message using OpenAI
 */
export async function processChatMessage(message: string): Promise<string> {
  try {
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

    return content;
  } catch (error) {
    console.error('Error processing chat message:', error);
    throw error;
  }
} 