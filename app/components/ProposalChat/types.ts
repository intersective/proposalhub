export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  files?: File[];
  suggestion?: {
    content: string;
    sectionId: string;
    isDraft?: boolean;
  };
  progress?: {
    stage: 'chunking' | 'processing' | 'merging' | 'matching' | 'analyzing';
    current: number;
    total: number;
    message: string;
  };
  model?: string;
  context?: {
    sectionId: string;
    type: 'draft' | 'improvement';
    relevantInfo?: string[];
  };
}

export interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  currentSection: string | null;
  currentModel: string;
  draftingSections: Record<string, boolean>;
  improvableSections: string[];
  chatContext: {
    relevantInfo: string[];
    lastMessageIndex: number;
  };
}

export interface ChatActions {
  addMessage: (message: Message) => void;
  setProcessing: (isProcessing: boolean) => void;
  setCurrentSection: (sectionId: string | null) => void;
  setCurrentModel: (model: string) => void;
  clearMessages: () => void;
}

export interface ChatContainerProps {
  onSectionUpdate: (sectionId: string, content: string | Record<string, string>) => Promise<void>;
  onSectionImprove: (sectionId: string) => Promise<string>;
  onDocumentAnalysis: (content: string, signal: AbortSignal) => Promise<void>;
  currentSection?: string | null;
  onSetCurrentSection?: (sectionId: string | null) => void;
  isImproving?: boolean;
  sections?: { 
    id: string; 
    title: string; 
    content?: string | Record<string, string>;
    type: 'text' | 'fields';
  }[];
  onDraftingSectionsUpdate?: (updates: Record<string, boolean>) => void;
  onImprovableSectionsUpdate?: (sectionIds: string[]) => void;
}

// do not change rhese
export const MODEL_OPTIONS = [
  { name: 'GPT-4o-mini (Default)', value: 'gpt-4o-mini' },
  { name: 'o3-mini (Fast reasoning)', value: 'o3-mini' },
  { name: 'GPT-4o (Deeper knowledge)', value: 'gpt-4o' },
  { name: 'o1 (Most Capable)', value: 'o1' },
]; 