export type AspectRatio = '9:16' | '1:1' | '16:9';

export interface PromptLayer {
  systemPrompt: string;
  userPromptTemplate: string;
  negativePrompt?: string;
  styleModifiers: string[];
}

export interface EditingClip {
  index: number;
  durationMs: number;
  transition?: 'fade' | 'cut' | 'zoom' | 'slide';
  overlay?: { type: 'logo' | 'text'; position: 'top-left' | 'center' | 'bottom-center' };
}

export interface EditingLayer {
  clips: EditingClip[];
  musicTrack?: string;
  aspectRatios: AspectRatio[];
  outputDurationMs: number;
}

export interface MarketingLayer {
  hook: string;
  cta: string;
  tags: string[];
  bestFor: string[];
}

export interface TemplateFilters {
  season: string[];
  occasion: string[];
  styleAndTone: string[];
  colorPalette: string[];
  platform: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  thumbnailUrl: string;
  previewVideoUrl?: string;
  description: string;
  creditCost: number;
  durationSeconds: number;
  prompt: PromptLayer;
  editing: EditingLayer;
  marketing: MarketingLayer;
  filters: TemplateFilters;
}
