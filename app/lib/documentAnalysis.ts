import OpenAI from 'openai';
import { marked } from 'marked';

if (!process.env.OPENAI_API_KEY) {
  console.error('Warning: OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  // Add a default timeout
  timeout: 30000,
});

const MODELS = {
  default: "gpt-4o-mini",
  fallback: "o3-mini"
};

const MAX_CHUNK_SIZE = 4000; // Maximum characters per chunk
const TIMEOUT = 30000; // 30 seconds timeout

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
  images?: {
    background?: string[];
    content?: string[];
  };
}

interface AnalyzedSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  sourceSection?: string;
  mergeType?: 'direct' | 'partial' | 'enhancement';
}

interface ProgressCallback {
  (progress: {
    stage: 'chunking' | 'processing' | 'merging' | 'matching' | 'analyzing';
    current: number;
    total: number;
    message: string;
  }): void;
}

export interface DocumentAnalysisResult {
  sections: AnalyzedSection[];
  unmatched: {
    content: string;
    potentialSections: Array<{
      sectionId: string;
      relevance: number;
    }>;
  }[];
  progress?: {
    stage: 'chunking' | 'processing' | 'merging' | 'matching' | 'analyzing';
    current: number;
    total: number;
    message: string;
  };
}

export async function analyzeDocument(
  documentContent: string,
  existingSections: Section[],
  documentType: 'pdf' | 'markdown' = 'markdown',
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<DocumentAnalysisResult> {
  console.log('Starting document analysis...');
  
  if (signal?.aborted) {
    throw new Error('Analysis cancelled');
  }

  const standardizedContent = documentType === 'markdown' 
    ? documentContent 
    : await convertPDFToText(documentContent);

  // Split content into manageable chunks
  const chunks = splitIntoChunks(standardizedContent);
  console.log(`Split document into ${chunks.length} chunks`);
  onProgress?.({
    stage: 'chunking',
    current: 0,
    total: chunks.length,
    message: `Splitting document into ${chunks.length} chunks`
  });

  // Process each chunk
  const allSections: Array<{ title: string; content: string }> = [];
  for (const [index, chunk] of chunks.entries()) {
    if (signal?.aborted) {
      throw new Error('Analysis cancelled');
    }

    console.log(`Processing chunk ${index + 1}/${chunks.length}`);
    const chunkSections = await identifySections(chunk);
    allSections.push(...chunkSections);
    
    const progress = {
      stage: 'processing' as const,
      current: index + 1,
      total: chunks.length,
      message: `Processing document chunk ${index + 1} of ${chunks.length}`
    };
    console.log('Progress:', progress);
    onProgress?.(progress);
  }

  // Merge similar sections with timeout
  console.log(`Starting section merge...`);
  onProgress?.({
    stage: 'merging',
    current: 0,
    total: 1,
    message: 'Merging similar sections'
  });

  if (signal?.aborted) {
    throw new Error('Analysis cancelled');
  }

  const mergedSections = await mergeSimilarSections(allSections);
  console.log(`Identified ${mergedSections.length} unique sections`);
  onProgress?.({
    stage: 'merging',
    current: 1,
    total: 1,
    message: `Identified ${mergedSections.length} unique sections`
  });

  // Match sections with existing proposal sections
  console.log(`Starting section matching...`);
  onProgress?.({
    stage: 'matching',
    current: 0,
    total: mergedSections.length,
    message: 'Starting section matching'
  });

  if (signal?.aborted) {
    throw new Error('Analysis cancelled');
  }

  // Process section matches in smaller batches
  const matchedSections: AnalyzedSection[] = [];
  const BATCH_SIZE = 3; // Process 3 sections at a time
  
  for (let i = 0; i < mergedSections.length; i += BATCH_SIZE) {
    if (signal?.aborted) {
      throw new Error('Analysis cancelled');
    }

    const batch = mergedSections.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(section => 
      findSectionMatches(section, existingSections)
        .then(async matches => {
          for (const match of matches) {
            if (match.confidence > 0.7) {
              const existingSection = existingSections.find(s => s.id === match.sectionId);
              if (!existingSection || typeof existingSection.content !== 'string') continue;

              const mergedContent = await mergeSectionContent(
                section.content,
                existingSection.content
              );

              matchedSections.push({
                id: existingSection.id,
                title: existingSection.title,
                content: mergedContent,
                confidence: match.confidence,
                sourceSection: section.title,
                mergeType: existingSection.content.trim() === '' ? 'direct' : 'partial'
              });
            }
          }
        })
    );

    await Promise.all(batchPromises);
    
    onProgress?.({
      stage: 'matching',
      current: Math.min(i + BATCH_SIZE, mergedSections.length),
      total: mergedSections.length,
      message: `Matched ${matchedSections.length} sections so far`
    });
  }

  console.log(`Matched ${matchedSections.length} sections`);

  // Analyze unmatched content
  const unmatchedSections = mergedSections.filter(section => 
    !matchedSections.some(match => match.sourceSection === section.title)
  );
  console.log(`Found ${unmatchedSections.length} unmatched sections`);
  
  if (signal?.aborted) {
    throw new Error('Analysis cancelled');
  }

  onProgress?.({
    stage: 'analyzing',
    current: 0,
    total: unmatchedSections.length,
    message: 'Analyzing unmatched sections'
  });

  const unmatchedAnalysis = await analyzeUnmatchedContent(unmatchedSections, existingSections);

  return {
    sections: matchedSections,
    unmatched: unmatchedAnalysis,
    progress: {
      stage: 'analyzing',
      current: chunks.length,
      total: chunks.length,
      message: 'Analysis complete'
    }
  };
}

function splitIntoChunks(content: string): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs or sections
  const paragraphs = content.split(/\n\n+/);
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > MAX_CHUNK_SIZE) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      // If a single paragraph is too long, split it
      if (paragraph.length > MAX_CHUNK_SIZE) {
        const subChunks = paragraph.match(new RegExp(`.{1,${MAX_CHUNK_SIZE}}`, 'g')) || [];
        chunks.push(...subChunks);
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

async function mergeSimilarSections(sections: Array<{ title: string; content: string }>): Promise<Array<{ title: string; content: string }>> {
  const mergedSections: { [key: string]: string } = {};
  
  for (const section of sections) {
    const normalizedTitle = section.title.toLowerCase().trim();
    if (mergedSections[normalizedTitle]) {
      mergedSections[normalizedTitle] += '\n\n' + section.content;
    } else {
      mergedSections[normalizedTitle] = section.content;
    }
  }
  
  return Object.entries(mergedSections).map(([title, content]) => ({
    title: title.charAt(0).toUpperCase() + title.slice(1),
    content
  }));
}

async function identifySections(content: string): Promise<Array<{ title: string; content: string }>> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please check your environment variables.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await openai.chat.completions.create({
      model: MODELS.default,
      messages: [
        {
          role: "system",
          content: `Identify distinct sections in the provided document content.
            Return a JSON object with a 'sections' array containing objects with 'title' and 'content' properties.
            Normalize section titles to match common proposal sections.
            Group related content under appropriate sections.`
        },
        {
          role: "user",
          content
        }
      ],
      response_format: { type: "json_object" }
    });

    clearTimeout(timeoutId);

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.sections || [];
  } catch (error) {
    console.error('Error identifying sections:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw error; // Re-throw API key related errors
    }
    // Try fallback model
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.fallback,
        messages: [
          {
            role: "system",
            content: `Identify distinct sections in the provided document content.
              Return a JSON object with a 'sections' array containing objects with 'title' and 'content' properties.`
          },
          {
            role: "user",
            content
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.sections || [];
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError);
      if (fallbackError instanceof Error && fallbackError.message.includes('API key')) {
        throw fallbackError; // Re-throw API key related errors
      }
      return [];
    }
  }
}

async function convertPDFToText(pdfContent: string): Promise<string> {
  // For now, assume the content is already text
  // TODO: Implement PDF text extraction
  return pdfContent;
}

async function findSectionMatches(
  uploadedSection: { title: string; content: string },
  existingSections: Section[]
): Promise<Array<{ sectionId: string; confidence: number }>> {
  try {
    // First try simple title matching to avoid unnecessary API calls
    const titleMatches = existingSections
      .map(section => {
        const normalizedUploadedTitle = uploadedSection.title.toLowerCase().trim();
        const normalizedSectionTitle = section.title.toLowerCase().trim();
        
        // Direct match
        if (normalizedUploadedTitle === normalizedSectionTitle) {
          return { sectionId: section.id, confidence: 1.0 };
        }
        
        // Contains match
        if (normalizedUploadedTitle.includes(normalizedSectionTitle) || 
            normalizedSectionTitle.includes(normalizedUploadedTitle)) {
          return { sectionId: section.id, confidence: 0.8 };
        }
        
        return null;
      })
      .filter((match): match is { sectionId: string; confidence: number } => match !== null);

    if (titleMatches.length > 0) {
      return titleMatches;
    }

    // If no direct matches, use AI for semantic matching
    const response = await openai.chat.completions.create({
      model: MODELS.default, // Use faster model for matching
      messages: [
        {
          role: "system",
          content: `Match the section title and content with the most relevant sections from the list.
            Consider semantic similarity. Return a JSON object with a 'matches' array of {sectionId, confidence}.
            Only include matches with confidence > 0.5.`
        },
        {
          role: "user",
          content: JSON.stringify({
            section: uploadedSection,
            existingSections: existingSections.map(s => ({
              id: s.id,
              title: s.title
            }))
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.matches || [];
  } catch (error) {
    console.error('Error finding section matches:', error);
    return [];
  }
}

async function mergeSectionContent(
  newContent: string,
  existingContent: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a content merging expert. Combine the two provided sections of content
            intelligently, avoiding duplication and maintaining a coherent flow. Preserve important
            information from both sources. Return the merged content as clean, semantic HTML.`
        },
        {
          role: "user",
          content: JSON.stringify({
            newContent,
            existingContent
          })
        }
      ]
    });

    return response.choices[0].message.content || existingContent;
  } catch (error) {
    console.error('Error merging content:', error);
    return existingContent;
  }
}

async function analyzeUnmatchedContent(
  unmatchedSections: Array<{ title: string; content: string }>,
  existingSections: Section[]
): Promise<Array<{ content: string; potentialSections: Array<{ sectionId: string; relevance: number }> }>> {
  try {
    const response = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: `You are a content analysis expert. For each unmatched section,
            identify existing sections that could be enhanced with this content.
            Consider partial matches and relevant information that could improve
            other sections. Return a JSON array of objects with 'content' and
            'potentialSections' (array of {sectionId, relevance}) properties.`
        },
        {
          role: "user",
          content: JSON.stringify({
            unmatchedSections,
            existingSections: existingSections.map(s => ({
              id: s.id,
              title: s.title
            }))
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.analysis || [];
  } catch (error) {
    console.error('Error analyzing unmatched content:', error);
    return [];
  }
}

// Helper function to extract text content from HTML
export function extractTextFromHTML(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Helper function to convert markdown to HTML
export async function convertMarkdownToHTML(markdown: string): Promise<string> {
  return await marked.parse(markdown);
} 