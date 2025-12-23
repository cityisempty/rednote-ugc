
export enum AppView {
  OUTLINE_GENERATOR = 'OUTLINE_GENERATOR',
  NOTE_GENERATION = 'NOTE_GENERATION',
  SETTINGS = 'SETTINGS'
}

export interface ProductInfo {
  name: string;
  audience: string;
  description: string;
  features: string;
  style: string;
}

export interface NoteOutline {
  titleSuggestions: string[];
  hook: string;
  mainPoints: string[];
  imagePrompts: string[];
}

export interface GeneratedNote {
  id: string;
  productName: string;
  style: string;
  title: string;
  content: string;
  tags: string[];
  images: string[]; // base64 or urls
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
}
