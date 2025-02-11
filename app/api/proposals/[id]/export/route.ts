import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebaseAdmin';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { TEMPLATES, TemplateId } from '@/app/lib/constants';
import OpenAI from 'openai';

interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
}

interface Proposal {
  id: string;
  title?: string;
  sections: Section[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  lastUpdated: Date;
  companyId?: string;
  clientId?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function formatForPresentation(sections: Section[]): Promise<Section[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at formatting content for presentations. Format the given sections for RevealJS slides.
Rules:
- Use horizontal slides (---) for main sections
- Use vertical slides (--) for subsections
- Keep text concise and scannable
- Use bullet points for lists
- Add <!-- .element: class="fragment" --> after elements that should animate in
- Break long sections into multiple slides
- Add presenter notes using Note: syntax
- Use markdown formatting for emphasis
Output should be in markdown format compatible with RevealJS.`
        },
        {
          role: "user",
          content: JSON.stringify(sections.map(s => ({
            title: s.title,
            content: s.content
          })))
        }
      ]
    });

    const formattedContent = response.choices[0].message.content;
    if (!formattedContent) throw new Error('No content returned from AI');

    // Parse the AI response and update the sections
    const formattedSections = sections.map(section => {
      if (section.type === 'text') {
        return {
          ...section,
          content: formattedContent.split('---').find(s => 
            s.toLowerCase().includes(section.title.toLowerCase())
          )?.trim() || section.content
        };
      }
      return section;
    });

    return formattedSections;
  } catch (error) {
    console.error('Error formatting for presentation:', error);
    return sections;
  }
}

async function generateHTML(proposal: Proposal, templateId: TemplateId = 'modern', brandType: 'client' | 'service' = 'client', primaryColor = '#2563eb', secondaryColor = '#1e40af') {
  const template = TEMPLATES.find(t => t.id === templateId);
  const isPresentation = template?.type === 'presentation';
  console.log('brandType', brandType);
  // Get company and client info from sections
  const companySection = proposal.sections.find((s: Section) => s.id === 'companyInfo');
  const clientSection = proposal.sections.find((s: Section) => s.id === 'clientInfo');
  const companyInfo = companySection?.content as Record<string, string> || {};
  const clientInfo = clientSection?.content as Record<string, string> || {};

  // Get content sections
  const contentSections = proposal.sections.filter(s => 
    s.id !== 'companyInfo' && s.id !== 'clientInfo' && s.type === 'text'
  );

  // If it's a presentation template, format the content appropriately
  const processedSections = isPresentation 
    ? await formatForPresentation(contentSections)
    : contentSections;

  // Convert markdown to HTML for each section
  const sectionsHtml = processedSections.map(section => ({
    ...section,
    content: isPresentation && section.content ? section.content : marked.parse(section.content as string || '')
  }));

  // Common CSS for all templates
  const commonCss = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    :root {
      --primary-color: ${primaryColor};
      --secondary-color: ${secondaryColor};
      --primary-color-light: ${primaryColor}22;
      --secondary-color-light: ${secondaryColor}22;
      --gradient-bg: linear-gradient(135deg, var(--primary-color-light) 0%, var(--secondary-color-light) 100%);
    }
    .company-section {
      color: var(--primary-color);
      border-color: var(--secondary-color);
    }
    .company-section .company-name {
      color: var(--primary-color);
    }
    .company-section .company-details {
      color: var(--secondary-color);
    }
  `;

  // Template-specific styles and layouts
  const templates = {
    modern: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title || 'Proposal'}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          ${commonCss}
          body { font-family: 'Inter', sans-serif; }
          .proposal-section { max-width: 800px; margin: 0 auto; }
          .section-content { line-height: 1.8; }
          .gradient-bg { background: linear-gradient(135deg, ${primaryColor}11 0%, ${secondaryColor}11 100%); }
          h1, h2 { color: var(--primary-color); }
          .border-accent { border-color: var(--secondary-color); }
        </style>
      </head>
      <body class="gradient-bg min-h-screen">
        <div class="proposal-section bg-white shadow-xl rounded-lg my-8 p-8">
          <header class="text-center mb-12 pb-8 border-b company-section">
            <h1 class="text-4xl font-bold mb-4">${proposal.title || 'Proposal'}</h1>
            <div class="company-details">
              <p class="font-medium text-lg company-name">${companyInfo.name || ''}</p>
              <p class="text-lg">Prepared for: ${clientInfo.name || ''}</p>
              <p class="mt-2 text-sm">${new Date().toLocaleDateString()}</p>
            </div>
          </header>
          ${sectionsHtml.map(section => `
            <section class="mb-12">
              <h2 class="text-2xl font-semibold mb-6">${section.title}</h2>
              <div class="section-content text-gray-700 prose max-w-none">${section.content}</div>
            </section>
          `).join('')}
        </div>
      </body>
      </html>
    `,

    'corporate': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title || 'Proposal'}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
          ${commonCss}
          body { font-family: 'Poppins', sans-serif; }
          .proposal-section { max-width: 800px; margin: 0 auto; }
          .section-content { line-height: 1.8; }
          .corporate-gradient { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); }
        </style>
      </head>
      <body class="bg-gray-50">
        <div class="corporate-gradient text-white py-16 mb-8 company-section">
          <div class="proposal-section">
            <h1 class="text-5xl font-bold mb-4">${proposal.title || 'Proposal'}</h1>
            <div class="opacity-90 company-details">
              <p class="font-medium text-xl company-name">${companyInfo.name || ''}</p>
              <p class="text-lg">Prepared for: ${clientInfo.name || ''}</p>
              <p class="mt-2">${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div class="proposal-section bg-white shadow-xl rounded-lg p-8 mb-8">
          ${sectionsHtml.map(section => `
            <section class="mb-12">
              <h2 class="text-2xl font-semibold text-blue-900 mb-6 pb-2 border-b-2 border-blue-100">${section.title}</h2>
              <div class="section-content text-gray-700 prose max-w-none">${section.content}</div>
            </section>
          `).join('')}
        </div>
      </body>
      </html>
    `,

    'slides-modern': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title || 'Proposal'}</title>
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reset.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
        <style>
          ${commonCss}
          body { font-family: 'Inter', sans-serif; }
          .reveal .slides { text-align: left; }
          .reveal h1 { font-size: 2.5em; color: var(--primary-color); margin-bottom: 0.5em; }
          .reveal h2 { font-size: 1.8em; color: var(--secondary-color); margin-bottom: 0.5em; }
          .reveal p { font-size: 1.2em; line-height: 1.4; margin-bottom: 1em; }
          .reveal ul { margin-left: 1em; }
          .reveal li { margin-bottom: 0.5em; }
          .reveal section { height: 100%; padding: 40px; }
          .reveal .slide-background { 
            background: linear-gradient(135deg, ${primaryColor}11 0%, ${secondaryColor}11 100%);
          }
          .reveal .progress { height: 4px; background: ${primaryColor}22; }
          .reveal .progress span { background: var(--primary-color); }
          .reveal .controls { color: var(--primary-color); }
          .reveal .fragment { opacity: 0; transition: opacity 0.3s ease; }
          .reveal .fragment.visible { opacity: 1; }
          .reveal .notes { display: none; }
          @media print {
            .reveal .notes { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="reveal">
          <div class="slides">
            <!-- Title Slide -->
            <section class="company-section">
              <h1>${proposal.title || 'Proposal'}</h1>
              <p class="text-xl mb-8 fragment company-name">${companyInfo.name || ''}</p>
              <p class="text-lg fragment company-details">Prepared for: ${clientInfo.name || ''}</p>
              <p class="text-sm mt-4 fragment">${new Date().toLocaleDateString()}</p>
            </section>
            
            ${sectionsHtml.map(section => section.content).join('\n')}
          </div>
        </div>
        <script>
          Reveal.initialize({
            controls: true,
            progress: true,
            center: false,
            hash: true,
            transition: 'slide',
            width: '100%',
            height: '100%',
            margin: 0.1,
            fragments: true,
            fragmentInURL: true,
            embedded: false,
            help: true,
            autoPlayMedia: true,
            preloadIframes: true,
            autoSlide: 0,
            loop: false,
            rtl: false,
            navigationMode: 'default',
            shuffle: false,
            hideInactiveCursor: true,
            hideCursorTime: 3000,
            slideNumber: 'c/t',
            showSlideNumber: 'all',
            overview: true,
            touch: true,
            hideAddressBar: true,
            previewLinks: false,
            transitionSpeed: 'default',
            backgroundTransition: 'fade'
          });
        </script>
      </body>
      </html>
    `,

    'slides-pitch': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title || 'Proposal'}</title>
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reset.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/black.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
        <style>
          ${commonCss}
          body { font-family: 'Poppins', sans-serif; }
          .reveal .slides { text-align: left; }
          .reveal h1 { 
            font-size: 3em; 
            background: linear-gradient(45deg, #3b82f6, #2563eb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5em;
          }
          .reveal h2 { 
            font-size: 2em; 
            color: #60a5fa;
            margin-bottom: 0.5em;
          }
          .reveal p { font-size: 1.4em; line-height: 1.4; margin-bottom: 1em; }
          .reveal ul { margin-left: 1em; }
          .reveal li { margin-bottom: 0.5em; }
          .reveal section { 
            height: 100%; 
            padding: 60px;
            background: radial-gradient(circle at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%);
          }
          .reveal .progress { height: 4px; background: rgba(59, 130, 246, 0.2); }
          .reveal .progress span { background: #3b82f6; }
          .reveal .controls { color: #3b82f6; }
          .reveal .fragment { 
            opacity: 0; 
            transform: translateY(20px);
            transition: all 0.5s ease;
          }
          .reveal .fragment.visible { 
            opacity: 1;
            transform: translateY(0);
          }
          .reveal .notes { display: none; }
          @media print {
            .reveal .notes { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="reveal">
          <div class="slides">
            <!-- Title Slide -->
            <section>
              <h1 class="fragment">${proposal.title || 'Proposal'}</h1>
              <p class="text-xl mb-8 fragment">${companyInfo.name || ''}</p>
              <p class="text-lg fragment">Prepared for: ${clientInfo.name || ''}</p>
              <p class="text-sm mt-4 fragment">${new Date().toLocaleDateString()}</p>
            </section>
            
            ${sectionsHtml.map(section => section.content).join('\n')}
          </div>
        </div>
        <script>
          Reveal.initialize({
            controls: true,
            progress: true,
            center: false,
            hash: true,
            transition: 'slide',
            width: '100%',
            height: '100%',
            margin: 0.1,
            fragments: true,
            fragmentInURL: true,
            embedded: false,
            help: true,
            autoPlayMedia: true,
            preloadIframes: true,
            autoSlide: 0,
            loop: false,
            rtl: false,
            navigationMode: 'default',
            shuffle: false,
            hideInactiveCursor: true,
            hideCursorTime: 3000,
            slideNumber: 'c/t',
            showSlideNumber: 'all',
            overview: true,
            touch: true,
            hideAddressBar: true,
            previewLinks: false,
            transitionSpeed: 'default',
            backgroundTransition: 'fade'
          });
        </script>
      </body>
      </html>
    `,

    'slides-minimal': `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${proposal.title || 'Proposal'}</title>
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reset.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/simple.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
        <style>
          ${commonCss}
          body { font-family: 'Inter', sans-serif; }
          .reveal .slides { text-align: left; }
          .reveal h1 { 
            font-size: 2.8em; 
            color: #111827;
            font-weight: 300;
            margin-bottom: 0.8em;
          }
          .reveal h2 { 
            font-size: 2em; 
            color: #374151;
            font-weight: 300;
            margin-bottom: 0.8em;
          }
          .reveal p { 
            font-size: 1.3em; 
            line-height: 1.6; 
            margin-bottom: 1em;
            color: #4b5563;
          }
          .reveal ul { margin-left: 1em; color: #4b5563; }
          .reveal li { margin-bottom: 0.8em; }
          .reveal section { 
            height: 100%; 
            padding: 60px;
            background: #ffffff;
          }
          .reveal .progress { 
            height: 2px; 
            background: rgba(17, 24, 39, 0.1); 
          }
          .reveal .progress span { background: #111827; }
          .reveal .controls { color: #111827; }
          .reveal .fragment { 
            opacity: 0; 
            transform: translateX(-20px);
            transition: all 0.8s ease;
          }
          .reveal .fragment.visible { 
            opacity: 1;
            transform: translateX(0);
          }
          .reveal .notes { display: none; }
          @media print {
            .reveal .notes { display: block; }
          }
        </style>
      </head>
      <body>
        <div class="reveal">
          <div class="slides">
            <!-- Title Slide -->
            <section>
              <h1 class="fragment">${proposal.title || 'Proposal'}</h1>
              <p class="text-xl mb-8 fragment">${companyInfo.name || ''}</p>
              <p class="text-lg fragment">Prepared for: ${clientInfo.name || ''}</p>
              <p class="text-sm mt-4 fragment">${new Date().toLocaleDateString()}</p>
            </section>
            
            ${sectionsHtml.map(section => section.content).join('\n')}
          </div>
        </div>
        <script>
          Reveal.initialize({
            controls: true,
            progress: true,
            center: false,
            hash: true,
            transition: 'fade',
            width: '100%',
            height: '100%',
            margin: 0.1,
            fragments: true,
            fragmentInURL: true,
            embedded: false,
            help: true,
            autoPlayMedia: true,
            preloadIframes: true,
            autoSlide: 0,
            loop: false,
            rtl: false,
            navigationMode: 'default',
            shuffle: false,
            hideInactiveCursor: true,
            hideCursorTime: 3000,
            slideNumber: 'c/t',
            showSlideNumber: 'all',
            overview: true,
            touch: true,
            hideAddressBar: true,
            previewLinks: false,
            transitionSpeed: 'slow',
            backgroundTransition: 'fade'
          });
        </script>
      </body>
      </html>
    `
  };

  // Add other templates here...
  return templates[templateId as keyof typeof templates] || templates.modern;
}

async function generateMarkdown(proposal: Proposal) {
  const sections = proposal.sections || [];
  let markdown = `# ${proposal.title || 'Proposal'}\n\n`;

  // Add company and client info
  const companySection = sections.find((s: Section) => s.id === 'companyInfo');
  const clientSection = sections.find((s: Section) => s.id === 'clientInfo');

  if (companySection?.content) {
    markdown += '## Company Information\n\n';
    Object.entries(companySection.content).forEach(([key, value]) => {
      markdown += `- **${key}**: ${value}\n`;
    });
    markdown += '\n';
  }

  if (clientSection?.content) {
    markdown += '## Client Information\n\n';
    Object.entries(clientSection.content).forEach(([key, value]) => {
      markdown += `- **${key}**: ${value}\n`;
    });
    markdown += '\n';
  }

  // Add content sections
  sections
    .filter((s: Section) => s.id !== 'companyInfo' && s.id !== 'clientInfo')
    .forEach((section: Section) => {
      markdown += `## ${section.title}\n\n${section.content || ''}\n\n`;
    });

  return markdown;
}

async function generatePDF(html: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({ format: 'A4', margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' } });
  await browser.close();
  return pdf;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const format = searchParams.get('format') || 'html';
    const templateId = searchParams.get('template') as TemplateId || 'modern';
    //const type = searchParams.get('type') || 'document';
    const brandType = searchParams.get('brandType') as 'client' | 'service' || 'client';
    const primaryColor = searchParams.get('primaryColor') || '#2563eb';
    const secondaryColor = searchParams.get('secondaryColor') || '#1e40af';
    const { id } = await params;
    // Get proposal data
    const proposalRef = adminDb.collection('proposals').doc(id);
    const proposalDoc = await proposalRef.get();
    
    if (!proposalDoc.exists) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposal = { id: proposalDoc.id, ...proposalDoc.data() } as Proposal;

    switch (format) {
      case 'html': {
        const html = await generateHTML(proposal, templateId, brandType, primaryColor, secondaryColor);
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      case 'pdf': {
        const html = await generateHTML(proposal, templateId, brandType, primaryColor, secondaryColor);
        const pdf = await generatePDF(html);
        return new NextResponse(pdf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="proposal.pdf"'
          }
        });
      }
      case 'markdown': {
        const markdown = await generateMarkdown(proposal);
        return new NextResponse(markdown, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': 'attachment; filename="proposal.md"'
          }
        });
      }
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error exporting proposal:', error);
    return NextResponse.json(
      { error: 'Failed to export proposal' },
      { status: 500 }
    );
  }
} 