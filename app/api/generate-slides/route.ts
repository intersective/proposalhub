import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
}

export async function POST(req: NextRequest) {
  try {
    const { sections }: { sections: Section[] } = await req.json();
    
    // Filter out non-text sections and company/client info
    const contentSections = sections.filter((s: Section) => 
      s.type === 'text' && s.id !== 'companyInfo' && s.id !== 'clientInfo'
    );

    const response = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating presentation slides. Convert the given sections into RevealJS markdown format.

Rules:
1. Use horizontal slides (---) for main sections
2. Use vertical slides (--) for subsections when content is too long
3. Keep text concise and scannable
4. Use bullet points for lists
5. Add <!-- .element: class="fragment" --> after elements that should animate in
6. Break long sections into multiple slides
7. Add presenter notes using Note: syntax
8. Use markdown formatting for emphasis
9. Each slide should have a clear heading
10. Limit content per slide (max 6 bullet points)
11. Use consistent formatting throughout
12. Include transition hints where appropriate

The output should be in RevealJS markdown format.`
        },
        {
          role: "user",
          content: JSON.stringify(contentSections.map(s => ({
            title: s.title,
            content: s.content
          })))
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const markdown = response.choices[0].message.content;
    if (!markdown) throw new Error('No content returned from AI');

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Error generating slides:', error);
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    );
  }
} 