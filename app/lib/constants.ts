export const TEMPLATES = [
  // Document styles
  { id: 'modern', name: 'Modern Clean', type: 'document' },
  { id: 'classic', name: 'Classic Professional', type: 'document' },
  { id: 'minimal', name: 'Minimal', type: 'document' },
  { id: 'elegant', name: 'Elegant Dark', type: 'document' },
  { id: 'corporate', name: 'Corporate Blue', type: 'document' },
  // Presentation styles
  { id: 'slides-modern', name: 'Modern Slides', type: 'presentation' },
  { id: 'slides-pitch', name: 'Pitch Deck', type: 'presentation' },
  { id: 'slides-minimal', name: 'Minimal Slides', type: 'presentation' }
] as const;

export type TemplateId = typeof TEMPLATES[number]['id'];
export type TemplateType = 'document' | 'presentation'; 