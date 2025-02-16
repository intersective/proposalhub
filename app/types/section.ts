export interface Section {
  id: string;
  title: string;
  content: string | Record<string, string>;
  type: 'text' | 'fields';
  images?: {
    background?: string[];
    content?: string[];
  };
} 