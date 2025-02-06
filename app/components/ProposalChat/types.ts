export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  files?: File[];
  suggestion?: {
    sectionId: string;
    content: string;
  };
  progress?: {
    stage: 'chunking' | 'processing' | 'merging' | 'matching' | 'analyzing';
    current: number;
    total: number;
    message: string;
  };
}

export interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  currentSection: string | null;
}

export interface ChatActions {
  addMessage: (message: Message) => void;
  setProcessing: (isProcessing: boolean) => void;
  setCurrentSection: (sectionId: string | null) => void;
  clearMessages: () => void;
} 