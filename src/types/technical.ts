// Type definitions for Technical Projects - matches database schema
export interface TechnicalProject {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  github_link: string | null;
  live_link: string | null;
  year: string;
  status: string;
  tech_stack: string[];
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TechnicalProjectInsert {
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  github_link?: string | null;
  live_link?: string | null;
  year: string;
  status?: string;
  tech_stack?: string[];
  display_order?: number;
  is_published?: boolean;
}

export interface TechnicalProjectUpdate {
  title?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  github_link?: string | null;
  live_link?: string | null;
  year?: string;
  status?: string;
  tech_stack?: string[];
  display_order?: number;
  is_published?: boolean;
}
