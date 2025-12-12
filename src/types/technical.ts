// Type definitions for Technical Projects
export interface TechnicalProject {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  github_link: string | null;
  live_link: string | null;
  dev_year: string;
  status: string | null;
  languages: string[]; // Array of language/tech names
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TechnicalProjectInsert {
  title: string;
  description: string;
  thumbnail_url?: string | null;
  github_link?: string | null;
  live_link?: string | null;
  dev_year: string;
  status?: string | null;
  languages?: string[];
  display_order?: number;
}

export interface TechnicalProjectUpdate {
  title?: string;
  description?: string;
  thumbnail_url?: string | null;
  github_link?: string | null;
  live_link?: string | null;
  dev_year?: string;
  status?: string | null;
  languages?: string[];
  display_order?: number;
}
