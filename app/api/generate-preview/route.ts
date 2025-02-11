import { NextResponse } from 'next/server';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const TEMPLATES = [
  { id: 'modern', name: 'Modern Clean', type: 'document', color: '#3B82F6' },
  { id: 'classic', name: 'Classic Professional', type: 'document', color: '#10B981' },
  { id: 'minimal', name: 'Minimal', type: 'document', color: '#6B7280' },
  { id: 'elegant', name: 'Elegant Dark', type: 'document', color: '#4B5563' },
  { id: 'corporate', name: 'Corporate Blue', type: 'document', color: '#1E40AF' },
  { id: 'slides-modern', name: 'Modern Slides', type: 'presentation', color: '#8B5CF6' },
  { id: 'slides-pitch', name: 'Pitch Deck', type: 'presentation', color: '#EC4899' },
  { id: 'slides-minimal', name: 'Minimal Slides', type: 'presentation', color: '#6B7280' }
];

function generatePreview(template: typeof TEMPLATES[0]) {
  const width = template.type === 'document' ? 600 : 800;
  const height = template.type === 'document' ? 800 : 450;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Add gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `${template.color}22`);
  gradient.addColorStop(1, `${template.color}11`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add template name
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = template.color;
  ctx.textAlign = 'center';
  ctx.fillText(template.name, width / 2, height / 2);

  // Add template type
  ctx.font = '24px Arial';
  ctx.fillStyle = '#666666';
  ctx.fillText(template.type.toUpperCase(), width / 2, height / 2 + 40);

  return canvas.toBuffer('image/png');
}

function generateDefaultPreview() {
  const width = 600;
  const height = 800;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  // Add text
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#6b7280';
  ctx.textAlign = 'center';
  ctx.fillText('Preview Not Available', width / 2, height / 2);

  return canvas.toBuffer('image/png');
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const templatesDir = path.join(publicDir, 'templates');

    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    // Generate preview for each template
    for (const template of TEMPLATES) {
      const previewBuffer = generatePreview(template);
      fs.writeFileSync(
        path.join(templatesDir, `${template.id}-preview.png`),
        new Uint8Array(previewBuffer)
      );
    }

    // Generate default preview
    const defaultPreviewBuffer = generateDefaultPreview();
    fs.writeFileSync(
      path.join(templatesDir, 'default-preview.png'),
      new Uint8Array(defaultPreviewBuffer)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating previews:', error);
    return NextResponse.json(
      { error: 'Failed to generate previews' },
      { status: 500 }
    );
  }
} 