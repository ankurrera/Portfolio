// Type definitions for technical_about table

export interface TechnicalAboutStat {
  value: string;
  label: string;
}

export interface TechnicalAbout {
  id: string;
  section_label: string;
  heading: string;
  content_blocks: string[]; // Array of paragraph text
  stats: TechnicalAboutStat[];
  location?: string;
  coordinates?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TechnicalAboutFormData {
  section_label: string;
  heading: string;
  content_blocks: string[];
  stats: TechnicalAboutStat[];
  location?: string;
  coordinates?: string;
}
